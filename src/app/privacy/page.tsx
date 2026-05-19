"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "zh" : "en")}
      className="rounded-md border border-white/20 px-2 py-1 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
      aria-label="Toggle language"
    >
      {t("langToggle")}
    </button>
  );
}

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      {/* Nav */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-6 w-6 rounded bg-neon/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ee787" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <Link href="/" className="text-lg font-semibold text-white tracking-tight">
            Check AI Code
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/review" className="text-sm text-white/60 hover:text-white transition">
            {t("reviewTitle")}
          </Link>
          <LangToggle />
          <Link
            href="/auth/signin"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#050505] transition hover:bg-white/90"
          >
            {t("signIn")}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-8 lg:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Last updated: May 2026
          </p>

          <div className="mt-8 space-y-8 text-white/60">
            <section>
              <h2 className="text-xl font-semibold text-white">What we collect</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-white">Email / OAuth identity</strong> — only what's needed to sign you in (Google or GitHub profile info).</li>
                <li><strong className="text-white">Code you paste</strong> — transmitted to our scanner for analysis. Not used for model training.</li>
                <li><strong className="text-white">Payment info</strong> — handled entirely by Stripe. We never see your card number.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Data retention</h2>
              <p className="mt-3 leading-relaxed">
                Code submitted for review is automatically deleted within 24 hours. We do not store it long-term, do not use it to train AI models, and do not share it with third parties except our scanning infrastructure (Modal) which also discards data after processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Your rights</h2>
              <p className="mt-3 leading-relaxed">
                You can request a full export or deletion of your account and associated data at any time. Just email us — we handle it manually within 7 days.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Access your personal data</li>
                <li>Delete your account and all data</li>
                <li>Export your review history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Cookies</h2>
              <p className="mt-3 leading-relaxed">
                We use essential cookies for authentication (NextAuth session) only. No tracking or analytics cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Contact</h2>
              <p className="mt-3 leading-relaxed">
                Questions? Email{" "}
                <a href="mailto:shaguoer@gmail.com" className="text-neon underline underline-offset-4 hover:text-neon/80">
                  shaguoer@gmail.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} Check AI Code
          </p>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
