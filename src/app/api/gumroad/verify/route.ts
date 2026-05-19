import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GUMROAD_API_TOKEN = process.env.GUMROAD_API_TOKEN || "";
const GUMROAD_PRODUCT_IDS = (process.env.GUMROAD_PRODUCT_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export const runtime = "nodejs";

function getSuggestedProductId(message: string): string | null {
  const match = message.match(/product_id['"]?\s+to\s+['"]([^'"]+)['"]/i);
  return match?.[1] || null;
}

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
  let data: Record<string, unknown> | null = null;
  let matchedProductId: string | null = null;
  let lastError = "Invalid license key";
  const normalizedLicenseKey = licenseKey.trim();

  for (const productIdentifier of GUMROAD_PRODUCT_IDS) {
    const attempts: Array<["product_id" | "product_permalink", string]> = [
      ["product_id", productIdentifier],
      ["product_permalink", productIdentifier],
    ];
    const attempted = new Set<string>();

    for (let index = 0; index < attempts.length; index++) {
      const [productField, productValue] = attempts[index];
      const attemptKey = `${productField}:${productValue}`;
      if (attempted.has(attemptKey)) continue;
      attempted.add(attemptKey);

      const body = new URLSearchParams({
        [productField]: productValue,
        license_key: normalizedLicenseKey,
        increment_uses_count: "false",
      });

      const verifyRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const result = await verifyRes.json().catch(() => null);
      if (verifyRes.ok) {
        if (result?.success === true) {
          data = result;
          matchedProductId = result.purchase?.product_id || productIdentifier;
          break;
        }
      }

      if (typeof result?.message === "string" && result.message.trim()) {
        lastError = result.message;
        const suggestedProductId = getSuggestedProductId(result.message);
        if (suggestedProductId) {
          attempts.push(["product_id", suggestedProductId]);
        }
      }
    }

    if (data) break;
  }

  if (!data) {
    return NextResponse.json({ error: lastError }, { status: 400 });
  }

  const purchase = (data.purchase || {}) as Record<string, unknown>;
  const subscriptionId = (purchase.subscription_id as string) || null;
  const currentPeriodEnd = subscriptionId
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days for subscription
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default 365 days for one-time

  // Update user with Gumroad Pro status
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "pro",
      gumroadLicenseKey: normalizedLicenseKey,
      gumroadProductId: matchedProductId,
      gumroadSubscriptionId: subscriptionId,
      gumroadCurrentPeriodEnd: currentPeriodEnd,
    },
  });

  return NextResponse.json({ success: true, isPro: true });
}
