import type { Metadata } from "next";
import Link from "next/link";

const title = "Claude Code Skills: Stable Patterns, Setup, and Examples";
const description =
  "A practical guide to Claude Code skills. Learn setup, stable patterns, and what to avoid — with notes on what we tested.";
const canonical = "https://checkaicode.com/guides/claude-code-skills";

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

const techArticleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Claude Code Skills: Stable Patterns, Setup, and Examples That Still Work",
  description:
    "A practical guide to Claude Code skills with documented file structures and notes on what we tested.",
  author: {
    "@type": "Organization",
    name: "Check AI Code",
  },
  datePublished: "2026-05-22",
  dateModified: "2026-05-22",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": canonical,
  },
};

function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm italic text-white/45">Source: {children}</p>;
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-white/10 bg-[#111] p-4 text-sm leading-relaxed text-white/75">
      <code>{children}</code>
    </pre>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-[520px] w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-white/10 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white/50">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-white/10 px-3 py-2 align-top text-white/65">{children}</td>;
}

const codeClass = "rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-white/85";

export default function ClaudeCodeSkillsGuidePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }}
      />

      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
            <span aria-hidden="true">←</span>
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
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Claude Code Skills: Stable Patterns, Setup, and Examples That Still Work
          </h1>

          <p className="mt-5 text-lg leading-8 text-white/70">
            If you use Claude Code and keep pasting the same instructions into chat, skills are
            the feature you are looking for. This guide shows you how to set them up, what patterns
            work, and what to avoid without reading the full reference documentation.
          </p>

          <p className="mt-4 leading-7 text-white/65">
            This is not a rewrite of the official docs. The official docs are comprehensive but
            organized by feature. This guide is organized by what you actually want to do: automate
            a git workflow, enforce code review rules, or package a reusable tool. It also includes
            notes on what we tested and what we did not, so you know what to verify yourself.
          </p>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">What We Tested and What We Did Not</h2>
            <p className="mt-4 leading-7 text-white/65">
              We read the official Anthropic documentation and created skill files matching the
              documented format. We confirmed the <code className={codeClass}>claude</code> binary
              is installed (v2.1.119). We did not start an interactive Claude Code session, so we did
              not verify that Claude recognizes or loads skills at runtime.
            </p>
            <p className="mt-4 font-semibold text-white">What we did:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-white/65">
              <li>
                Created <code className={codeClass}>~/.claude/skills/summarize-changes/SKILL.md</code>{" "}
                matching official syntax
              </li>
              <li>
                Wrote YAML frontmatter and dynamic injection syntax (
                <code className={codeClass}>!`command`</code>)
              </li>
              <li>Confirmed CLI presence</li>
            </ul>
            <p className="mt-4 font-semibold text-white">What we did not do:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-white/65">
              <li>Start an interactive session to test skill invocation</li>
              <li>Verify auto-discovery across directories</li>
              <li>Test Desktop or Web behavior</li>
              <li>Run any bundled or community skills</li>
            </ul>
            <p className="mt-4 leading-7 text-white/65">
              Sections below note their source so you know what to verify yourself.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">What Are Claude Code Skills?</h2>
            <p className="mt-4 leading-7 text-white/65">
              A skill is a directory containing a <code className={codeClass}>SKILL.md</code> file.
              That file has two parts: YAML frontmatter between <code className={codeClass}>---</code>{" "}
              markers, and markdown instructions that Claude follows when the skill runs.
            </p>
            <p className="mt-4 leading-7 text-white/65">Claude loads a skill in two ways:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-white/65">
              <li>
                <strong className="text-white">Automatically</strong> — when your request matches
                the skill&apos;s <code className={codeClass}>description</code>
              </li>
              <li>
                <strong className="text-white">Manually</strong> — when you type{" "}
                <code className={codeClass}>/skill-name</code> in the chat
              </li>
            </ul>
            <p className="mt-4 leading-7 text-white/65">
              The directory name becomes the command. A skill at{" "}
              <code className={codeClass}>~/.claude/skills/summarize-changes/</code> is invoked with{" "}
              <code className={codeClass}>/summarize-changes</code>.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">How Skills Differ from Related Concepts</h3>
            <SourceNote>Official docs + Community</SourceNote>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Feature</Th>
                  <Th>Skills</Th>
                  <Th>MCP</Th>
                  <Th>Commands</Th>
                  <Th>CLAUDE.md</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>What it is</Td>
                  <Td>Markdown + optional scripts</Td>
                  <Td>External server protocol</Td>
                  <Td>Markdown file (legacy)</Td>
                  <Td>Project context file</Td>
                </tr>
                <tr>
                  <Td>Trigger</Td>
                  <Td>Auto (description match) or <code className={codeClass}>/name</code></Td>
                  <Td>Tool call</Td>
                  <Td><code className={codeClass}>/name</code></Td>
                  <Td>Always loaded</Td>
                </tr>
                <tr>
                  <Td>Scope</Td>
                  <Td>Personal, Project, Plugin, Enterprise</Td>
                  <Td>External service</Td>
                  <Td>Project only</Td>
                  <Td>Project only</Td>
                </tr>
                <tr>
                  <Td>Network access</Td>
                  <Td>Depends on environment. Not covered here.</Td>
                  <Td>Not covered here.</Td>
                  <Td>Not covered here.</Td>
                  <Td>N/A</Td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="leading-7 text-white/65">
              <strong className="text-white">Note on network access:</strong> Skills can run shell
              commands and scripts, but what actually works depends on your environment permissions,
              API keys, network connectivity, and Claude Code&apos;s permission system. A skill that
              calls <code className={codeClass}>curl</code> will fail if the machine has no internet.
              A skill that runs <code className={codeClass}>docker</code> will fail if Docker is not
              installed. This guide does not cover Desktop or Web behavior.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Why Skills Exist</h3>
            <SourceNote>Official docs</SourceNote>
            <p className="leading-7 text-white/65">
              Anthropic&apos;s stated reason: &quot;Create a skill when you keep pasting the same
              instructions, checklist, or multi-step procedure into chat.&quot;
            </p>
            <p className="mt-4 leading-7 text-white/65">
              The key difference from <code className={codeClass}>CLAUDE.md</code> is loading
              behavior. <code className={codeClass}>CLAUDE.md</code> is always in context. A
              skill&apos;s body loads only when it is used, so long reference material costs nothing
              until you need it.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">File Structure and Format</h2>
            <SourceNote>Official docs + Partial test</SourceNote>
            <h3 className="mt-6 text-xl font-semibold text-white">Minimum Viable Skill</h3>
            <CodeBlock>{`skill-name/
└── SKILL.md`}</CodeBlock>
            <p className="leading-7 text-white/65">
              We created this directory structure and matched it to the official docs. We did not
              start an interactive Claude Code session to confirm the skill loads.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Full Skill Directory</h3>
            <CodeBlock>{`skill-name/
├── SKILL.md           # Required. Entry point.
├── template.md        # Optional. Template for Claude to fill.
├── examples/
│   └── sample.md      # Optional. Example output.
└── scripts/
    └── helper.py      # Optional. Executable script.`}</CodeBlock>
            <p className="leading-7 text-white/65">
              The official docs recommend referencing supporting files from{" "}
              <code className={codeClass}>SKILL.md</code> so Claude knows what each contains and when
              to load it.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">SKILL.md Format</h3>
            <CodeBlock>{`---
description: Summarizes uncommitted changes and flags anything risky.
---

## Current changes

!\`git diff HEAD\`

## Instructions

Summarize the changes above in two or three bullet points, then list any risks you notice such as missing error handling, hardcoded values, or tests that need updating. If the diff is empty, say there are no uncommitted changes.`}</CodeBlock>
            <p className="leading-7 text-white/65">
              The <code className={codeClass}>description</code> field is recommended. Claude uses
              it to decide when to apply the skill automatically. If you omit it, Claude falls back
              to the first paragraph of the markdown body.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Where Skills Live</h3>
            <SourceNote>Official docs + Partial test</SourceNote>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Level</Th>
                  <Th>Path</Th>
                  <Th>Scope</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Personal</Td>
                  <Td><code className={codeClass}>~/.claude/skills/&lt;name&gt;/</code></Td>
                  <Td>All your projects</Td>
                </tr>
                <tr>
                  <Td>Project</Td>
                  <Td><code className={codeClass}>.claude/skills/&lt;name&gt;/</code></Td>
                  <Td>Current project only</Td>
                </tr>
                <tr>
                  <Td>Plugin</Td>
                  <Td><code className={codeClass}>&lt;plugin&gt;/skills/&lt;name&gt;/</code></Td>
                  <Td>Where plugin is enabled</Td>
                </tr>
                <tr>
                  <Td>Enterprise</Td>
                  <Td>Managed settings</Td>
                  <Td>Organization-wide</Td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="leading-7 text-white/65">
              Priority is Enterprise &gt; Personal &gt; Project. Plugin skills use a{" "}
              <code className={codeClass}>plugin-name:skill-name</code> namespace, so they cannot
              conflict with other levels.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              We created a skill at{" "}
              <code className={codeClass}>~/.claude/skills/summarize-changes/</code> and matched the
              file structure to the official specification. We did not verify that Claude Code
              detects it across projects.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Live Change Detection</h3>
            <SourceNote>Official docs</SourceNote>
            <p className="leading-7 text-white/65">
              Claude Code watches skill directories for file changes. Adding, editing, or removing a
              skill under <code className={codeClass}>~/.claude/skills/</code>, the project{" "}
              <code className={codeClass}>.claude/skills/</code>, or an{" "}
              <code className={codeClass}>--add-dir</code> directory takes effect within the current
              session without restarting.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              One exception: creating a top-level skills directory that did not exist when the
              session started requires restarting Claude Code so the new directory can be watched.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">Stable Patterns</h2>
            <SourceNote>Official docs + Community</SourceNote>
            <p className="leading-7 text-white/65">
              The patterns below are organized by what they do, not by trendiness. They use core
              features — file structure, frontmatter, dynamic injection — that are unlikely to change.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Pattern 1: Git Workflow Automation</h3>
            <p className="mt-3 leading-7 text-white/65">
              <strong className="text-white">What it does:</strong> Summarize uncommitted changes,
              suggest commit messages, flag risks.
            </p>
            <SourceNote>Official docs</SourceNote>
            <p className="leading-7 text-white/65">
              This is the official docs example. It uses dynamic context injection to pull the live
              diff into the prompt before Claude reads it.
            </p>
            <CodeBlock>{`---
description: Summarizes uncommitted changes and flags anything risky. Use when the user asks what changed, wants a commit message, or asks to review their diff.
---

## Current changes

!\`git diff HEAD\`

## Instructions

Summarize the changes above in two or three bullet points, then list any risks you notice such as missing error handling, hardcoded values, or tests that need updating. If the diff is empty, say there are no uncommitted changes.`}</CodeBlock>
            <p className="leading-7 text-white/65">
              The <code className={codeClass}>!`git diff HEAD`</code> line is preprocessing, not
              something Claude executes. Claude Code runs the command and replaces the line with its
              output before Claude sees the skill content. The skill arrives with the current diff
              already inlined.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              <strong className="text-white">Why this pattern is stable:</strong> It uses dynamic
              injection and description matching — core features documented since skills launched.
              No experimental flags.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Pattern 2: Code Review Checklist</h3>
            <p className="mt-3 leading-7 text-white/65">
              <strong className="text-white">What it does:</strong> Enforce consistent review
              criteria across a team.
            </p>
            <SourceNote>Official docs + Not tested</SourceNote>
            <p className="leading-7 text-white/65">Structure:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-white/65">
              <li><code className={codeClass}>SKILL.md</code> with review criteria</li>
              <li>Optional <code className={codeClass}>examples/</code> with past review outputs</li>
              <li>
                <code className={codeClass}>disable-model-invocation: true</code> so the skill only
                runs when explicitly called with <code className={codeClass}>/review</code>
              </li>
            </ul>
            <p className="mt-4 leading-7 text-white/65">
              We derived this from the official frontmatter reference and community patterns
              referenced on Hacker News. We did not implement or test it.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Pattern 3: Project Conventions</h3>
            <p className="mt-3 leading-7 text-white/65">
              <strong className="text-white">What it does:</strong> Encode API patterns, naming
              conventions, or architecture rules.
            </p>
            <SourceNote>Official docs + Not tested</SourceNote>
            <p className="leading-7 text-white/65">
              This is &quot;reference content&quot; in the official docs taxonomy — knowledge Claude
              applies to your current work, not a task to execute. Claude loads it automatically when
              you edit matching files.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              You can limit activation with the <code className={codeClass}>paths:</code> frontmatter
              field:
            </p>
            <CodeBlock>{`---
description: API design patterns for this codebase
paths: "src/api/**/*.ts"
---`}</CodeBlock>
            <p className="leading-7 text-white/65">
              We have not tested whether <code className={codeClass}>paths</code> matching works as
              documented.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Pattern 4: Self-Contained Tool</h3>
            <p className="mt-3 leading-7 text-white/65">
              <strong className="text-white">What it does:</strong> Script that talks to an API or
              runs local commands without external dependencies.
            </p>
            <SourceNote>Community — not independently verified</SourceNote>
            <p className="leading-7 text-white/65">
              Nick Nisi, a developer who presented on skills at his company in October 2025,
              described a &quot;GPT-5 Consultant&quot; skill: a self-contained script that knows how
              to talk to the OpenAI API. No external MCP server needed. &quot;Clean. No external MCP
              needed.&quot;
            </p>
            <p className="mt-4 leading-7 text-white/65">
              This pattern is useful when you need a quick integration and do not want to set up and
              maintain an MCP server. The tradeoff: the script runs in your environment, so you
              manage credentials and errors.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              We did not verify this skill exists or works as described.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Pattern 5: Visualization and Reporting</h3>
            <p className="mt-3 leading-7 text-white/65">
              <strong className="text-white">What it does:</strong> Generate HTML reports, dependency
              graphs, or codebase maps.
            </p>
            <SourceNote>Official docs + Not tested</SourceNote>
            <p className="leading-7 text-white/65">
              The official docs include a codebase visualizer example: a Python script that scans a
              directory tree and generates a self-contained HTML file with collapsible directories,
              file sizes, and type breakdowns. The script uses only built-in libraries.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              The skill references the script with{" "}
              <code className={codeClass}>{"${CLAUDE_SKILL_DIR}"}</code> so the path resolves
              correctly regardless of where the skill is installed:
            </p>
            <CodeBlock>{`Run the visualization script:

\`\`\`bash
python3 \${CLAUDE_SKILL_DIR}/scripts/visualize.py .
\`\`\``}</CodeBlock>
            <p className="leading-7 text-white/65">We did not run this script.</p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">What Ages Fast</h2>
            <SourceNote>SERP observation + Editorial</SourceNote>
            <h3 className="mt-6 text-xl font-semibold text-white">Community Source Decay</h3>
            <p className="mt-3 leading-7 text-white/65">
              On 2026-05-22 we checked a single Google search results page for &quot;Claude Code
              skills.&quot; Of five sources in the top ten results:
            </p>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Source</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Firecrawl &quot;Best Claude Code Skills&quot;</Td>
                  <Td>404/Redirect</Td>
                </tr>
                <tr>
                  <Td>Bozhidar Batsov blog</Td>
                  <Td>404</Td>
                </tr>
                <tr>
                  <Td>DEV.to article</Td>
                  <Td>404</Td>
                </tr>
                <tr>
                  <Td>HN discussion</Td>
                  <Td>Blocked</Td>
                </tr>
                <tr>
                  <Td>Nick Nisi blog</Td>
                  <Td>Available</Td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="leading-7 text-white/65">
              This is a small SERP sample, not a systematic study. Three of five sources from one
              results page were unavailable during our check.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">What This Means</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-white/65">
              <li>
                <strong className="text-white">Stable:</strong> File structure, frontmatter syntax,
                core concepts. These are tied to the product and documented officially.
              </li>
              <li>
                <strong className="text-white">Ages fast:</strong> Specific skill lists, &quot;best
                of&quot; roundups, trendy examples. These depend on community interest and hosting
                continuity.
              </li>
              <li>
                <strong className="text-white">Action:</strong> Learn patterns, not specific skills.
                Verify any community skill in a throwaway project before relying on it.
              </li>
            </ul>

            <h3 className="mt-8 text-xl font-semibold text-white">How to Verify a Skill Still Works</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/65">
              <li>Check the official docs for syntax changes</li>
              <li>Test in a temporary project before adding to your workflow</li>
              <li>
                Prefer bundled skills (<code className={codeClass}>/debug</code>,{" "}
                <code className={codeClass}>/code-review</code>) — Anthropic maintains these
              </li>
            </ol>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">Claude Code vs Desktop/Web</h2>
            <SourceNote>Community + Not tested</SourceNote>
            <p className="mt-4 leading-7 text-white/65">
              This guide focuses on Claude Code CLI. We do not cover Desktop or Web behavior in
              detail because we have not tested it.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              Nick Nisi, a developer who presented on skills at his company in October 2025, noted
              that skills in Claude Desktop and Web may have restrictions not present in the CLI.
              Specifically, he observed that network-dependent skills — those calling external APIs
              or running <code className={codeClass}>curl</code> — may behave differently or fail in
              Desktop/Web environments.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              We did not verify this. If you write a skill that relies on network access, test it in
              your target environment before sharing it.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">Common Frontmatter Fields</h2>
            <SourceNote>Official docs</SourceNote>
            <h3 className="mt-6 text-xl font-semibold text-white">Essential Fields</h3>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Field</Th>
                  <Th>Required</Th>
                  <Th>Purpose</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td><code className={codeClass}>description</code></Td>
                  <Td>Recommended</Td>
                  <Td>What the skill does and when to use it. Claude uses this for auto-invocation.</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>name</code></Td>
                  <Td>No</Td>
                  <Td>Display name. Defaults to the directory name.</Td>
                </tr>
              </tbody>
            </TableWrap>

            <h3 className="mt-8 text-xl font-semibold text-white">Invocation Control</h3>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Field</Th>
                  <Th>Effect</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td><code className={codeClass}>disable-model-invocation: true</code></Td>
                  <Td>Only you can invoke it with <code className={codeClass}>/name</code>. Claude will not auto-trigger it.</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>user-invocable: false</code></Td>
                  <Td>Only Claude can auto-invoke it. Hidden from the <code className={codeClass}>/</code> menu.</Td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="leading-7 text-white/65">
              Use <code className={codeClass}>disable-model-invocation: true</code> for workflows
              with side effects — deploy, commit, send messages. Use{" "}
              <code className={codeClass}>user-invocable: false</code> for background knowledge that
              is not meaningful as a direct command.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Execution Control</h3>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Field</Th>
                  <Th>Effect</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td><code className={codeClass}>context: fork</code></Td>
                  <Td>Run in an isolated subagent. The skill content becomes the subagent&apos;s prompt.</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>agent: Explore</code></Td>
                  <Td>Use the Explore agent for research tasks. Skips CLAUDE.md and git status to keep context small.</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>allowed-tools</code></Td>
                  <Td>Pre-approve tools without per-use permission prompts while the skill is active.</Td>
                </tr>
              </tbody>
            </TableWrap>

            <h3 className="mt-8 text-xl font-semibold text-white">Dynamic Content</h3>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Syntax</Th>
                  <Th>Purpose</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td><code className={codeClass}>!`command`</code></Td>
                  <Td>Run a shell command and inline its output. Executed before Claude sees the skill.</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>```!` block</code></Td>
                  <Td>Multi-line command output.</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>$ARGUMENTS</code></Td>
                  <Td>All arguments passed when invoking the skill.</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>$0</code>, <code className={codeClass}>$1</code></Td>
                  <Td>Specific argument by position (0-based).</Td>
                </tr>
                <tr>
                  <Td><code className={codeClass}>$name</code></Td>
                  <Td>Named argument from the <code className={codeClass}>arguments:</code> frontmatter list.</Td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="leading-7 text-white/65">
              <strong className="text-white">Important:</strong> Command output is inserted as plain
              text and is not re-scanned for further placeholders. A command cannot emit a placeholder
              for a later pass to expand.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">Bundled Skills</h2>
            <SourceNote>Official docs</SourceNote>
            <p className="mt-4 leading-7 text-white/65">
              These ship with Claude Code and are maintained by Anthropic. They are generally safer
              to rely on than random community lists.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Built-in Skills</h3>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Skill</Th>
                  <Th>Purpose</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["/code-review", "Review code changes"],
                  ["/debug", "Debug failures"],
                  ["/batch", "Run multiple prompts"],
                  ["/loop", "Iterative refinement"],
                  ["/claude-api", "Anthropic API operations"],
                ].map(([skill, purpose]) => (
                  <tr key={skill}>
                    <Td><code className={codeClass}>{skill}</code></Td>
                    <Td>{purpose}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <h3 className="mt-8 text-xl font-semibold text-white">Runtime Skills (Claude Code v2.1.145+)</h3>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Skill</Th>
                  <Th>Purpose</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["/run", "Launch and drive your app"],
                  ["/verify", "Build and run your app to confirm a change works"],
                  ["/run-skill-generator", "Record the build/launch recipe as a per-project skill"],
                ].map(([skill, purpose]) => (
                  <tr key={skill}>
                    <Td><code className={codeClass}>{skill}</code></Td>
                    <Td>{purpose}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="leading-7 text-white/65">
              <code className={codeClass}>/run</code> and <code className={codeClass}>/verify</code>{" "}
              infer launch commands from your project type, README,{" "}
              <code className={codeClass}>package.json</code>, or Makefile. For non-standard setups —
              databases, env files, multi-step builds — use{" "}
              <code className={codeClass}>/run-skill-generator</code> once to record the recipe.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">Troubleshooting</h2>
            <SourceNote>Official docs</SourceNote>
            <h3 className="mt-6 text-xl font-semibold text-white">Skill Not Triggering</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-white/65">
              <li>Check that <code className={codeClass}>description</code> includes keywords a user would naturally say</li>
              <li>Verify the skill appears when you ask &quot;What skills are available?&quot;</li>
              <li>Try rephrasing your request to match the description more closely</li>
              <li>Invoke it directly with <code className={codeClass}>/skill-name</code> to confirm it works</li>
            </ul>

            <h3 className="mt-8 text-xl font-semibold text-white">Skill Triggers Too Often</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-white/65">
              <li>Make <code className={codeClass}>description</code> more specific</li>
              <li>Add <code className={codeClass}>disable-model-invocation: true</code> if you only want manual invocation</li>
            </ul>

            <h3 className="mt-8 text-xl font-semibold text-white">Skill Description Cut Short</h3>
            <p className="mt-3 leading-7 text-white/65">
              Skill descriptions share a context budget that scales at 1% of the model&apos;s context
              window. When the budget overflows, descriptions for skills you invoke least are dropped
              first.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              To raise the budget, set <code className={codeClass}>skillListingBudgetFraction</code>{" "}
              in settings (e.g., <code className={codeClass}>0.02</code> for 2%). To free budget, set
              low-priority skills to <code className={codeClass}>&quot;name-only&quot;</code> in{" "}
              <code className={codeClass}>skillOverrides</code> so they list without a description.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">What to Do Next</h2>
            <p className="mt-4 leading-7 text-white/65">
              Start with one project-local skill. Keep it small. Test it in a throwaway repo before
              adding it to your main workflow.
            </p>
            <p className="mt-4 leading-7 text-white/65">Specifically:</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-white/65">
              <li><strong className="text-white">Create a project skill</strong> at <code className={codeClass}>.claude/skills/my-first-skill/SKILL.md</code></li>
              <li><strong className="text-white">Write a simple description</strong> — one sentence about what it does</li>
              <li><strong className="text-white">Add basic instructions</strong> — a checklist or procedure you repeat often</li>
              <li><strong className="text-white">Test it</strong> — open Claude Code in that project and type <code className={codeClass}>/my-first-skill</code></li>
              <li><strong className="text-white">Iterate</strong> — adjust the description until Claude triggers it when you want</li>
            </ol>
            <p className="mt-4 leading-7 text-white/65">
              Prefer stable patterns over community roundups. The patterns in this guide use core
              features that are unlikely to change. Community roundups can age quickly, so verify
              them before relying on them.
            </p>
            <p className="mt-4 leading-7 text-white/65">
              If you need a starting point, use the bundled skills. <code className={codeClass}>/debug</code>{" "}
              and <code className={codeClass}>/code-review</code> ship with Claude Code and are
              maintained by Anthropic. They are generally safer to rely on than random community
              lists.
            </p>
          </section>

          <hr className="my-8 border-white/10" />

          <section>
            <h2 className="text-2xl font-semibold text-white">Resources</h2>
            <h3 className="mt-6 text-xl font-semibold text-white">Official</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-white/65">
              <li>
                <a
                  href="https://code.claude.com/docs/en/skills"
                  className="text-neon underline underline-offset-4 hover:text-neon/80"
                >
                  Claude Code Skills Docs
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/skills"
                  className="text-neon underline underline-offset-4 hover:text-neon/80"
                >
                  Anthropic Skills GitHub
                </a>
              </li>
            </ul>
            <h3 className="mt-8 text-xl font-semibold text-white">Community</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-white/65">
              <li>
                <a
                  href="https://nicknisi.com/posts/claude-skills/"
                  className="text-neon underline underline-offset-4 hover:text-neon/80"
                >
                  Nick Nisi — Why Everyone Should Try Claude Skills
                </a>
              </li>
              <li>
                <a
                  href="https://simonwillison.net/2025/Oct/16/claude-skills/"
                  className="text-neon underline underline-offset-4 hover:text-neon/80"
                >
                  Simon Willison — Claude Skills
                </a>
              </li>
            </ul>
          </section>

          <footer className="mt-12 border-t border-white/10 pt-6 text-sm text-white/35">
            <p>Published 2026-05-22</p>
          </footer>
        </article>
      </main>
    </div>
  );
}
