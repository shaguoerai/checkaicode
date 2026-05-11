import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ reviews: [], usage: { count: 0, limit: 5 } });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const usageRecord = await prisma.usage.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  const isPro = user?.role === "pro" && (
    (user?.gumroadCurrentPeriodEnd && user.gumroadCurrentPeriodEnd > new Date())
  );

  return NextResponse.json({
    reviews: user?.reviews || [],
    usage: {
      count: usageRecord?.count || 0,
      limit: isPro ? -1 : 5,
      isPro,
    },
  });
}
