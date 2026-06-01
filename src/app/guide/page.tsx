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

function ScreenshotFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080808] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
        <span className="font-mono text-xs text-white/35">{title}</span>
      </div>
      {children}
    </div>
  );
}

function InputScreenshot() {
  return (
    <ScreenshotFrame title="/review">
      <div className="grid gap-0 md:grid-cols-[1fr_0.85fr]">
        <div className="border-b border-white/8 p-4 md:border-b-0 md:border-r">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">Upload File</span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/50">TypeScript</span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/50">api.ts</span>
          </div>
          <pre className="min-h-[210px] overflow-hidden rounded-lg bg-[#050505] p-4 font-mono text-xs leading-6 text-white/65 ring-1 ring-white/8">
            <code>
              <span className="text-[#ff7b72]">async function</span> charge(user) {"{"}{"\n"}
              {"  "}items.forEach(<span className="text-[#ff7b72]">async</span> item =&gt; {"{"}{"\n"}
              {"    "}await api.bill(user.id, item.price){"\n"}
              {"  })"}{"\n\n"}
              {"  "}return {"{"} ok: <span className="text-[#79c0ff]">true</span> {"}"}{"\n"}
              {"}"}
            </code>
          </pre>
          <button className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-neon px-5 text-sm font-semibold text-[#050505]">
            Analyze
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-amber-400/70 text-sm font-bold text-amber-300">62</div>
            <div>
              <p className="text-sm font-semibold text-white">2 issues found</p>
              <p className="text-xs text-white/35">Static checks + AI review</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs font-semibold text-red-300">CRITICAL</p>
              <p className="mt-1 text-sm text-white/75">Async work inside forEach is not awaited.</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold text-amber-300">WARNING</p>
              <p className="mt-1 text-sm text-white/75">Result returns before billing completes.</p>
            </div>
          </div>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

function ResultScreenshot() {
  return (
    <ScreenshotFrame title="scan result">
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs font-semibold uppercase text-red-300">Critical</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">Fix before shipping. These are likely bugs or security risks.</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-xs font-semibold uppercase text-amber-300">Warning</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">Review carefully. These may break in edge cases.</p>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
          <p className="text-xs font-semibold uppercase text-sky-300">Info</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">Lower-risk hints, cleanup, or compatibility notes.</p>
        </div>
      </div>
      <div className="border-t border-white/8 p-4">
        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-white">Suggested fix</p>
          <pre className="mt-3 overflow-hidden rounded-lg bg-[#050505] p-3 font-mono text-xs leading-6 text-white/65">
            <code>await Promise.all(items.map(item =&gt; api.bill(user.id, item.price)))</code>
          </pre>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

function PrivacyScreenshot() {
  return (
    <ScreenshotFrame title="Pro controls">
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-neon/25 bg-neon/10 p-1">
            <span className="rounded-md bg-neon/15 px-3 py-1 text-xs font-medium text-neon">Standard Fast Scan</span>
            <span className="px-3 py-1 text-xs text-white/35">Deep Thorough Scan</span>
          </div>
          <span className="text-xs text-amber-300/80">Deep uses more quota</span>
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-neon bg-neon/15 text-neon">
            <CheckIcon className="h-3 w-3" />
          </span>
          <span className="text-sm text-white/65">Privacy Mode: skip LLM enhancement</span>
        </label>
        <p className="text-xs leading-relaxed text-white/35">
          Privacy Mode still runs static checks. It skips the LLM-enhanced explanation layer.
        </p>
      </div>
    </ScreenshotFrame>
  );
}

const copy = {
  en: {
    badge: "Quick start",
    title: "How to use Check AI Code",
    subtitle: "A short guide for your first scan: what to paste, how to read results, and when Pro features help.",
    start: "Start a free scan",
    pricing: "View pricing",
    stepsTitle: "The 3-step flow",
    steps: [
      ["Paste or upload code", "Use a single file, a small component, an API handler, or a script. Choose the language if auto-detection is not enough."],
      ["Click Analyze", "Free scans run static rules and Semgrep checks. Pro can use deep scan and larger inputs."],
      ["Review the findings", "Start with Critical issues, then Warnings. Use Info items as cleanup and compatibility hints."],
    ],
    screenshot1Title: "What the review screen looks like",
    screenshot1Body: "Paste code on the left. Results appear on the right with severity, score, and suggested fixes.",
    screenshot2Title: "How to read the result",
    screenshot2Body: "Treat severity as a priority signal, not an absolute truth. A clean result is helpful, but not a guarantee that the code is bug-free.",
    screenshot3Title: "Privacy Mode and deep scan",
    screenshot3Body: "Pro users can run deeper checks or skip LLM enhancement when they want a more privacy-conscious static pass.",
    bestForTitle: "Best use cases",
    bestFor: ["AI-generated code before shipping", "Small scripts and backend handlers", "React components and TypeScript utilities", "Security-sensitive snippets with keys, queries, or file paths"],
    limitsTitle: "Important limits",
    limits: ["It does not replace tests, manual review, or a formal security audit.", "It cannot guarantee every bug will be found.", "Business logic still needs human context."],
    freeProTitle: "Free vs Pro",
    freePro: [
      ["Free", "Daily scans, upload/paste workflow, local rule engine, Semgrep checks, and saved single-file history when signed in."],
      ["24-hour trial", "New signed-in users automatically get 24 hours of Pro access, then return to Free unless they upgrade."],
      ["Pro", "More capacity, larger inputs, deep scan mode, Privacy Mode, and automatic activation after payment."],
    ],
  },
  zh: {
    badge: "快速上手",
    title: "如何使用 Check AI Code",
    subtitle: "第一次扫描前看这一页就够了：该粘什么、结果怎么看、什么时候需要 Pro。",
    start: "开始免费扫描",
    pricing: "查看定价",
    stepsTitle: "3 步流程",
    steps: [
      ["粘贴或上传代码", "可以放单个文件、小组件、API handler 或脚本。自动识别不准时，可以手动选择语言。"],
      ["点击 Analyze", "免费扫描会运行静态规则和 Semgrep 检查。Pro 可使用深度扫描和更大输入。"],
      ["查看问题结果", "优先处理 Critical，再看 Warning。Info 更适合作为清理和兼容性提示。"],
    ],
    screenshot1Title: "代码审查界面长什么样",
    screenshot1Body: "左侧粘贴代码，右侧查看严重级别、分数和修复建议。",
    screenshot2Title: "结果应该怎么看",
    screenshot2Body: "严重级别是优先级信号，不是绝对判决。没有发现问题很有价值，但不代表代码一定没有 bug。",
    screenshot3Title: "Privacy Mode 和深度扫描",
    screenshot3Body: "Pro 用户可以运行更深的检查；如果更在意隐私，可以开启 Privacy Mode 跳过 LLM 增强。",
    bestForTitle: "适合检查什么",
    bestFor: ["AI 生成代码上线前自查", "小脚本和后端接口", "React 组件和 TypeScript 工具函数", "包含密钥、查询、文件路径等敏感逻辑的片段"],
    limitsTitle: "重要边界",
    limits: ["不能替代测试、人工 code review 或正式安全审计。", "不能保证发现所有 bug。", "业务逻辑是否正确仍需要人来判断。"],
    freeProTitle: "免费版和 Pro",
    freePro: [
      ["免费版", "每日扫描额度，支持粘贴/上传，本地规则引擎、Semgrep 检查，登录后保存单文件历史。"],
      ["24 小时体验", "新登录用户自动获得 24 小时 Pro 权限，到期后未付费会回到免费版。"],
      ["Pro", "更高额度、更大输入、深度扫描、Privacy Mode，付款后自动开通。"],
    ],
  },
};

export default function GuidePage() {
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
          <Link href="/review" className="text-sm text-white/60 transition hover:text-white">
            {t("reviewTitle")}
          </Link>
          <Link href="/pricing" className="text-sm text-white/60 transition hover:text-white">
            {t("viewPricing")}
          </Link>
          <Link href="/feedback" className="text-sm text-white/60 transition hover:text-white">
            {t("feedback")}
          </Link>
          <LangToggle />
          <AuthStatus signInLabel={t("signIn")} />
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-14 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex rounded-full border border-neon/20 bg-neon/5 px-3 py-1 text-xs font-medium text-neon">
                {c.badge}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {c.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
                {c.subtitle}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/review" className="inline-flex h-11 items-center justify-center rounded-lg bg-neon px-5 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim">
                  {c.start}
                  <ArrowIcon className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/pricing" className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5">
                  {c.pricing}
                </Link>
              </div>
            </div>

            <div className="mt-12">
              <InputScreenshot />
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-white">{c.stepsTitle}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {c.steps.map(([title, body], index) => (
                <div key={title} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10 text-sm font-bold text-neon">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">{c.screenshot2Title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{c.screenshot2Body}</p>
            </div>
            <ResultScreenshot />
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <PrivacyScreenshot />
            <div>
              <h2 className="text-2xl font-bold text-white">{c.screenshot3Title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{c.screenshot3Body}</p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white">{c.bestForTitle}</h2>
              <div className="mt-5 space-y-3">
                {c.bestFor.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckIcon className="mt-0.5 shrink-0 text-neon" />
                    <p className="text-sm leading-relaxed text-white/55">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
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

            <div className="rounded-xl border border-neon/15 bg-neon/[0.03] p-6">
              <h2 className="text-xl font-bold text-white">{c.freeProTitle}</h2>
              <div className="mt-5 space-y-4">
                {c.freePro.map(([title, body]) => (
                  <div key={title}>
                    <p className="text-sm font-semibold text-neon">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/55">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
