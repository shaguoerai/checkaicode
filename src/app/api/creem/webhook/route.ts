import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CREEM_PRODUCT_ID, parseDateOrFallback, verifyCreemSignature } from "@/lib/creem";

export const runtime = "nodejs";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function resolveProductId(object: JsonObject) {
  const product = asObject(object.product);
  return getString(product.id) || getString(object.product);
}

function resolveCustomer(object: JsonObject) {
  return asObject(object.customer);
}

function resolveMetadata(object: JsonObject) {
  return asObject(object.metadata);
}

async function findUser(object: JsonObject) {
  const customer = resolveCustomer(object);
  const metadata = resolveMetadata(object);
  const userId = getString(metadata.userId) || getString(object.request_id);
  const email = getString(customer.email) || getString(metadata.email);

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
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
      stripeCurrentPeriodEnd: true,
      gumroadCurrentPeriodEnd: true,
    },
  });

  const now = new Date();
  const stripeActive = user?.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now;
  const gumroadActive = user?.gumroadCurrentPeriodEnd && user.gumroadCurrentPeriodEnd > now;

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: stripeActive || gumroadActive ? "pro" : "free",
      creemSubscriptionId: null,
      creemCurrentPeriodEnd: null,
    },
  });
}

async function grantAccess(object: JsonObject) {
  const productId = resolveProductId(object);
  if (productId !== CREEM_PRODUCT_ID) {
    console.log(`[creem-webhook] ignoring product=${productId}`);
    return;
  }

  const user = await findUser(object);
  if (!user) {
    console.log("[creem-webhook] user not found");
    return;
  }

  const customer = resolveCustomer(object);
  const periodEnd = parseDateOrFallback(
    object.current_period_end_date || object.current_period_end,
    32
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "pro",
      creemCustomerId: getString(customer.id) || user.creemCustomerId,
      creemProductId: productId,
      creemSubscriptionId: getString(object.id) || user.creemSubscriptionId,
      creemCurrentPeriodEnd: periodEnd,
    },
  });
}

async function preserveUntilPeriodEnd(object: JsonObject) {
  const user = await findUser(object);
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      creemSubscriptionId: null,
      creemCurrentPeriodEnd:
        typeof object.current_period_end_date === "string" ||
        typeof object.current_period_end === "string"
          ? parseDateOrFallback(object.current_period_end_date || object.current_period_end, 32)
          : user.creemCurrentPeriodEnd,
    },
  });
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
    case "checkout.completed":
    case "subscription.update":
    case "subscription.updated":
    case "refund.created":
    case "dispute.created":
      break;
    default:
      console.log(`[creem-webhook] unhandled event=${eventType}`);
  }

  return NextResponse.json({ received: true });
}
