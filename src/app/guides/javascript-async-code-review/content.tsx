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

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#101010] p-4 text-sm leading-6 text-white/75">
      <code>{children}</code>
    </pre>
  );
}

function Pattern({
  title,
  risk,
  bad,
  better,
  riskyLabel,
  saferLabel,
}: {
  title: string;
  risk: string;
  bad: string;
  better: string;
  riskyLabel: string;
  saferLabel: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{risk}</p>
      <div className="mt-4 grid gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">{riskyLabel}</p>
          <CodeBlock>{bad}</CodeBlock>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neon">{saferLabel}</p>
          <CodeBlock>{better}</CodeBlock>
        </div>
      </div>
    </section>
  );
}

const patterns = {
  en: [
    {
      title: "1. async forEach is not awaited",
      risk: "The callback returns promises, but forEach does not wait for them. A handler can return success before emails, writes, or billing calls finish.",
      bad: `async function notifyUsers(users) {
  users.forEach(async (user) => {
    await sendEmail(user.email)
  })

  return { ok: true }
}`,
      better: `async function notifyUsers(users) {
  await Promise.all(users.map((user) => sendEmail(user.email)))

  return { ok: true }
}`,
    },
    {
      title: "2. map callback forgets to return the promise",
      risk: "Promise.all receives an array of undefined values, so it resolves immediately instead of waiting for the work.",
      bad: `async function syncOrders(orders) {
  await Promise.all(orders.map((order) => {
    api.syncOrder(order.id)
  }))
}`,
      better: `async function syncOrders(orders) {
  await Promise.all(orders.map((order) => {
    return api.syncOrder(order.id)
  }))
}`,
    },
    {
      title: "3. side effects continue after the HTTP response",
      risk: "The user sees success even if analytics, email, webhook, or database cleanup fails. That may be fine for non-critical work, but it should be intentional.",
      bad: `async function POST(req) {
  const user = await createUser(await req.json())
  sendWelcomeEmail(user.email)

  return Response.json({ ok: true })
}`,
      better: `async function POST(req) {
  const user = await createUser(await req.json())
  await sendWelcomeEmail(user.email)

  return Response.json({ ok: true })
}`,
    },
    {
      title: "4. errors are swallowed inside async handlers",
      risk: "Generated code sometimes catches errors only to log and continue. That can hide failed writes, partial imports, or broken payment callbacks.",
      bad: `async function importRows(rows) {
  for (const row of rows) {
    try {
      await saveRow(row)
    } catch (error) {
      console.log(error)
    }
  }
}`,
      better: `async function importRows(rows) {
  const failures = []

  for (const row of rows) {
    try {
      await saveRow(row)
    } catch (error) {
      failures.push({ row, error })
    }
  }

  if (failures.length) {
    throw new Error(\`Failed to import \${failures.length} rows\`)
  }
}`,
    },
    {
      title: "5. concurrency is used where order matters",
      risk: "Promise.all is useful, but not when every step depends on the previous step or when operations must run inside one transaction.",
      bad: `async function applyAccountEvents(account, events) {
  await Promise.all(events.map((event) => {
    return applyEvent(account.id, event)
  }))
}`,
      better: `async function applyAccountEvents(account, events) {
  for (const event of events) {
    await applyEvent(account.id, event)
  }
}`,
    },
  ],
  zh: [
    {
      title: "1. async forEach 不会被等待",
      risk: "回调里返回了 promise，但 forEach 不会等待它们。handler 可能在邮件、写入或扣费调用完成前就返回成功。",
      bad: `async function notifyUsers(users) {
  users.forEach(async (user) => {
    await sendEmail(user.email)
  })

  return { ok: true }
}`,
      better: `async function notifyUsers(users) {
  await Promise.all(users.map((user) => sendEmail(user.email)))

  return { ok: true }
}`,
    },
    {
      title: "2. map 回调忘记 return promise",
      risk: "Promise.all 收到的是 undefined 数组，所以会立刻完成，而不是等待真正的异步工作。",
      bad: `async function syncOrders(orders) {
  await Promise.all(orders.map((order) => {
    api.syncOrder(order.id)
  }))
}`,
      better: `async function syncOrders(orders) {
  await Promise.all(orders.map((order) => {
    return api.syncOrder(order.id)
  }))
}`,
    },
    {
      title: "3. HTTP 响应后副作用还在继续",
      risk: "用户看到了成功，但 analytics、邮件、webhook 或数据库清理可能已经失败。非关键任务可以这样做，但必须是有意设计。",
      bad: `async function POST(req) {
  const user = await createUser(await req.json())
  sendWelcomeEmail(user.email)

  return Response.json({ ok: true })
}`,
      better: `async function POST(req) {
  const user = await createUser(await req.json())
  await sendWelcomeEmail(user.email)

  return Response.json({ ok: true })
}`,
    },
    {
      title: "4. async handler 里把错误吞掉",
      risk: "生成代码有时只是 log 一下错误然后继续。这会隐藏写入失败、部分导入失败或支付回调失败。",
      bad: `async function importRows(rows) {
  for (const row of rows) {
    try {
      await saveRow(row)
    } catch (error) {
      console.log(error)
    }
  }
}`,
      better: `async function importRows(rows) {
  const failures = []

  for (const row of rows) {
    try {
      await saveRow(row)
    } catch (error) {
      failures.push({ row, error })
    }
  }

  if (failures.length) {
    throw new Error(\`Failed to import \${failures.length} rows\`)
  }
}`,
    },
    {
      title: "5. 需要顺序执行的地方用了并发",
      risk: "Promise.all 很有用，但不适合每一步都依赖前一步，或必须在同一个事务里顺序执行的操作。",
      bad: `async function applyAccountEvents(account, events) {
  await Promise.all(events.map((event) => {
    return applyEvent(account.id, event)
  }))
}`,
      better: `async function applyAccountEvents(account, events) {
  for (const event of events) {
    await applyEvent(account.id, event)
  }
}`,
    },
  ],
};

