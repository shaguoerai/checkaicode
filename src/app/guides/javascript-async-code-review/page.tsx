import type { Metadata } from "next";
import Link from "next/link";

const title = "JavaScript Async Code Review: Common Bugs AI-Generated Code Still Makes";
const description =
  "Review JavaScript and TypeScript async code for common AI-generated bugs: async forEach, missing returns, fire-and-forget work, swallowed errors, and unsafe sequencing.";
const canonical = "https://checkaicode.com/guides/javascript-async-code-review";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title,
    description,
    type: "article",
    url: canonical,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: title,
  description,
  author: {
    "@type": "Organization",
    name: "Check AI Code",
  },
  datePublished: "2026-06-05",
  dateModified: "2026-06-05",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": canonical,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why do AI-generated JavaScript snippets often have async bugs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many async bugs are syntactically valid and look plausible in examples. AI tools can copy common patterns such as async forEach, unreturned promises, or fire-and-forget side effects without preserving the timing guarantees a production handler needs.",
      },
    },
    {
      "@type": "Question",
      name: "Can a clean async code review guarantee JavaScript code is safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Async review can catch common timing and error-handling mistakes, but it does not replace tests, type checks, load testing, manual review, or monitoring in production.",
      },
    },
  ],
};

const codeClass = "rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-white/85";

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
}: {
  title: string;
  risk: string;
  bad: string;
  better: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{risk}</p>
      <div className="mt-4 grid gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">Risky</p>
          <CodeBlock>{bad}</CodeBlock>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neon">Safer</p>
          <CodeBlock>{better}</CodeBlock>
        </div>
      </div>
    </section>
  );
}

export default function JavaScriptAsyncCodeReviewPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
            <span aria-hidden="true">&larr;</span>
            Check AI Code
          </Link>
          <Link
            href="/review"
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/70 transition hover:border-neon/40 hover:text-white"
          >
            Try review
          </Link>
        </div>
      </header>

      <main className="px-6 py-10">
        <article className="mx-auto max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-neon/20 bg-neon/5 px-3 py-1 text-xs font-medium text-neon">
            JavaScript async review
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            JavaScript Async Code Review: Common Bugs AI-Generated Code Still Makes
          </h1>

          <p className="mt-5 text-lg leading-8 text-white/70">
            Async bugs are easy to miss because the code often looks correct. JavaScript will accept
            the syntax, TypeScript may not complain, and a quick happy-path test can pass while real
            work still runs too late, fails silently, or happens in the wrong order.
          </p>

          <p className="mt-4 leading-7 text-white/65">
            This guide is for reviewing AI-generated JavaScript and TypeScript from tools like
            Cursor, Claude Code, Copilot, ChatGPT, and Codex. Use it before shipping API handlers,
            scripts, background jobs, checkout flows, notification systems, and batch operations.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/review"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-neon px-5 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim"
            >
              Scan JavaScript code
            </Link>
            <Link
              href="/guides/ai-generated-code-review-checklist"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              AI code review checklist
            </Link>
          </div>

          <Section title="Why Async Bugs Pass A Quick Visual Review">
            <p>
              AI-generated JavaScript usually follows familiar shapes. It calls{" "}
              <code className={codeClass}>map</code>, <code className={codeClass}>forEach</code>,{" "}
              <code className={codeClass}>Promise.all</code>, or an async API in a way that looks
              like examples from documentation. The problem is that timing is part of correctness.
            </p>
            <p>
              A review should ask: what must finish before the function returns, what can run in
              parallel, what must stay sequential, and what should happen when one async operation
              fails?
            </p>
          </Section>

          <Section title="Five Async Patterns To Check">
            <div className="space-y-5">
              <Pattern
                title="1. async forEach is not awaited"
                risk="The callback returns promises, but forEach does not wait for them. A handler can return success before emails, writes, or billing calls finish."
                bad={`async function notifyUsers(users) {
  users.forEach(async (user) => {
    await sendEmail(user.email)
  })

  return { ok: true }
}`}
                better={`async function notifyUsers(users) {
  await Promise.all(users.map((user) => sendEmail(user.email)))

  return { ok: true }
}`}
              />

              <Pattern
                title="2. map callback forgets to return the promise"
                risk="Promise.all receives an array of undefined values, so it resolves immediately instead of waiting for the work."
                bad={`async function syncOrders(orders) {
  await Promise.all(orders.map((order) => {
    api.syncOrder(order.id)
  }))
}`}
                better={`async function syncOrders(orders) {
  await Promise.all(orders.map((order) => {
    return api.syncOrder(order.id)
  }))
}`}
              />

              <Pattern
                title="3. side effects continue after the HTTP response"
                risk="The user sees success even if analytics, email, webhook, or database cleanup fails. That may be fine for non-critical work, but it should be intentional."
                bad={`async function POST(req) {
  const user = await createUser(await req.json())
  sendWelcomeEmail(user.email)

  return Response.json({ ok: true })
}`}
                better={`async function POST(req) {
  const user = await createUser(await req.json())
  await sendWelcomeEmail(user.email)

  return Response.json({ ok: true })
}`}
              />

              <Pattern
                title="4. errors are swallowed inside async handlers"
                risk="Generated code sometimes catches errors only to log and continue. That can hide failed writes, partial imports, or broken payment callbacks."
                bad={`async function importRows(rows) {
  for (const row of rows) {
    try {
      await saveRow(row)
    } catch (error) {
      console.log(error)
    }
  }
}`}
                better={`async function importRows(rows) {
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
}`}
              />

              <Pattern
                title="5. concurrency is used where order matters"
                risk="Promise.all is useful, but not when every step depends on the previous step or when operations must run inside one transaction."
                bad={`async function applyAccountEvents(account, events) {
  await Promise.all(events.map((event) => {
    return applyEvent(account.id, event)
  }))
}`}
                better={`async function applyAccountEvents(account, events) {
  for (const event of events) {
    await applyEvent(account.id, event)
  }
}`}
              />
            </div>
          </Section>

          <Section title="How To Review AI-Generated Async Code">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Mark every async operation that writes data, charges money, sends messages, or changes permissions.</li>
              <li>Decide which operations must finish before the response or success state.</li>
              <li>Use <code className={codeClass}>Promise.all</code> only when independent work can safely run in parallel.</li>
              <li>Keep sequential loops when order, rate limits, transactions, or shared state matter.</li>
              <li>Make failure behavior explicit: retry, return an error, store a failed job, or continue intentionally.</li>
              <li>Add tests for rejection, partial failure, empty arrays, duplicate requests, and slow dependencies.</li>
            </ol>
          </Section>

          <Section title="Where Check AI Code Helps">
            <p>
              Check AI Code can act as a fast first-pass review for JavaScript and TypeScript
              snippets. It is especially useful when AI generated a plausible API handler, webhook,
              script, or async workflow that you have not fully traced by hand.
            </p>
            <p>
              It does not prove the code is correct. It can help you spot common timing and error
              handling mistakes before you spend human review time on deeper product logic.
            </p>
          </Section>

          <div className="mt-8 rounded-lg border border-neon/20 bg-neon/[0.04] p-6">
            <h2 className="text-xl font-semibold text-white">Review one async snippet</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Start with the file where an AI tool wrote async control flow: checkout callbacks,
              email sending, imports, batch updates, or background jobs.
            </p>
            <Link
              href="/review"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-neon px-4 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim"
            >
              Try Check AI Code
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
