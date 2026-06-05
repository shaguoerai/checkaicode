import type { Metadata } from "next";
import Link from "next/link";

const title = "AI-Generated Code Review Checklist: What to Check Before You Ship";
const description =
  "A practical checklist for reviewing AI-generated code before shipping. Check async bugs, auth, input validation, secrets, files, dependencies, and tests.";
const canonical = "https://checkaicode.com/guides/ai-generated-code-review-checklist";

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
      name: "Does AI-generated code still need code review?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. AI-generated code can look plausible while still missing awaits, skipping validation, using stale APIs, leaking secrets, or misunderstanding business logic.",
      },
    },
    {
      "@type": "Question",
      name: "Can Check AI Code replace tests or human review?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Check AI Code is a fast first-pass review layer. It helps surface practical risks, but it does not replace tests, type checks, human review, dependency scanning, or formal security audits.",
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

function ChecklistItem({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
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

export default function AIGeneratedCodeReviewChecklistPage() {
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
            AI code review checklist
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            AI-Generated Code Review Checklist: What to Check Before You Ship
          </h1>

          <p className="mt-5 text-lg leading-8 text-white/70">
            AI-generated code often looks clean enough to merge. That is the danger. The first pass
            should not ask whether the code is elegant. It should ask whether the generated code
            actually finishes async work, validates input, protects secrets, uses real APIs, and has
            enough tests for the risky parts.
          </p>

          <p className="mt-4 leading-7 text-white/65">
            Use this checklist before you ship code from Claude Code, Cursor, GitHub Copilot,
            ChatGPT, Codex, or any other AI coding tool. It is designed for small files, components,
            scripts, API handlers, and pull requests where a fast first-pass review can save a more
            expensive mistake later.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/review"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-neon px-5 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim"
            >
              Run a free scan
            </Link>
            <Link
              href="/guide"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              Read product guide
            </Link>
          </div>

          <Section title="Why AI-Generated Code Needs A Different Review Habit">
            <p>
              AI coding tools are good at producing plausible code. They are less reliable at
              preserving hidden requirements: the exact framework version, the shape of production
              data, the security model, the difference between an example and a real endpoint, or
              the timing of async side effects.
            </p>
            <p>
              That means your review should start with practical failure modes. Do not stop at
              whether the code looks real. Ask what would break if you shipped it today.
            </p>
          </Section>

          <Section title="The 10-Point Checklist">
            <ol className="grid gap-3">
              <ChecklistItem
                title="1. Does async work finish before the function returns?"
                body="Look for async forEach, unreturned promises, fire-and-forget writes, background jobs without retries, and responses sent before side effects complete."
              />
              <ChecklistItem
                title="2. Are auth and session checks enforced on the server?"
                body="AI-generated UI checks are not enough. Confirm the API route, server action, webhook, or database write verifies the user and permission model."
              />
              <ChecklistItem
                title="3. Are inputs validated before database, file, or network use?"
                body="Check request bodies, query strings, uploaded filenames, JSON payloads, webhook data, and user-controlled IDs before they reach sensitive operations."
              />
              <ChecklistItem
                title="4. Are secrets, tokens, and private data protected?"
                body="Watch for hardcoded keys, verbose logs, client-side env usage, debug output, accidental response fields, and secret values included in error messages."
              />
              <ChecklistItem
                title="5. Are file paths and uploads constrained?"
                body="Generated code often handles files too casually. Confirm extension checks, size limits, path normalization, safe storage locations, and content-type handling."
              />
              <ChecklistItem
                title="6. Are framework APIs current for your version?"
                body="AI models can mix examples from old and new docs. Verify routing APIs, auth helpers, server/client boundaries, config names, and deprecated methods."
              />
              <ChecklistItem
                title="7. Are dependencies real, necessary, and trusted?"
                body="Check package names, install size, maintenance status, licensing, and whether the generated code invented an import that does not exist."
              />
              <ChecklistItem
                title="8. Are errors handled without hiding failures?"
                body="Empty catch blocks, generic fallback returns, and swallowed promise rejections make generated code look stable while hiding production failures."
              />
              <ChecklistItem
                title="9. Do tests cover edge cases, not only the happy path?"
                body="Generated tests often prove the example works. Add cases for empty input, invalid permissions, failed network calls, duplicate requests, and boundary values."
              />
              <ChecklistItem
                title="10. Does a human understand the business logic?"
                body="No scanner can know every product rule. Ask whether the code matches the actual user promise, pricing rule, refund rule, entitlement rule, or data policy."
              />
            </ol>
          </Section>

          <Section title="Example: Async Code That Looks Fine But Returns Too Early">
            <p>
              This pattern is common in generated JavaScript and TypeScript. The function returns
              before the async work inside <code className={codeClass}>forEach</code> is awaited.
            </p>
            <CodeBlock>
              {`async function notifyUsers(users) {
  users.forEach(async (user) => {
    await sendEmail(user.email)
  })

  return { ok: true }
}`}
            </CodeBlock>
            <p>A safer shape is to collect promises and await them explicitly.</p>
            <CodeBlock>
              {`async function notifyUsers(users) {
  await Promise.all(users.map((user) => sendEmail(user.email)))

  return { ok: true }
}`}
            </CodeBlock>
            <p>
              For more JavaScript and TypeScript examples, read the dedicated{" "}
              <Link href="/guides/javascript-async-code-review" className="font-semibold text-neon transition hover:text-neon-dim">
                async code review guide
              </Link>
              .
            </p>
          </Section>

          <Section title="Where Check AI Code Helps">
            <p>
              Check AI Code is built for this first-pass review moment. Paste code or upload a file,
              then use the results as risk signals before you merge, deploy, or hand the code to a
              human reviewer.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>It can flag practical bug patterns such as async misuse and dangerous defaults.</li>
              <li>It can highlight security footguns around secrets, paths, commands, and input.</li>
              <li>It can help you notice generated code that depends on fragile assumptions.</li>
              <li>Pro users can use deeper review and Privacy Mode depending on the sensitivity of the code.</li>
            </ul>
          </Section>

          <Section title="What It Does Not Guarantee">
            <p>
              A clean scan is useful, but it is not a proof that code is safe. Check AI Code does
              not replace tests, type checks, manual review, dependency scanning, runtime monitoring,
              or a formal security audit.
            </p>
            <p>
              Treat the output as a prioritized review assistant. It can help you spend attention
              faster, but your team still owns the final decision.
            </p>
          </Section>

          <Section title="A Simple Review Workflow">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Ask the AI tool to explain the change and list its own assumptions.</li>
              <li>Run the code through tests, type checks, and linters.</li>
              <li>Paste the highest-risk file into Check AI Code for a first-pass scan.</li>
              <li>Fix critical issues before asking for human review.</li>
              <li>Have a human verify product logic, data policy, and user impact.</li>
            </ol>
          </Section>

          <div className="mt-8 rounded-lg border border-neon/20 bg-neon/[0.04] p-6">
            <h2 className="text-xl font-semibold text-white">Review one generated file now</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Start with the file you trust least: an API handler, payment callback, auth helper,
              upload route, or async workflow. A five-minute first pass is cheaper than finding the
              issue after users do.
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