const copy = {
  en: {
    tryReview: "Try review",
    badge: "JavaScript async review",
    title: "JavaScript Async Code Review: Common Bugs AI-Generated Code Still Makes",
    intro1:
      "Async bugs are easy to miss because the code often looks correct. JavaScript will accept the syntax, TypeScript may not complain, and a quick happy-path test can pass while real work still runs too late, fails silently, or happens in the wrong order.",
    intro2:
      "This guide is for reviewing AI-generated JavaScript and TypeScript from tools like Cursor, Claude Code, Copilot, ChatGPT, and Codex. Use it before shipping API handlers, scripts, background jobs, checkout flows, notification systems, and batch operations.",
    primary: "Scan JavaScript code",
    secondary: "AI code review checklist",
    whyTitle: "Why Async Bugs Pass A Quick Visual Review",
    why: [
      "AI-generated JavaScript usually follows familiar shapes. It calls map, forEach, Promise.all, or an async API in a way that looks like examples from documentation. The problem is that timing is part of correctness.",
      "A review should ask: what must finish before the function returns, what can run in parallel, what must stay sequential, and what should happen when one async operation fails?",
    ],
    patternsTitle: "Five Async Patterns To Check",
    risky: "Risky",
    safer: "Safer",
    workflowTitle: "How To Review AI-Generated Async Code",
    workflow: [
      "Mark every async operation that writes data, charges money, sends messages, or changes permissions.",
      "Decide which operations must finish before the response or success state.",
      "Use Promise.all only when independent work can safely run in parallel.",
      "Keep sequential loops when order, rate limits, transactions, or shared state matter.",
      "Make failure behavior explicit: retry, return an error, store a failed job, or continue intentionally.",
      "Add tests for rejection, partial failure, empty arrays, duplicate requests, and slow dependencies.",
    ],
    helpsTitle: "Where Check AI Code Helps",
    helps: [
      "Check AI Code can act as a fast first-pass review for JavaScript and TypeScript snippets. It is especially useful when AI generated a plausible API handler, webhook, script, or async workflow that you have not fully traced by hand.",
      "It does not prove the code is correct. It can help you spot common timing and error-handling mistakes before you spend human review time on deeper product logic.",
    ],
    ctaTitle: "Review one async snippet",
    ctaBody:
      "Start with the file where an AI tool wrote async control flow: checkout callbacks, email sending, imports, batch updates, or background jobs.",
    cta: "Try Check AI Code",
  },
  zh: {
    tryReview: "试用审查",
    badge: "JavaScript async 审查",
    title: "JavaScript Async 代码审查：AI 生成代码仍然常犯的错误",
    intro1:
      "Async bug 很容易漏掉，因为代码看起来常常是对的。JavaScript 会接受语法，TypeScript 也可能不报错，简单 happy-path 测试还能通过，但真实工作可能执行太晚、静默失败，或者顺序错了。",
    intro2:
      "这篇指南适合审查 Cursor、Claude Code、Copilot、ChatGPT、Codex 等工具生成的 JavaScript 和 TypeScript。尤其适合 API handler、脚本、后台任务、支付流程、通知系统和批处理上线前自查。",
    primary: "扫描 JavaScript 代码",
    secondary: "AI 代码检查清单",
    whyTitle: "为什么 async bug 看一眼很难发现",
    why: [
      "AI 生成的 JavaScript 通常会套用熟悉的形状：map、forEach、Promise.all 或某个 async API，看起来像文档示例。问题是，执行时机本身就是正确性的一部分。",
      "审查时要问：哪些必须在函数返回前完成？哪些可以并发？哪些必须顺序执行？某个异步操作失败时应该发生什么？",
    ],
    patternsTitle: "需要检查的 5 个 async 模式",
    risky: "有风险",
    safer: "更安全",
    workflowTitle: "如何审查 AI 生成的 async 代码",
    workflow: [
      "标出每个会写数据、扣费、发消息或改变权限的 async 操作。",
      "决定哪些操作必须在响应或成功状态前完成。",
      "只有独立工作可以安全并发时，才使用 Promise.all。",
      "当顺序、限流、事务或共享状态重要时，保留顺序循环。",
      "明确失败行为：重试、返回错误、记录失败任务，或有意继续。",
      "为 reject、部分失败、空数组、重复请求和慢依赖补测试。",
    ],
    helpsTitle: "Check AI Code 能帮到哪里",
    helps: [
      "Check AI Code 可以作为 JavaScript 和 TypeScript 片段的第一轮快速审查。特别适合 AI 写出的 API handler、webhook、脚本或 async 工作流，而你还没完全手动追过执行路径的时候。",
      "它不能证明代码一定正确，但能在你投入人工 review 深挖业务逻辑前，先帮你发现常见的时序和错误处理问题。",
    ],
    ctaTitle: "审查一个 async 片段",
    ctaBody:
      "从 AI 写了 async 控制流的文件开始：支付回调、邮件发送、导入、批量更新或后台任务。",
    cta: "试用 Check AI Code",
  },
};

export function JavaScriptAsyncCodeReviewContent() {
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
              href="/guides/ai-generated-code-review-checklist"
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

          <Section title={c.patternsTitle}>
            <div className="space-y-5">
              {patterns[lang].map((pattern) => (
                <Pattern
                  key={pattern.title}
                  title={pattern.title}
                  risk={pattern.risk}
                  bad={pattern.bad}
                  better={pattern.better}
                  riskyLabel={c.risky}
                  saferLabel={c.safer}
                />
              ))}
            </div>
          </Section>

          <Section title={c.workflowTitle}>
            <ol className="list-decimal space-y-2 pl-5">
              {c.workflow.map((item) => (
                <li key={item}>
                  {item.includes("Promise.all") ? (
                    <>
                      {item.split("Promise.all")[0]}
                      <code className={codeClass}>Promise.all</code>
                      {item.split("Promise.all")[1]}
                    </>
                  ) : (
                    item
                  )}
                </li>
              ))}
            </ol>
          </Section>

          <Section title={c.helpsTitle}>
            {c.helps.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
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
