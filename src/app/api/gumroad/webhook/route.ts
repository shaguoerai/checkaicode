import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GUMROAD_PRODUCT_IDS = ["zrvmiq", "oytjtg"];

export const runtime = "nodejs";

function getPeriodDays(productId: string): number {
  return productId === "oytjtg" ? 365 : 30;
}

export async function POST(req: Request) {
  const payload = await req.text();

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const productId = event.product_id || "";
  if (!GUMROAD_PRODUCT_IDS.includes(productId)) {
    return NextResponse.json({ error: "Product mismatch" }, { status: 400 });
  }

  const periodDays = getPeriodDays(productId);

  const email = event.email || event.purchaser_email || "";
  const licenseKey = event.license_key || "";
  const subscriptionId = event.subscription_id || event.recurrence || "";
  const eventType = event.recurrence ? "subscription_recurring_charge" : event.resource_name || "sale";

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { gumroadLicenseKey: licenseKey },
      ],
    },
  });

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
    case "subscription_renewed": {
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
    case "subscription_ended": {
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "free",
            gumroadSubscriptionId: null,
            gumroadCurrentPeriodEnd: new Date(),
          },
        });
      }
      break;
    }
    case "subscription_payment_failed": {
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "free",
            gumroadCurrentPeriodEnd: new Date(),
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
