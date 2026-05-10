import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GUMROAD_API_TOKEN = process.env.GUMROAD_API_TOKEN || "";
const GUMROAD_PRODUCT_IDS = (process.env.GUMROAD_PRODUCT_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!GUMROAD_API_TOKEN || GUMROAD_PRODUCT_IDS.length === 0) {
    return NextResponse.json({ error: "Gumroad not configured" }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { licenseKey } = await req.json();
  if (!licenseKey || typeof licenseKey !== "string") {
    return NextResponse.json({ error: "License key required" }, { status: 400 });
  }

  // Verify license against all product IDs
  let data: any = null;
  let matchedProductId: string | null = null;

  for (const productId of GUMROAD_PRODUCT_IDS) {
    const verifyRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        license_key: licenseKey.trim(),
      }),
    });

    if (verifyRes.ok) {
      const result = await verifyRes.json();
      if (result.success && result.uses) {
        data = result;
        matchedProductId = productId;
        break;
      }
    }
  }

  if (!data) {
    return NextResponse.json({ error: "Invalid license key" }, { status: 400 });
  }

  const purchase = data.purchase || {};
  const subscriptionId = purchase.subscription_id || null;
  const currentPeriodEnd = subscriptionId
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days for subscription
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default 365 days for one-time

  // Update user with Gumroad Pro status
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "pro",
      gumroadLicenseKey: licenseKey.trim(),
      gumroadProductId: matchedProductId,
      gumroadSubscriptionId: subscriptionId,
      gumroadCurrentPeriodEnd: currentPeriodEnd,
    },
  });

  return NextResponse.json({ success: true, isPro: true });
}
