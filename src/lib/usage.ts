import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FREE_DAILY_LIMIT = 5;

export async function checkUsageLimit(userId?: string): Promise<{
  allowed: boolean;
  remaining: number;
  isPro: boolean;
}> {
  if (!userId) {
    return { allowed: false, remaining: 0, isPro: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  const isPro =
    user?.role === "pro" &&
    user?.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd > new Date();

  if (isPro) {
    return { allowed: true, remaining: -1, isPro: true };
  }

  const today = new Date().toISOString().split("T")[0];
  const usage = await prisma.usage.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today, count: 0 },
  });

  const remaining = Math.max(0, FREE_DAILY_LIMIT - usage.count);
  return { allowed: remaining > 0, remaining, isPro: false };
}

export async function incrementUsage(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  await prisma.usage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });
}
