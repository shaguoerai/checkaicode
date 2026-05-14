import { prisma } from "@/lib/prisma";

const FREE_DAILY_LIMIT = 5;
const ANON_DAILY_LIMIT = 3;

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  return "unknown";
}

function isProUser(user: any): boolean {
  if (!user || user.role !== "pro") return false;
  const now = new Date();
  const stripeActive = user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now;
  const gumroadActive = user.gumroadCurrentPeriodEnd && user.gumroadCurrentPeriodEnd > now;
  return stripeActive || gumroadActive;
}

export async function checkUsageLimit(
  userId: string | null | undefined,
  req?: Request
): Promise<{
  allowed: boolean;
  remaining: number;
  isPro: boolean;
}> {
  const today = new Date().toISOString().split("T")[0];

  if (!userId) {
    // 未登录用户：按 IP 限流，每日 3 次（持久化到 DB）
    const ip = req ? getClientIP(req) : "unknown";
    const anonUserId = `anon_${ip}`;
    const usage = await prisma.usage.upsert({
      where: { userId_date: { userId: anonUserId, date: today } },
      update: {},
      create: { userId: anonUserId, date: today, count: 0 },
    });
    const remaining = Math.max(0, ANON_DAILY_LIMIT - usage.count);
    return { allowed: remaining > 0, remaining, isPro: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      stripeCurrentPeriodEnd: true,
      gumroadCurrentPeriodEnd: true,
    },
  });

  const isPro = isProUser(user);

  if (isPro) {
    return { allowed: true, remaining: -1, isPro: true };
  }

  const usage = await prisma.usage.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today, count: 0 },
  });

  const remaining = Math.max(0, FREE_DAILY_LIMIT - usage.count);
  return { allowed: remaining > 0, remaining, isPro: false };
}

export async function incrementUsage(
  userId: string | null,
  req?: Request
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  if (!userId) {
    // 未登录用户：按 IP 计数（持久化到 DB）
    const ip = req ? getClientIP(req) : "unknown";
    const anonUserId = `anon_${ip}`;
    await prisma.usage.upsert({
      where: { userId_date: { userId: anonUserId, date: today } },
      update: { count: { increment: 1 } },
      create: { userId: anonUserId, date: today, count: 1 },
    });
    return;
  }

  await prisma.usage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });
}
