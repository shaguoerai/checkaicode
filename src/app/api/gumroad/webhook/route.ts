import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GUMROAD_API_TOKEN = process.env.GUMROAD_API_TOKEN || "";
const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID || "";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!GUMROAD_API_TOKEN || !GUMROAD_PRODUCT_ID) {
    return NextResponse.json({ error: "Gumroad not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get("x-gumroad-signature") || "";

  // Gumroad webhooks don't have built-in signature verification like Stripe,
  // but we can validate the payload structure and product_id
  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate product_id matches our configured product
  if (event.product_id !== GUMROAD_PRODUCT_ID) {
    return NextResponse.json({ error: "Product mismatch" }, { status: 400 });
  }

  const email = event.email || event.purchaser_email || "";
  const licenseKey = event.license_key || "";
  const subscriptionId = event.subscription_id || event.recurrence || "";
  const eventType = event.recurrence ? "subscription_recurring_charge" : event.resource_name || "sale";

  // Find user by email or license key
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { gumroadLicenseKey: licenseKey },
      ],
    },
  });

  if (!user && eventType !== "sale") {
    // For subscription events, we need an existing user
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  switch (eventType) {
    case "sale": {
      if (!user) {
        // First-time purchase: user will activate via /api/gumroad/verify
        return NextResponse.json({ received: true, note: "User will activate via license key" });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "pro",
          gumroadLicenseKey: licenseKey || user.gumroadLicenseKey,
          gumroadProductId: GUMROAD_PRODUCT_ID,
          gumroadSubscriptionId: subscriptionId || user.gumroadSubscriptionId,
          gumroadCurrentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
            gumroadCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
