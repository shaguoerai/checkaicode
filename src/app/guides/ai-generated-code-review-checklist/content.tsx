"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const codeClass = "rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-white/85";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10 py-8">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-white/65">{children}</div>
    </section>
  );
}

function ChecklistItem({ title, body }: { title: string; body: string }) {
  return (
    <li className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
    </li>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#101010] p-4 text-sm leading-6 text-white/75">
      <code>{children}</code>
    </pre>
  );
}

const copy = {
  en: {
    tryReview: "Try review",
    badge: "AI code review checklist",
    title: "AI-Generated Code Review Checklist: What to Check Before You Ship",
    intro1:
      "AI-generated code often looks clean enough to merge. That is the danger. The first pass should ask whether the generated code actually finishes async work, validates input, protects secrets, uses real APIs, and has enough tests for the risky parts.",
    intro2:
      "Use this checklist before you ship code from Claude Code, Cursor, GitHub Copilot, ChatGPT, Codex, or any other AI coding tool. It is designed for small files, components, scripts, API handlers, and pull requests where a fast first-pass review can save a more expensive mistake later.",
    primary: "Run a free scan",
    secondary: "Read product guide",
    whyTitle: "Why AI-Generated Code Needs A Different Review Habit",
    why: [
      "AI coding tools are good at producing plausible code. They are less reliable at preserving hidden requirements: the exact framework version, the shape of production data, the security model, the difference between an example and a real endpoint, or the timing of async side effects.",
      "That means your review should start with practical failure modes. Do not stop at whether the code looks real. Ask what would break if you shipped it today.",
    ],
    checklistTitle: "The 10-Point Checklist",
    checklist: [
      ["1. Does async work finish before the function returns?", "Look for async forEach, unreturned promises, fire-and-forget writes, background jobs without retries, and responses sent before side effects complete."],
      ["2. Are auth and session checks enforced on the server?", "AI-generated UI checks are not enough. Confirm the API route, server action, webhook, or database write verifies the user and permission model."],
      ["3. Are inputs validated before database, file, or network use?", "Check request bodies, query strings, uploaded filenames, JSON payloads, webhook data, and user-controlled IDs before they reach sensitive operations."],
      ["4. Are secrets, tokens, and private data protected?", "Watch for hardcoded keys, verbose logs, client-side env usage, debug output, accidental response fields, and secret values included in error messages."],
      ["5. Are file paths and uploads constrained?", "Generated code often handles files too casually. Confirm extension checks, size limits, path normalization, safe storage locations, and content-type handling."],
      ["6. Are framework APIs current for your version?", "AI models can mix examples from old and new docs. Verify routing APIs, auth helpers, server/client boundaries, config names, and deprecated methods."],
      ["7. Are dependencies real, necessary, and trusted?", "Check package names, install size, maintenance status, licensing, and whether the generated code invented an import that does not exist."],
      ["8. Are errors handled without hiding failures?", "Empty catch blocks, generic fallback returns, and swallowed promise rejections make generated code look stable while hiding production failures."],
      ["9. Do tests cover edge cases, not only the happy path?", "Generated tests often prove the example works. Add cases for empty input, invalid permissions, failed network calls, duplicate requests, and boundary values."],
      ["10. Does a human understand the business logic?", "No scanner can know every product rule. Ask whether the code matches the actual user promise, pricing rule, refund rule, entitlement rule, or data policy."],
    ],
    exampleTitle: "Example: Async Code That Looks Fine But Returns Too Early",
    example1:
      "This pattern is common in generated JavaScript and TypeScript. The function returns before the async work inside",
    example2: "is awaited.",
    safer: "A safer shape is to collect promises and await them explicitly.",
    asyncLinkBefore: "For more JavaScript and TypeScript examples, read the dedicated",
    asyncLink: "async code review guide",
    asyncLinkEnd: ".",
    helpsTitle: "Where Check AI Code Helps",
    helpsIntro:
      "Check AI Code is built for this first-pass review moment. Paste code or upload a file, then use the results as risk signals before you merge, deploy, or hand the code to a human reviewer.",
    helps: [
      "It can flag practical bug patterns such as async misuse and dangerous defaults.",
      "It can highlight security footguns around secrets, paths, commands, and input.",
      "It can help you notice generated code that depends on fragile assumptions.",
      "Pro users can use deeper review and Privacy Mode depending on the sensitivity of the code.",
    ],
    limitsTitle: "What It Does Not Guarantee",
    limits: [
      "A clean scan is useful, but it is not a proof that code is safe. Check AI Code does not replace tests, type checks, manual review, dependency scanning, runtime monitoring, or a formal security audit.",
      "Treat the output as a prioritized review assistant. It can help you spend attention faster, but your team still owns the final decision.",
    ],
    workflowTitle: "A Simple Review Workflow",
    workflow: [
      "Ask the AI tool to explain the change and list its own assumptions.",
      "Run the code through tests, type checks, and linters.",
      "Paste the highest-risk file into Check AI Code for a first-pass scan.",
      "Fix critical issues before asking for human review.",
      "Have a human verify product logic, data policy, and user impact.",
    ],
    ctaTitle: "Review one generated file now",
    ctaBody:
      "Start with the file you trust least: an API handler, payment callback, auth helper, upload route, or async workflow. A five-minute first pass is cheaper than finding the issue after users do.",
    cta: "Try Check AI Code",
  },
  zh: {
    tryReview: "试用审查",
    badge: "AI 生成代码检查清单",
    title: "AI 生成代码上线前检查清单：发出去之前先看这 10 点",
    intro1:
      "AI 生成的代码经常看起来已经可以合并，这正是风险所在。第一轮检查不要只看代码漂不漂亮，而要确认 async 是否真的等完、输入是否校验、密钥是否安全、API 是否真实、风险部分有没有测试。",
    intro2:
      "这份清单适合在使用 Claude Code、Cursor、GitHub Copilot、ChatGPT、Codex 或其他 AI 编程工具后上线前自查。它主要面向小文件、组件、脚本、API handler 和小型 PR，目标是在出事故前用一次快速检查拦住明显风险。",
    primary: "免费扫描一次",
    secondary: "查看产品指南",
    whyTitle: "为什么 AI 生成代码需要不同的审查习惯",
    why: [
      "AI 编程工具很擅长生成“看起来像真的”代码，但不一定能保住隐藏要求：框架版本、生产数据结构、安全模型、示例代码和真实接口的区别，以及异步副作用的执行时机。",
      "所以审查应该从实际失败场景开始。不要停在“这段代码看起来对不对”，而要问：如果今天上线，哪里会坏？",
    ],
    checklistTitle: "10 点检查清单",
    checklist: [
      ["1. 异步工作是否在函数返回前完成？", "检查 async forEach、没有 return 的 promise、直接丢出去的写入、没有重试的后台任务，以及响应返回前没有完成的副作用。"],
      ["2. 权限和登录校验是否在服务端执行？", "只在前端判断不够。确认 API route、server action、webhook 或数据库写入处真的校验了用户和权限。"],
      ["3. 输入在进入数据库、文件或网络操作前校验了吗？", "检查请求体、查询参数、上传文件名、JSON payload、webhook 数据和用户可控 ID。"],
      ["4. 密钥、token 和私有数据是否被保护？", "留意硬编码密钥、过度日志、客户端 env、调试输出、返回体里意外带出的字段，以及错误信息里的敏感值。"],
      ["5. 文件路径和上传是否有限制？", "AI 生成代码经常把文件处理写得过于随意。确认扩展名、大小限制、路径归一化、安全存储位置和 content type。"],
      ["6. 框架 API 是否适用于你的版本？", "模型可能混用新旧文档。确认路由 API、认证 helper、服务端/客户端边界、配置名和废弃方法。"],
      ["7. 依赖是否真实、必要、可信？", "检查包名、体积、维护状态、许可协议，以及导入是否是 AI 编出来的。"],
      ["8. 错误处理有没有把失败藏起来？", "空 catch、泛泛 fallback、吞掉 promise rejection，会让生成代码看起来稳定，但实际隐藏生产故障。"],
      ["9. 测试是否覆盖边界，而不是只测 happy path？", "AI 生成测试经常只证明示例能跑。补上空输入、无权限、网络失败、重复请求和边界值。"],
      ["10. 业务逻辑是否有人真正看懂？", "没有扫描器能懂所有产品规则。确认代码符合真实用户承诺、定价、退款、权益和数据策略。"],
    ],
    exampleTitle: "例子：看起来没问题，但返回太早的 async 代码",
    example1:
      "这个模式在 AI 生成的 JavaScript 和 TypeScript 里很常见：函数会在",
    example2: "里的异步工作完成前就返回。",
    safer: "更稳的写法是先收集 promise，再明确 await。",
    asyncLinkBefore: "更多 JavaScript 和 TypeScript 例子可以看专门的",
    asyncLink: "async 代码审查指南",
    asyncLinkEnd: "。",
    helpsTitle: "Check AI Code 能帮到哪里",
    helpsIntro:
      "Check AI Code 就是给这种上线前第一轮检查用的。粘贴代码或上传文件，把结果当作合并、部署或交给人工 review 前的风险信号。",
    helps: [
      "可以提示 async 误用、危险默认值等实际 bug 模式。",
      "可以标出密钥、路径、命令和输入相关的安全坑。",
      "可以帮你发现生成代码里脆弱的假设。",
      "Pro 用户可根据代码敏感程度选择更深审查或 Privacy Mode。",
    ],
    limitsTitle: "它不能保证什么",
    limits: [
      "一次干净的扫描很有用，但不是代码安全证明。Check AI Code 不能替代测试、类型检查、人工审查、依赖扫描、运行时监控或正式安全审计。",
      "把结果当作排序后的审查助手。它能帮你更快分配注意力，但最终决定仍由团队负责。",
    ],
    workflowTitle: "一个简单的审查流程",
    workflow: [
      "先让 AI 工具解释改动，并列出自己的假设。",
      "运行测试、类型检查和 lint。",
      "把风险最高的文件粘到 Check AI Code 做第一轮扫描。",
      "先修 Critical，再请求人工 review。",
      "由人确认产品逻辑、数据策略和用户影响。",
    ],
    ctaTitle: "现在审查一个生成文件",
    ctaBody:
      "从你最不放心的文件开始：API handler、支付回调、认证 helper、上传路由或 async 工作流。上线前 5 分钟检查，通常比用户遇到问题后再修便宜得多。",
    cta: "试用 Check AI Code",
  },
};

