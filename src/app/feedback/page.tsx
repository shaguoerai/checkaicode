"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { AuthStatus } from "@/components/auth-status";

const FEEDBACK_EMAIL = "support@checkaicode.com";

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

export default function FeedbackPage() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

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
          <LangToggle />
          <AuthStatus signInLabel={t("signIn")} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <h1 className="text-3xl font-bold text-white">{t("feedbackTitle")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {t("feedbackSubtitle")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            {t("feedbackBody")}
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="text-xs font-medium uppercase text-white/35">
              {t("feedbackEmailLabel")}
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-white">
              {FEEDBACK_EMAIL}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              {copied ? t("feedbackCopied") : t("feedbackCopy")}
            </button>
            <a
              href={`mailto:${FEEDBACK_EMAIL}?subject=Check%20AI%20Code%20Feedback`}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-neon text-sm font-semibold text-[#050505] transition hover:bg-neon-dim hover:shadow-[0_0_20px_rgba(126,231,135,0.25)]"
            >
              {t("feedbackOpenEmail")}
            </a>
          </div>

          <Link
            href="/review"
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-white/45 transition hover:bg-white/5 hover:text-white/70"
          >
            {t("feedbackBackToReview")}
          </Link>
        </section>
      </main>
    </div>
  );
}
