"use client";

import Link from "next/link";
import { AuthStatus } from "@/components/auth-status";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";

function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "zh" : "en")}
      className="rounded-md border border-white/15 px-2.5 py-1 text-sm font-medium text-white/70 transition hover:border-neon/40 hover:text-neon"
      aria-label="Toggle language"
    >
      {t("langToggle")}
    </button>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function MiniReviewVisual() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080808] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
        <span className="font-mono text-xs text-white/35">practical review</span>
      </div>
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-white/8 p-4 lg:border-b-0 lg:border-r">
          <pre className="min-h-[250px] overflow-hidden rounded-lg bg-[#050505] p-4 font-mono text-xs leading-6 text-white/65 ring-1 ring-white/8">
            <code>
              <span className="text-[#ff7b72]">async function</span> saveUser(req, res) {"{"}{"\n"}
              {"  "}const user = await db.user.create(req.body){"\n"}
              {"  "}events.forEach(<span className="text-[#ff7b72]">async</span> event =&gt; {"{"}{"\n"}
              {"    "}await analytics.track(user.id, event){"\n"}
              {"  })"}{"\n\n"}
              {"  "}return res.json({"{"} ok: <span className="text-[#79c0ff]">true</span> {"}"}){"\n"}
              {"}"}
            </code>
          </pre>
        </div>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-amber-400/70 text-sm font-bold text-amber-300">68</div>
            <div>
              <p className="text-sm font-semibold text-white">3 practical risks</p>
              <p className="text-xs text-white/35">Static rules + AI-focused checks</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs font-semibold text-red-300">CRITICAL</p>
              <p className="mt-1 text-sm text-white/75">Async forEach is not awaited before returning.</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold text-amber-300">WARNING</p>
              <p className="mt-1 text-sm text-white/75">Input is passed directly into a database write.</p>
            </div>
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
              <p className="text-xs font-semibold text-sky-300">INFO</p>
              <p className="mt-1 text-sm text-white/75">Review framework and runtime assumptions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const copy = {
  en: {
    badge: "Product overview",
    title: "AI can write code fast. Check AI Code helps you trust it before shipping.",
    subtitle:
      "Check AI Code catches practical bugs, security risks, and AI-generated code mistakes in small scripts, components, API handlers, and multi-file snippets.",
    primary: "Try a free review",
    secondary: "How it works",
    problemTitle: "The problem",
    problems: [
      ["AI code looks plausible", "It can invent APIs, skip awaits, miss runtime edge cases, or use examples from the wrong framework version."],
      ["Linters are not enough", "Format and style checks are useful, but they often miss practical semantic mistakes in generated code."],
      ["Manual review is slow", "For small teams and independent builders, every pull request cannot wait for a full human review cycle."],
    ],
    capabilitiesTitle: "What it can check",
    capabilities: [
      ["AI hallucinations", "Fake methods, suspicious package usage, non-existent APIs, and migration-era examples."],
      ["Security patterns", "Secrets, unsafe deserialization, command injection, path traversal, and dangerous defaults."],
      ["Runtime bugs", "Async misuse, missing timeouts, mutable defaults, swallowed errors, and production-footgun patterns."],
      ["Framework drift", "Deprecated APIs, version mismatch patterns, and code copied from stale examples."],
      ["Static + enhanced review", "Fast rule checks first; Pro can add deeper LLM-enhanced explanation when appropriate."],
      ["Privacy-conscious option", "Privacy Mode skips LLM enhancement while still running static checks."],
    ],
    differenceTitle: "How it differs from other tools",
    differenceIntro:
      "Check AI Code is not trying to replace mature tools like dedicated SAST platforms, dependency scanners, or full security audits. It is designed as a fast first pass for AI-assisted development.",
    comparisons: [
      ["Traditional linters", "Great for style and local conventions.", "Check AI Code focuses more on practical mistakes and AI-generated code failure modes."],
      ["Security scanners", "Strong for known vulnerability classes and enterprise workflows.", "Check AI Code is lighter-weight and easier to run before you ship a small change."],
      ["Manual code review", "Best for product intent and business logic.", "Check AI Code gives a quick risk screen before a human spends attention."],
    ],
    audiencesTitle: "Who it is for",
    audiences: [
      "Developers using Cursor, Claude Code, Copilot, ChatGPT, or other AI coding tools",
      "Independent builders shipping small apps, automations, scripts, and API endpoints",
      "Small teams that want a fast sanity check before review or deployment",
      "Anyone reviewing code they did not fully write by hand",
    ],
    limitsTitle: "Honest limits",
    limits: [
      "It cannot guarantee every bug, vulnerability, or business-logic mistake will be found.",
      "It does not replace tests, type checks, human review, dependency scanning, or a formal security audit.",
      "Results are risk signals. You still decide what matters for your codebase and users.",
    ],
    ctaTitle: "Use it as the review before the review.",
    ctaBody:
      "Paste code, upload a file, or try a small AI-generated snippet. You will see quickly whether the tool catches issues that would have been easy to miss.",
  },
  zh: {
    badge: "产品介绍",
    title: "AI 写代码很快。Check AI Code 帮你在上线前多一层把关。",
    subtitle:
      "Check AI Code 用来检查实际 bug、安全风险，以及 AI 生成代码里常见的错误，适合脚本、组件、API handler 和多文件片段。",
    primary: "免费试一次",
    secondary: "查看使用指南",
    problemTitle: "它解决什么问题",
    problems: [
      ["AI 代码看起来很像真的", "但它可能编造 API、漏 await、忽略运行时边界，或套用错误框架版本的示例。"],
      ["普通 lint 不够", "格式和风格检查有用，但经常覆盖不到 AI 生成代码里的实际语义错误。"],
      ["人工 review 慢", "对独立开发者和小团队来说，不是每个改动都等得起完整人工审查。"],
    ],
    capabilitiesTitle: "它有哪些能力",
    capabilities: [
      ["AI 幻觉检查", "虚构方法、可疑包用法、不存在的 API，以及迁移期容易混淆的示例。"],
      ["安全模式检查", "密钥、危险反序列化、命令注入、路径穿越和不安全默认值。"],
      ["运行时 bug", "async 误用、缺少 timeout、可变默认参数、吞错和生产环境常见坑。"],
      ["框架版本漂移", "废弃 API、版本不匹配，以及从过期示例复制来的代码。"],
      ["静态 + 增强审查", "先跑快速规则检查；Pro 可在适合时增加更深的 LLM 解释。"],
      ["更重视隐私的选项", "Privacy Mode 会跳过 LLM 增强，同时保留静态规则检查。"],
    ],
    differenceTitle: "和其他工具有什么不同",
    differenceIntro:
      "Check AI Code 不是要替代成熟的 SAST 平台、依赖扫描器或正式安全审计。它更像 AI 编程流程里的第一层快速检查。",
    comparisons: [
      ["传统 lint", "擅长风格、格式和本地约定。", "Check AI Code 更关注实际错误和 AI 生成代码常见失败模式。"],
      ["安全扫描器", "擅长已知漏洞类型和企业流程。", "Check AI Code 更轻，适合小改动上线前快速自查。"],
      ["人工 code review", "最适合理解产品意图和业务逻辑。", "Check AI Code 在人投入注意力前，先给一次风险筛查。"],
    ],
    audiencesTitle: "适合谁",
    audiences: [
      "正在使用 Cursor、Claude Code、Copilot、ChatGPT 等 AI 编程工具的人",
      "独立开发者，正在发布小应用、自动化脚本、API 接口",
      "希望在 review 或部署前快速自查的小团队",
      "任何需要审查一段不是完全手写代码的人",
    ],
    limitsTitle: "诚实边界",
    limits: [
      "不能保证发现所有 bug、漏洞或业务逻辑错误。",
      "不能替代测试、类型检查、人工审查、依赖扫描或正式安全审计。",
      "结果是风险信号。最终仍需要你根据自己的代码和用户判断优先级。",
    ],
    ctaTitle: "把它当作 review 前的一次 review。",
    ctaBody:
      "粘贴代码、上传文件，或拿一段 AI 生成的小片段试一下。你会很快知道它能不能发现那些容易漏掉的问题。",
  },
};

export default function WhyPage() {
  const { lang, t } = useI18n();
  const c = copy[lang];

  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-neon/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ee787" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            Check AI Code
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/guide" className="text-sm text-white/60 transition hover:text-white">
            {t("guide")}
          </Link>
          <Link href="/review" className="text-sm text-white/60 transition hover:text-white">
            {t("reviewTitle")}
          </Link>
          <Link href="/pricing" className="text-sm text-white/60 transition hover:text-white">
            {t("viewPricing")}
          </Link>
          <LangToggle />
          <AuthStatus signInLabel={t("signIn")} />
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-14 lg:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-neon/20 bg-neon/5 px-3 py-1 text-xs font-medium text-neon">
                {c.badge}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {c.title}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-white/50 sm:text-lg">
                {c.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/review" className="inline-flex h-11 items-center justify-center rounded-lg bg-neon px-5 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim">
                  {c.primary}
                  <ArrowIcon className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/guide" className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5">
                  {c.secondary}
                </Link>
              </div>
            </div>
            <MiniReviewVisual />
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-white">{c.problemTitle}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {c.problems.map(([title, body]) => (
                <div key={title} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-white">{c.capabilitiesTitle}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {c.capabilities.map(([title, body]) => (
                <div key={title} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-neon/10 text-neon">
                    <CheckIcon />
                  </div>
                  <h3 className="text-base font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-white">{c.differenceTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{c.differenceIntro}</p>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
              {c.comparisons.map(([kind, common, ours], index) => (
                <div key={kind} className={`grid gap-4 p-5 md:grid-cols-[0.7fr_1fr_1fr] ${index > 0 ? "border-t border-white/8" : ""}`}>
                  <div className="text-sm font-semibold text-white">{kind}</div>
                  <p className="text-sm leading-relaxed text-white/45">{common}</p>
                  <p className="text-sm leading-relaxed text-neon/85">{ours}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white">{c.audiencesTitle}</h2>
              <div className="mt-5 space-y-3">
                {c.audiences.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckIcon className="mt-0.5 shrink-0 text-neon" />
                    <p className="text-sm leading-relaxed text-white/55">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.03] p-6">
              <h2 className="text-xl font-bold text-white">{c.limitsTitle}</h2>
              <div className="mt-5 space-y-3">
                {c.limits.map((item) => (
                  <div key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/80" />
                    <p className="text-sm leading-relaxed text-white/55">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white">{c.ctaTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/50">{c.ctaBody}</p>
            <Link href="/review" className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-neon px-5 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim">
              {c.primary}
              <ArrowIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
