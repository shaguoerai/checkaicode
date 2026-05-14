import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ANON_DAILY_LIMIT, FREE_DAILY_LIMIT, getAnonymousUserId } from "@/lib/usage";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  const today = new Date().toISOString().split("T")[0];

  if (!session?.user?.id) {
    const anonUserId = getAnonymousUserId(req);
    const usageRecord = await prisma.usage.findUnique({
      where: { userId_date: { userId: anonUserId, date: today } },
    });

    return NextResponse.json({
      reviews: [],
      usage: {
        count: usageRecord?.count || 0,
        limit: ANON_DAILY_LIMIT,
        isPro: false,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  const usageRecord = await prisma.usage.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  const now = new Date();
  const stripeActive = user?.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now;
  const gumroadActive = user?.gumroadCurrentPeriodEnd && user.gumroadCurrentPeriodEnd > now;
  const isPro = user?.role === "pro" && (stripeActive || gumroadActive);

  return NextResponse.json({
    reviews: user?.reviews || [],
    usage: {
      count: usageRecord?.count || 0,
      limit: isPro ? -1 : FREE_DAILY_LIMIT,
      isPro,
    },
  });
}
