import { prisma } from "@/lib/prisma";

export const FREE_DAILY_LIMIT = 5;
export const ANON_DAILY_LIMIT = 3;

export function getClientIP(req: Request): string {
  // E2E 测试隔离：验证 secret 头后使用测试 IP
  const e2eSecret = req.headers.get("x-checkaicode-e2e-secret");
  const e2eIP = req.headers.get("x-checkaicode-e2e-ip");
  if (
    e2eSecret &&
    e2eIP &&
    process.env.E2E_TEST_SECRET &&
    e2eSecret === process.env.E2E_TEST_SECRET
  ) {
    return e2eIP.trim();
  }

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  return "unknown";
}

export function getAnonymousUserId(req: Request): string {
  return `anon_${getClientIP(req)}`;
}

interface ProUser {
  role?: string;
  trialEndsAt?: Date | null;
  stripeCurrentPeriodEnd?: Date | null;
  gumroadCurrentPeriodEnd?: Date | null;
  creemCurrentPeriodEnd?: Date | null;
}

function isProUser(user: ProUser | null): boolean {
  if (!user || user.role !== "pro") return false;
  const now = new Date();
  const trialActive = Boolean(user.trialEndsAt && user.trialEndsAt > now);
  const stripeActive = Boolean(user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now);
  const gumroadActive = Boolean(user.gumroadCurrentPeriodEnd && user.gumroadCurrentPeriodEnd > now);
  const creemActive = Boolean(user.creemCurrentPeriodEnd && user.creemCurrentPeriodEnd > now);
  return trialActive || stripeActive || gumroadActive || creemActive;
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
    const anonUserId = req ? getAnonymousUserId(req) : "anon_unknown";
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
      trialEndsAt: true,
      stripeCurrentPeriodEnd: true,
      gumroadCurrentPeriodEnd: true,
      creemCurrentPeriodEnd: true,
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
    const anonUserId = req ? getAnonymousUserId(req) : "anon_unknown";
    const existing = await prisma.usage.findUnique({
      where: { userId_date: { userId: anonUserId, date: today } },
    });
    if (existing) {
      await prisma.usage.update({
        where: { id: existing.id },
        data: { count: { increment: 1 } },
      });
    } else {
      await prisma.usage.create({
        data: { userId: anonUserId, date: today, count: 1 },
      });
    }
    return;
  }

  const existing = await prisma.usage.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (existing) {
    await prisma.usage.update({
      where: { id: existing.id },
      data: { count: { increment: 1 } },
    });
  } else {
    await prisma.usage.create({
      data: { userId, date: today, count: 1 },
    });
  }
}
