import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CREEM_API_BASE_URL, CREEM_PRODUCT_ID, getAppUrl } from "@/lib/creem";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Creem is not configured" }, { status: 500 });
  }

  const appUrl = getAppUrl();
  const response = await fetch(`${CREEM_API_BASE_URL}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      product_id: CREEM_PRODUCT_ID,
      request_id: session.user.id,
      units: 1,
      success_url: `${appUrl}/review?checkout=success`,
      customer: {
        email: session.user.email,
      },
      metadata: {
        userId: session.user.id,
        email: session.user.email,
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
