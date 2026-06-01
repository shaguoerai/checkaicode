import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isAnnualCreemProduct,
  isKnownCreemProduct,
  parseDateOrFallback,
  verifyCreemSignature,
} from "@/lib/creem";

export const runtime = "nodejs";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function resolveProductId(object: JsonObject) {
  const product = asObject(object.product);
  const order = asObject(object.order);
  const subscription = asObject(object.subscription);
  const subscriptionProduct = asObject(subscription.product);

  return (
    getString(product.id) ||
    getString(object.product) ||
    getString(order.product) ||
    getString(subscriptionProduct.id) ||
    getString(subscription.product)
  );
}

function resolveCustomer(object: JsonObject) {
  return asObject(object.customer);
}

function resolveMetadata(object: JsonObject) {
  const subscription = asObject(object.subscription);
  const metadata = asObject(object.metadata);
  return Object.keys(metadata).length > 0 ? metadata : asObject(subscription.metadata);
}

function resolveSubscriptionId(object: JsonObject) {
  const subscription = asObject(object.subscription);
  return getString(subscription.id) || getString(object.id);
}

async function findUser(object: JsonObject) {
  const customer = resolveCustomer(object);
  const metadata = resolveMetadata(object);
  const rawRequestId = getString(object.request_id);
  const userId = getString(metadata.userId) || rawRequestId.split(":")[0];
  const email = getString(customer.email) || getString(metadata.email);
  const subscriptionId = resolveSubscriptionId(object);

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  if (subscriptionId) {
    const user = await prisma.user.findFirst({ where: { creemSubscriptionId: subscriptionId } });
    if (user) return user;
  }

  if (email) {
    return prisma.user.findUnique({ where: { email } });
  }

  return null;
}

async function downgradeIfNoOtherActivePlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialEndsAt: true,
      stripeCurrentPeriodEnd: true,
      gumroadCurrentPeriodEnd: true,
    },
  });

  const now = new Date();
  const trialActive = user?.trialEndsAt && user.trialEndsAt > now;
  const stripeActive = user?.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now;
  const gumroadActive = user?.gumroadCurrentPeriodEnd && user.gumroadCurrentPeriodEnd > now;

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: trialActive || stripeActive || gumroadActive ? "pro" : "free",
      creemSubscriptionId: null,
      creemCurrentPeriodEnd: null,
    },
  });
}

async function grantAccess(object: JsonObject) {
  const productId = resolveProductId(object);
  if (!isKnownCreemProduct(productId)) {
    console.log(`[creem-webhook] ignoring product=${productId}`);
    return;
  }

  const user = await findUser(object);
  if (!user) {
    console.log("[creem-webhook] user not found");
    return;
  }

  const customer = resolveCustomer(object);
  const fallbackDays = isAnnualCreemProduct(productId) ? 370 : 32;
  const periodEnd = parseDateOrFallback(
    object.current_period_end_date || object.current_period_end,
    fallbackDays
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "pro",
      creemCustomerId: getString(customer.id) || user.creemCustomerId,
      creemProductId: productId,
      creemSubscriptionId: resolveSubscriptionId(object) || user.creemSubscriptionId,
      creemCurrentPeriodEnd: periodEnd,
    },
  });
}

async function preserveUntilPeriodEnd(object: JsonObject) {
  const user = await findUser(object);
  if (!user) return;
  const productId = resolveProductId(object);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      creemSubscriptionId: null,
      creemCurrentPeriodEnd:
        typeof object.current_period_end_date === "string" ||
        typeof object.current_period_end === "string"
          ? parseDateOrFallback(
              object.current_period_end_date || object.current_period_end,
              isAnnualCreemProduct(productId) ? 370 : 32
            )
          : user.creemCurrentPeriodEnd,
    },
  });
}

async function revokeAccess(object: JsonObject) {
  const user = await findUser(object);
  if (!user) return;

  await downgradeIfNoOtherActivePlan(user.id);
}

export async function POST(req: Request) {
  const payload = await req.text();
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET || "";

  if (!verifyCreemSignature(payload, req.headers.get("creem-signature"), webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: JsonObject;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventType = getString(event.eventType);
  const object = asObject(event.object);
  console.log(`[creem-webhook] event=${eventType} product=${resolveProductId(object)}`);

  switch (eventType) {
    case "checkout.completed":
    case "subscription.paid":
    case "subscription.active":
      await grantAccess(object);
      break;
    case "subscription.canceled":
    case "subscription.scheduled_cancel":
    case "subscription.past_due":
    case "subscription.paused":
      await preserveUntilPeriodEnd(object);
      break;
    case "subscription.expired": {
      const user = await findUser(object);
      if (user) await downgradeIfNoOtherActivePlan(user.id);
      break;
    }
    case "subscription.update":
    case "subscription.updated":
      if (getString(object.status) === "active") {
        await grantAccess(object);
      }
      break;
    case "refund.created":
    case "dispute.created":
      await revokeAccess(object);
      break;
    default:
      console.log(`[creem-webhook] unhandled event=${eventType}`);
  }

  return NextResponse.json({ received: true });
}
