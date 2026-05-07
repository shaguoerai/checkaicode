import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" }) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const subData = subscription as any;
      await prisma.user.update({
        where: { id: session.client_reference_id! },
        data: {
          role: "pro",
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subData.current_period_end * 1000),
        },
      });
      break;
    }
    case "invoice.payment_failed": {
      const subscription = event.data.object as Stripe.Invoice;
      await prisma.user.updateMany({
        where: { stripeCustomerId: subscription.customer as string },
        data: { role: "free" },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { role: "free" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
