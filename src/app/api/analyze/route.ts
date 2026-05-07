import { analyzeCode } from "@/lib/analyzer"
import { auth } from "@/lib/auth"
import { checkReviewLimit, incrementReviewCount } from "@/lib/subscription"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id

  const limit = await checkReviewLimit(userId)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Upgrade to Pro." },
      { status: 429 }
    )
  }

  const { code, language } = await req.json()
  if (!code || !code.trim()) {
    return NextResponse.json({ error: "Code required" }, { status: 400 })
  }

  const lines = code.split("\n").length
  if (lines > 500) {
    return NextResponse.json(
      { error: "File too large. Max 500 lines for free plan." },
      { status: 400 }
    )
  }

  try {
    const result = await analyzeCode(code, language || "auto")
    if (userId) {
      await incrementReviewCount(userId)
    }
    return NextResponse.json(result)
  } catch (e) {
    console.error("Analyze error:", e)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
