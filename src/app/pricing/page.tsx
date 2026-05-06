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

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Check AI Code
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link
            href="/auth/signin"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90"
          >
            {t("signIn")}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center px-6 py-16">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {t("pricingTitle")}
        </h1>
        <p className="mt-2 text-slate-400">{t("pricingSubtitle")}</p>

        <div className="mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-xl font-semibold text-white">
              {t("freePlan")}
            </h2>
            <p className="mt-2 text-3xl font-bold text-white">{t("freePrice")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("freeDesc")}</p>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>{t("freeReviews")}</p>
              <p>{t("freeBasic")}</p>
              <p>{t("freeCommunity")}</p>
            </div>
            <Link
              href="/review"
              className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              {t("getStarted")}
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-xl font-semibold text-white">
              {t("proPlan")}
            </h2>
            <p className="mt-2 text-3xl font-bold text-white">{t("proPrice")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("proDesc")}</p>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>{t("proUnlimited")}</p>
              <p>{t("proAdvanced")}</p>
              <p>{t("proPriority")}</p>
            </div>
            <button
              onClick={() => alert("Stripe checkout coming soon")}
              className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/30 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              {t("upgradeToPro")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
