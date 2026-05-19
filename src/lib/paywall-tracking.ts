import { prisma } from "@/lib/prisma";

export type PaywallEventType = "hit" | "upgrade" | "leave" | "return_next_day";

interface TrackPaywallEventInput {
  userId: string | null;
  ip: string;
  eventType: PaywallEventType;
  metadata?: Record<string, unknown>;
}

/**
 * 记录免费用户触墙事件
 * hit: 额度用完触墙
 * upgrade: 触墙后升级Pro
 * leave: 触墙后离开（关闭页面/跳走）
 * return_next_day: 触墙后次日回来继续使用
 */
export async function trackPaywallEvent({
  userId,
  ip,
  eventType,
  metadata = {},
}: TrackPaywallEventInput): Promise<void> {
  await prisma.paywallEvent.create({
    data: {
      userId,
      ip,
      eventType,
      metadata: metadata as Record<string, unknown>,
    },
  });
}

/**
 * 查询某日期范围内的触墙统计
 */
export async function getPaywallStats(
  startDate: Date,
  endDate: Date
): Promise<{
  totalHits: number;
  upgrades: number;
  leaves: number;
  returns: number;
  conversionRate: number;
}> {
  const events = await prisma.paywallEvent.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const totalHits = events.filter((e) => e.eventType === "hit").length;
  const upgrades = events.filter((e) => e.eventType === "upgrade").length;
  const leaves = events.filter((e) => e.eventType === "leave").length;
  const returns = events.filter((e) => e.eventType === "return_next_day").length;

  return {
    totalHits,
    upgrades,
    leaves,
    returns,
    conversionRate: totalHits > 0 ? upgrades / totalHits : 0,
  };
}
