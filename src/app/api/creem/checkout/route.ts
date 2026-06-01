import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CREEM_API_BASE_URL,
  CreemBillingPeriod,
  getAppUrl,
  getCreemProductId,
} from "@/lib/creem";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Creem is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const period: CreemBillingPeriod = body?.period === "annual" ? "annual" : "monthly";
  const productId = getCreemProductId(period);

  if (!productId) {
    return NextResponse.json({ error: "Annual checkout is not configured yet" }, { status: 500 });
  }

  const appUrl = getAppUrl();
  const response = await fetch(`${CREEM_API_BASE_URL}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      product_id: productId,
      request_id: `${session.user.id}:${period}`,
      units: 1,
      success_url: `${appUrl}/review?checkout=success`,
      customer: {
        email: session.user.email,
      },
      metadata: {
        userId: session.user.id,
        email: session.user.email,
        period,
      },
    }),
  });

  const data = await response.json().catch(() => null);
  const checkoutUrl = data?.checkout_url || data?.checkoutUrl || data?.url;

  if (!response.ok || typeof checkoutUrl !== "string") {
    console.error("[creem-checkout] failed", {
      status: response.status,
      error: data?.error || data?.message || "unknown",
    });
    return NextResponse.json({ error: "Unable to create checkout" }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl });
}
