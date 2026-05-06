import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  })
}

export async function isProUser(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId)
  return sub?.status === "active" && sub.currentPeriodEnd > new Date()
}

export async function getDailyReviewCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (user.lastReviewDate < today) {
    await prisma.user.update({
      where: { id: userId },
      data: { dailyReviews: 0, lastReviewDate: new Date() },
    })
    return 0
  }
  return user.dailyReviews
}

export async function incrementReviewCount(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { dailyReviews: { increment: 1 }, lastReviewDate: new Date() },
  })
}

export async function checkReviewLimit(userId?: string): Promise<{ allowed: boolean; remaining: number; isPro: boolean }> {
  const FREE_DAILY_LIMIT = 5

  if (!userId) {
    return { allowed: true, remaining: 1, isPro: false }
  }

  const pro = await isProUser(userId)
  if (pro) {
    return { allowed: true, remaining: Infinity, isPro: true }
  }

  const used = await getDailyReviewCount(userId)
  const remaining = Math.max(0, FREE_DAILY_LIMIT - used)
  return { allowed: remaining > 0, remaining, isPro: false }
}
