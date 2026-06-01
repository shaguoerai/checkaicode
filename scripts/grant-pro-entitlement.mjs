#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] && !args[index + 1].startsWith("--") ? args[index + 1] : "";
}

function hasFlag(name) {
  return args.includes(name);
}

function usage() {
  console.error(`Usage:
  npm run ops:grant-pro -- --email user@example.com --period monthly --confirm
  npm run ops:grant-pro -- --email user@example.com --period annual --subscription-id sub_xxx --confirm

Options:
  --email <email>                Required. Existing Check AI Code user email.
  --period <monthly|annual>      Defaults to monthly.
  --days <number>                Override entitlement length. Defaults: 31 monthly, 366 annual.
  --subscription-id <id>         Optional Creem subscription id from the dashboard.
  --customer-id <id>             Optional Creem customer id from the dashboard.
  --product-id <id>              Optional Creem product id. Defaults to CREEM_PRODUCT_ID or CREEM_ANNUAL_PRODUCT_ID.
  --dry-run                      Show the change without writing.
  --confirm                      Required unless --dry-run is set.
`);
}

const email = readFlag("--email")?.trim().toLowerCase();
const period = (readFlag("--period") || "monthly").trim().toLowerCase();
const daysValue = readFlag("--days");
const dryRun = hasFlag("--dry-run");
const confirm = hasFlag("--confirm");

if (!email || !email.includes("@")) {
  usage();
  process.exit(1);
}

if (!["monthly", "annual"].includes(period)) {
  console.error("Invalid --period. Use monthly or annual.");
  process.exit(1);
}

if (!dryRun && !confirm) {
  console.error("Refusing to write without --confirm. Use --dry-run to preview.");
  process.exit(1);
}

const defaultDays = period === "annual" ? 366 : 31;
const days = daysValue ? Number(daysValue) : defaultDays;

if (!Number.isFinite(days) || days <= 0) {
  console.error("Invalid --days. Use a positive number.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const productId =
  readFlag("--product-id") ||
  (period === "annual" ? process.env.CREEM_ANNUAL_PRODUCT_ID : process.env.CREEM_PRODUCT_ID) ||
  null;

const subscriptionId = readFlag("--subscription-id") || `manual_${period}_${Date.now()}`;
const customerId = readFlag("--customer-id") || null;
const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      trialEndsAt: true,
      creemProductId: true,
      creemSubscriptionId: true,
      creemCurrentPeriodEnd: true,
    },
  });

  if (!user) {
    console.error(`No user found for ${email}. Ask the customer to sign in once before granting Pro.`);
    process.exit(1);
  }

  const next = {
    role: "pro",
    creemCustomerId: customerId,
    creemProductId: productId,
    creemSubscriptionId: subscriptionId,
    creemCurrentPeriodEnd: periodEnd,
  };

  console.log("Current entitlement:");
  console.log(JSON.stringify(user, null, 2));
  console.log("Next entitlement:");
  console.log(JSON.stringify({ email, period, days, ...next }, null, 2));

  if (dryRun) {
    console.log("Dry run only. No changes written.");
    process.exit(0);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: next,
    select: {
      id: true,
      email: true,
      role: true,
      creemProductId: true,
      creemSubscriptionId: true,
      creemCurrentPeriodEnd: true,
      updatedAt: true,
    },
  });

  console.log("Updated entitlement:");
  console.log(JSON.stringify(updated, null, 2));
} finally {
  await prisma.$disconnect();
}
