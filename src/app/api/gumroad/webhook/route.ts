import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GUMROAD_PRODUCT_IDS = ["zrvmiq", "oytjtg"];

export const runtime = "nodejs";

function getPeriodDays(productId: string): number {
  return productId === "oytjtg" ? 365 : 30;
}

function resolveEventType(event: Record<string, unknown>): string {
  // Priority: resource_name > event > type > fallback
  const raw =
    (event.resource_name as string) ||
    (event.event as string) ||
    (event.type as string) ||
    "";
  return raw.toLowerCase().trim();
}

function parsePayload(req: Request, text: string): Record<string, unknown> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(text);
    const result: Record<string, unknown> = {};
    for (const [key, value] of params) {
      // Gumroad may send nested JSON strings for some fields
      if (value.startsWith("{") || value.startsWith("[")) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // Fallback: try JSON first, then form-urlencoded
  try {
    return JSON.parse(text);
  } catch {
    const params = new URLSearchParams(text);
    const result: Record<string, unknown> = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }
}

export async function POST(req: Request) {
  const payload = await req.text();

  let event: Record<string, unknown>;
  try {
    event = parsePayload(req, payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventType = resolveEventType(event);

  // Minimal safe log: event type + product_id only, no PII
  const productId = (event.product_id as string) || "";
  console.log(`[gumroad-webhook] event=${eventType} product=${productId}`);

  if (!GUMROAD_PRODUCT_IDS.includes(productId)) {
    return NextResponse.json({ error: "Product mismatch" }, { status: 400 });
  }

  const periodDays = getPeriodDays(productId);

  const email = (event.email as string) || (event.purchaser_email as string) || "";
  const licenseKey = (event.license_key as string) || "";
  const subscriptionId = (event.subscription_id as string) || "";

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { gumroadLicenseKey: licenseKey },
      ],
    },
  });

  // Unknown event types: log and return 200 to avoid Gumroad retry storms
  const knownEvents = new Set([
    "sale",
    "subscription_recurring_charge",
    "subscription_renewed",
    "subscription_cancelled",
    "cancellation",
    "subscription_ended",
    "subscription_payment_failed",
    "refund",
    "dispute",
    "dispute_won",
    "subscription_restarted",
    "subscription_updated",
  ]);

  if (!knownEvents.has(eventType)) {
    console.log(`[gumroad-webhook] unknown event type: ${eventType}`);
    return NextResponse.json({ received: true, note: "Unknown event type" });
  }

  if (!user && eventType !== "sale") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  switch (eventType) {
    case "sale": {
      if (!user) {
        return NextResponse.json({ received: true, note: "User will activate via license key" });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "pro",
          gumroadLicenseKey: licenseKey || user.gumroadLicenseKey,
          gumroadProductId: productId,
          gumroadSubscriptionId: subscriptionId || user.gumroadSubscriptionId,
          gumroadCurrentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
        },
      });
      break;
    }
    case "subscription_recurring_charge":
    case "subscription_renewed":
    case "subscription_restarted":
    case "subscription_updated": {
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "pro",
            gumroadCurrentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
          },
        });
      }
      break;
    }
    case "subscription_cancelled":
    case "cancellation": {
      if (user) {
        // 用户取消订阅：保留已付周期，不立刻降级
        // Pro 会在 gumroadCurrentPeriodEnd 到期后自然失效
        await prisma.user.update({
          where: { id: user.id },
          data: {
            gumroadSubscriptionId: null,
          },
        });
      }
      break;
    }
    case "subscription_ended": {
      if (user) {
        const now = new Date();
        const stripeActive = user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now;
        // 周期真正结束：如果无 Stripe 权益则降级
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: stripeActive ? "pro" : "free",
            gumroadSubscriptionId: null,
          },
        });
      }
      break;
    }
    case "subscription_payment_failed": {
      if (user) {
        // 支付失败：保留当前已付周期，不立刻降级
        // 用户可在周期内更新支付方式
        await prisma.user.update({
          where: { id: user.id },
          data: {
            gumroadSubscriptionId: null,
          },
        });
      }
      break;
    }
    case "refund": {
      // 退款事件：暂不自动降级，需人工审核或根据退款类型处理
      console.log(`[gumroad-webhook] refund received product=${productId}`);
      break;
    }
    case "dispute":
    case "dispute_won": {
      // 争议事件：记录日志，暂不自动处理
      console.log(`[gumroad-webhook] dispute event=${eventType} product=${productId}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
