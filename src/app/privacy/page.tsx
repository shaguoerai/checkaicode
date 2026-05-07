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
            {t("privacyTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {t("privacyLastUpdated")}
          </p>

          <div className="mt-10 space-y-10 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacyDataWeCollect")}
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-white">{t("privacyEmail")}</strong> —{" "}
                  {t("privacyEmailDesc")}
                </li>
                <li>
                  <strong className="text-white">{t("privacyCode")}</strong> —{" "}
                  {t("privacyCodeDesc")}
                </li>
                <li>
                  <strong className="text-white">{t("privacyPayment")}</strong> —{" "}
                  {t("privacyPaymentDesc")}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacyRetention")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("privacyRetentionDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacyAccess")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("privacyAccessDesc")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacyRights")}
              </h2>
              <p className="mt-3 leading-relaxed">{t("privacyRightsDesc")}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>{t("privacyRightAccess")}</li>
                <li>{t("privacyRightDelete")}</li>
                <li>{t("privacyRightPortability")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacyContact")}
              </h2>
              <p className="mt-3 leading-relaxed">
                {t("privacyContactDesc")}{" "}
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
