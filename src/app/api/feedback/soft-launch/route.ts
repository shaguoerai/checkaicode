import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const REWARD_DAYS = 7;
const MAX_FIELD_LENGTH = 3000;

function cleanText(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "请先登录，再提交试用反馈。" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "反馈内容格式不正确。" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const channel = cleanText(input.channel, 80);
  const language = cleanText(input.language, 80);
  const projectType = cleanText(input.projectType, 300);
  const usefulFinding = cleanText(input.usefulFinding);
  const falsePositive = cleanText(input.falsePositive);
  const falseNegative = cleanText(input.falseNegative);
  const uxIssue = cleanText(input.uxIssue);
  const pricingFeedback = cleanText(input.pricingFeedback);
  const otherFeedback = cleanText(input.otherFeedback);

  if (!channel || !language || usefulFinding.length < 10) {
    return NextResponse.json(
      {
        error:
          "请填写来源渠道、代码语言，并至少写一条具体试用感受。",
      },
      { status: 400 }
    );
  }

  const reviewCount = await prisma.review.count({ where: { userId } });
  if (reviewCount < 1) {
    return NextResponse.json(
      {
        error:
          "请先完成至少一次代码扫描，再提交试用反馈。",
      },
      { status: 400 }
    );
  }

  const existingReward = await prisma.softLaunchFeedback.findFirst({
    where: { userId, rewardGranted: true },
    select: { id: true },
  });
  const shouldGrantReward = !existingReward;

  const result = await prisma.$transaction(async (tx) => {
    const feedback = await tx.softLaunchFeedback.create({
      data: {
        userId,
        channel,
        language,
        projectType: projectType || null,
        usefulFinding,
        falsePositive: falsePositive || null,
        falseNegative: falseNegative || null,
        uxIssue: uxIssue || null,
        pricingFeedback: pricingFeedback || null,
        otherFeedback: otherFeedback || null,
        rewardGranted: shouldGrantReward,
        rewardDays: shouldGrantReward ? REWARD_DAYS : 0,
      },
    });

    if (!shouldGrantReward) {
      return { feedback, trialEndsAt: null };
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { trialEndsAt: true },
    });
    const now = new Date();
    const base = user?.trialEndsAt && user.trialEndsAt > now ? user.trialEndsAt : now;
    const trialEndsAt = addDays(base, REWARD_DAYS);

    await tx.user.update({
      where: { id: userId },
      data: { role: "pro", trialEndsAt },
    });

    return { feedback, trialEndsAt };
  });

  return NextResponse.json({
    ok: true,
    rewardGranted: result.feedback.rewardGranted,
    rewardDays: result.feedback.rewardDays,
    trialEndsAt: result.trialEndsAt,
  });
}
