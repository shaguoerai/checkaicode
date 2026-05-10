import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" as any }) : null;

const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "";
const PRO_YEARLY_PRICE_ID = process.env.STRIPE_PRO_YEARLY_PRICE_ID || "";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const billing = searchParams.get("billing") || "monthly";
  const priceId = billing === "yearly" ? PRO_YEARLY_PRICE_ID : PRO_MONTHLY_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create Stripe customer on first checkout if missing
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    user = await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId!,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    client_reference_id: user.id,
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
