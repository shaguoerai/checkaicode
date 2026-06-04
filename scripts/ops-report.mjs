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
  npm run ops:report
  npm run ops:report -- --days 14
  npm run ops:report -- --json
  npm run ops:report -- --show-emails

Options:
  --days <number>       Reporting window. Defaults to 7.
  --json                Output raw JSON instead of a readable report.
  --show-emails         Show full user emails in recent-user rows.
`);
}

const days = Number(readFlag("--days") || 7);
const jsonOutput = hasFlag("--json");
const showEmails = hasFlag("--show-emails");

if (!Number.isFinite(days) || days <= 0 || days > 366) {
  usage();
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const now = new Date();
const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const startDay = start.toISOString().slice(0, 10);

function isActive(date) {
  return Boolean(date && date > now);
}

function maskEmail(email) {
  if (!email || showEmails) return email;
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(1, name.length - visible.length))}@${domain}`;
}

function pct(numerator, denominator) {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

try {
  const [
    totalUsers,
    newUsers,
    recentUsers,
    entitlementUsers,
    reviews,
    softLaunchFeedback,
    usageRows,
    paywallEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: start } } }),
    prisma.user.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        email: true,
        role: true,
        trialEndsAt: true,
        creemCurrentPeriodEnd: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { trialEndsAt: { gt: now } },
          { stripeCurrentPeriodEnd: { gt: now } },
          { gumroadCurrentPeriodEnd: { gt: now } },
          { creemCurrentPeriodEnd: { gt: now } },
        ],
      },
      select: {
        trialEndsAt: true,
        stripeCurrentPeriodEnd: true,
        gumroadCurrentPeriodEnd: true,
        creemCurrentPeriodEnd: true,
      },
    }),
    prisma.review.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        language: true,
        filename: true,
        score: true,
        createdAt: true,
      },
    }),
    prisma.softLaunchFeedback.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        channel: true,
        language: true,
        rewardGranted: true,
        rewardDays: true,
        createdAt: true,
      },
    }),
    prisma.usage.findMany({
      where: { date: { gte: startDay } },
      select: { userId: true, date: true, count: true },
    }),
    prisma.paywallEvent.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: "desc" },
      select: { userId: true, eventType: true, createdAt: true },
    }),
  ]);

  const activeTrialUsers = entitlementUsers.filter((u) => isActive(u.trialEndsAt)).length;
  const activeCreemUsers = entitlementUsers.filter((u) => isActive(u.creemCurrentPeriodEnd)).length;
  const activePaidUsers = entitlementUsers.filter(
    (u) =>
      isActive(u.stripeCurrentPeriodEnd) ||
      isActive(u.gumroadCurrentPeriodEnd) ||
      isActive(u.creemCurrentPeriodEnd)
  ).length;

  const totalUsage = usageRows.reduce((sum, row) => sum + row.count, 0);
  const anonUsage = usageRows
    .filter((row) => row.userId.startsWith("anon_"))
    .reduce((sum, row) => sum + row.count, 0);
  const signedUsage = totalUsage - anonUsage;
  const uniqueReviewers = new Set(reviews.map((review) => review.userId).filter(Boolean)).size;
  const avgScore =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length
      : null;

  const report = {
    generatedAt: now.toISOString(),
    window: { days, start: start.toISOString(), startDay },
    users: {
      total: totalUsers,
      new: newUsers,
      activeEntitled: entitlementUsers.length,
      activeTrial: activeTrialUsers,
      activePaid: activePaidUsers,
      activeCreem: activeCreemUsers,
      recent: recentUsers.map((user) => ({
        ...user,
        email: maskEmail(user.email),
      })),
    },
    usage: {
      totalScansFromUsageRows: totalUsage,
      signedInScans: signedUsage,
      anonymousScans: anonUsage,
    },
    reviews: {
      savedReviews: reviews.length,
      uniqueSignedInReviewers: uniqueReviewers,
      averageScore: avgScore === null ? null : Number(avgScore.toFixed(1)),
      byLanguage: countBy(reviews, (review) => review.language || "unknown"),
      recent: reviews.slice(0, 10),
    },
    softLaunchFeedback: {
      submissions: softLaunchFeedback.length,
      rewardsGranted: softLaunchFeedback.filter((feedback) => feedback.rewardGranted).length,
      byChannel: countBy(softLaunchFeedback, (feedback) => feedback.channel || "unknown"),
      byLanguage: countBy(softLaunchFeedback, (feedback) => feedback.language || "unknown"),
      recent: softLaunchFeedback.slice(0, 10),
    },
    paywall: {
      events: paywallEvents.length,
      byType: countBy(paywallEvents, (event) => event.eventType),
      hitToUpgradeRate: pct(
        paywallEvents.filter((event) => event.eventType === "upgrade").length,
        paywallEvents.filter((event) => event.eventType === "hit").length
      ),
      recent: paywallEvents.slice(0, 10),
    },
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Check AI Code Ops Report (${days}d)`);
    console.log(`Generated: ${report.generatedAt}`);
    console.log("");
    console.log("Users");
    console.log(`- Total users: ${report.users.total}`);
    console.log(`- New users: ${report.users.new}`);
    console.log(`- Active trial users: ${report.users.activeTrial}`);
    console.log(`- Active paid users: ${report.users.activePaid}`);
    console.log(`- Active Creem users: ${report.users.activeCreem}`);
    console.log("");
    console.log("Usage");
    console.log(`- Total scans from usage rows: ${report.usage.totalScansFromUsageRows}`);
    console.log(`- Signed-in scans: ${report.usage.signedInScans}`);
    console.log(`- Anonymous scans: ${report.usage.anonymousScans}`);
    console.log("");
    console.log("Reviews");
    console.log(`- Saved reviews: ${report.reviews.savedReviews}`);
    console.log(`- Unique signed-in reviewers: ${report.reviews.uniqueSignedInReviewers}`);
    console.log(`- Average score: ${report.reviews.averageScore ?? "n/a"}`);
    console.log(`- Languages: ${JSON.stringify(report.reviews.byLanguage)}`);
    console.log("");
    console.log("Soft Launch Feedback");
    console.log(`- Submissions: ${report.softLaunchFeedback.submissions}`);
    console.log(`- Rewards granted: ${report.softLaunchFeedback.rewardsGranted}`);
    console.log(`- Channels: ${JSON.stringify(report.softLaunchFeedback.byChannel)}`);
    console.log(`- Languages: ${JSON.stringify(report.softLaunchFeedback.byLanguage)}`);
    console.log("");
    console.log("Paywall");
    console.log(`- Events: ${report.paywall.events}`);
    console.log(`- By type: ${JSON.stringify(report.paywall.byType)}`);
    console.log(`- Hit to upgrade rate: ${report.paywall.hitToUpgradeRate}`);
    console.log("");
    console.log("Recent users");
    for (const user of report.users.recent) {
      console.log(
        `- ${user.createdAt.toISOString()} ${user.email || "(no email)"} role=${user.role} trial=${user.trialEndsAt?.toISOString() || "none"} creem=${user.creemCurrentPeriodEnd?.toISOString() || "none"}`
      );
    }
  }
} finally {
  await prisma.$disconnect();
}