export function AIGeneratedCodeReviewChecklistContent() {
  const { lang } = useI18n();
  const c = copy[lang];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
            <span aria-hidden="true">&larr;</span>
            Check AI Code
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/review"
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/70 transition hover:border-neon/40 hover:text-white"
            >
              {c.tryReview}
            </Link>
            <LangToggle />
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        <article className="mx-auto max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-neon/20 bg-neon/5 px-3 py-1 text-xs font-medium text-neon">
            {c.badge}
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {c.title}
          </h1>

          <p className="mt-5 text-lg leading-8 text-white/70">{c.intro1}</p>
          <p className="mt-4 leading-7 text-white/65">{c.intro2}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/review"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-neon px-5 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim"
            >
              {c.primary}
            </Link>
            <Link
              href="/guide"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              {c.secondary}
            </Link>
          </div>

          <Section title={c.whyTitle}>
            {c.why.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Section>

          <Section title={c.checklistTitle}>
            <ol className="grid gap-3">
              {c.checklist.map(([title, body]) => (
                <ChecklistItem key={title} title={title} body={body} />
              ))}
            </ol>
          </Section>

          <Section title={c.exampleTitle}>
            <p>
              {c.example1} <code className={codeClass}>forEach</code> {c.example2}
            </p>
            <CodeBlock>
              {`async function notifyUsers(users) {
  users.forEach(async (user) => {
    await sendEmail(user.email)
  })

  return { ok: true }
}`}
            </CodeBlock>
            <p>{c.safer}</p>
            <CodeBlock>
              {`async function notifyUsers(users) {
  await Promise.all(users.map((user) => sendEmail(user.email)))

  return { ok: true }
}`}
            </CodeBlock>
            <p>
              {c.asyncLinkBefore}{" "}
              <Link href="/guides/javascript-async-code-review" className="font-semibold text-neon transition hover:text-neon-dim">
                {c.asyncLink}
              </Link>
              {c.asyncLinkEnd}
            </p>
          </Section>

          <Section title={c.helpsTitle}>
            <p>{c.helpsIntro}</p>
            <ul className="list-disc space-y-2 pl-5">
              {c.helps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={c.limitsTitle}>
            {c.limits.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Section>

          <Section title={c.workflowTitle}>
            <ol className="list-decimal space-y-2 pl-5">
              {c.workflow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </Section>

          <div className="mt-8 rounded-lg border border-neon/20 bg-neon/[0.04] p-6">
            <h2 className="text-xl font-semibold text-white">{c.ctaTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">{c.ctaBody}</p>
            <Link
              href="/review"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-neon px-4 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim"
            >
              {c.cta}
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
