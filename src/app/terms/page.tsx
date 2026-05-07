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

export default function TermsPage() {
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
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {t("termsTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {t("termsLastUpdated")}
          </p>

          <div className="mt-10 space-y-10 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsAcceptance")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("termsAcceptanceDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsService")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("termsServiceDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsData")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("termsDataDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsProhibited")}
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>{t("termsProhibited1")}</li>
                <li>{t("termsProhibited2")}</li>
                <li>{t("termsProhibited3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsLiability")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("termsLiabilityDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsTermination")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("termsTerminationDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsChanges")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("termsChangesDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("termsContact")}
              </h2>
              <p className="mt-3 leading-relaxed">
                {t("termsContactDesc")}{" "}
                <a
                  href="mailto:shaguoer@gmail.com"
                  className="text-white underline underline-offset-4 hover:text-white/80"
                >
                  shaguoer@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Check AI Code
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Link href="/privacy" className="transition hover:text-white">
              {t("privacyLink")}
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              {t("termsLink")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
