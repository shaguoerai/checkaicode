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
  const MAX_LINES = 500
  if (lines > MAX_LINES) {
    return NextResponse.json(
      {
        error: `This file is ${lines} lines. Please keep it under ${MAX_LINES} lines (remove ${lines - MAX_LINES} lines) to try the free scan. Upgrade to Pro for unlimited file size.`,
        lines,
        maxLines: MAX_LINES,
        overBy: lines - MAX_LINES,
      },
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
