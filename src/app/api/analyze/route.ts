import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { checkReviewLimit, incrementReviewCount } from "@/lib/subscription"
import { analyzeCode } from "@/lib/analyzer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id

  const limit = await checkReviewLimit(userId)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Daily review limit reached. Upgrade to Pro for unlimited reviews." },
      { status: 429 }
    )
  }

  const { code, language } = await req.json()
  if (!code || !code.trim()) {
    return NextResponse.json({ error: "Code required" }, { status: 400 })
  }
  const effectiveLang = language && language !== "auto" ? language : "auto"

  const maxLines = limit.isPro ? 5000 : 500
  const lines = code.split("\n").length
  if (lines > maxLines) {
    return NextResponse.json(
      { error: `File too large. Max ${maxLines} lines for your plan.` },
      { status: 400 }
    )
  }

  try {
    const result = await analyzeCode(code, effectiveLang)

    if (userId) {
      await prisma.review.create({
        data: {
          userId,
          code: code.slice(0, 50000),
          language,
          score: result.score,
          issues: result.issues as any,
        },
      })
      await incrementReviewCount(userId)
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error("Analyze error:", e)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
