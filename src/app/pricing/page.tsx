"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { AuthStatus } from "@/components/auth-status";

function CreemRedirectModal({
  open,
  onClose,
  onContinue,
  isLoading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  isLoading: boolean;
  error: string;
}) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white">
          {t("creemModalTitle")}
        </h2>

        <p className="mt-4 text-sm text-white/60 leading-relaxed">
          {t("creemModalBody")}
        </p>

        <ol className="mt-3 ml-4 list-decimal text-sm text-white/60 space-y-1">
          <li>{t("creemStep1")}</li>
          <li>{t("creemStep2")}</li>
          <li>{t("creemStep3")}</li>
        </ol>

        <p className="mt-4 text-sm text-white/40 italic">
          {t("creemNoAccount")}
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-neon text-sm font-semibold text-[#050505] transition hover:bg-neon-dim hover:shadow-[0_0_20px_rgba(126,231,135,0.25)]"
          >
            {isLoading ? t("creatingCheckout") : t("creemContinue")}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-white/15 text-sm font-medium text-white/70 transition hover:border-white/30 hover:bg-white/5"
          >
            {t("creemCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

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

/* Feature row with check/x mark */
function FeatureRow({ included, text }: { included: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${included ? "bg-neon/15" : "bg-white/5"}`}>
        {included ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7ee787" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${included ? "text-white/70" : "text-white/25"}`}>{text}</span>
    </div>
  );
}

export default function PricingPage() {
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch("/api/user", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => setIsPro(data?.usage?.isPro === true))
      .catch(() => setIsPro(false));
  }, []);

  async function startCheckout() {
    setIsCreatingCheckout(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/creem/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/auth/signin";
        return;
      }

      if (typeof data.checkoutUrl === "string") {
        window.location.href = data.checkoutUrl;
        return;
      }

      setCheckoutError(data.error || t("checkoutFailed"));
    } catch {
      setCheckoutError(t("checkoutFailed"));
    } finally {
      setIsCreatingCheckout(false);
    }
  }

  const plans = [
    {
      name: t("freePlan"),
      price: t("freePrice"),
      desc: t("freeDesc"),
      features: [
        { text: t("freeReviews"), included: true },
        { text: t("freeProDay"), included: true },
        { text: t("freeBasic"), included: true },
        { text: t("freeCommunity"), included: true },
        { text: t("freeSupport"), included: true },
        { text: t("freeHallucination"), included: true },
        { text: t("freeSecurity"), included: true },
      ],
      cta: t("getStarted"),
      ctaHref: "/review",
      highlighted: false,
    },
    {
      name: t("proPlan"),
      price: t("proPrice"),
      desc: t("proDesc"),
      futurePrice: t("futurePrice"),
      badge: t("launchSpecialBadge"),
      features: [
        { text: t("proUnlimited"), included: true },
        { text: t("proAdvanced"), included: true },
        { text: t("proCustomRules"), included: true },
        { text: t("proPriority"), included: true },
        { text: t("proTeamDash"), included: true },
        { text: t("proApi"), included: true },
      ],
      cta: t("upgradeToPro"),
      ctaHref: "creem",
      highlighted: true,
    },
    {
      name: t("teamPlan"),
      price: t("teamPrice"),
      desc: t("teamDesc"),
      features: [
        { text: t("teamEverythingPro"), included: true },
        { text: t("teamUnlimitedMembers"), included: true },
        { text: t("teamSso"), included: true },
        { text: t("teamAnalytics"), included: true },
        { text: t("teamManager"), included: true },
        { text: t("teamSla"), included: true },
      ],
      cta: t("contactSales"),
      ctaHref: "mailto:support@checkaicode.com?subject=Check%20AI%20Code%20Team%20Plan",
      highlighted: false,
    },
  ];

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
          <AuthStatus signInLabel={t("signIn")} />
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center px-6 py-10 lg:py-12">
        <div className="mb-3 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/5 px-3 py-1">
            <span className="text-xs font-medium text-neon">Simple pricing</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {t("pricingTitle")}
        </h1>
        <p className="mt-2 text-white/40">{t("pricingSubtitle")}</p>

        <div className="mt-8 grid w-full max-w-5xl gap-5 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-6 ${
                plan.highlighted
                  ? "border-2 border-neon/30 bg-gradient-to-b from-neon/5 to-transparent"
                  : "border border-white/8 bg-white/[0.02]"
              }`}
            >
              {plan.highlighted && plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-neon px-3 py-1 text-xs font-semibold text-[#050505]">
                    {plan.badge}
                  </span>
                </div>
              )}

              <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold text-white">
                {plan.price.includes(' / ') ? (
                  <>
                    {plan.price.split(' / ')[0]}
                    <span className="text-lg font-normal text-white/40">{' / ' + plan.price.split(' / ')[1]}</span>
                  </>
                ) : (
                  plan.price
                )}
              </p>
              {'futurePrice' in plan && plan.futurePrice && (
                <p className="mt-1 text-xs text-white/30">{plan.futurePrice}</p>
              )}
              <p className="mt-1 text-sm text-white/40">{plan.desc}</p>

              <div className="mt-5 flex-1">
                {plan.features.map((f, i) => (
                  <FeatureRow key={i} included={f.included} text={f.text} />
                ))}
              </div>

              {plan.highlighted && isPro ? (
                <div className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg border border-neon/25 bg-neon/10 text-sm font-semibold text-neon">
                  {t("currentPlan")}
                </div>
              ) : plan.ctaHref === "creem" ? (
                <button
                  onClick={() => {
                    setCheckoutError("");
                    setShowModal(true);
                  }}
                  className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-neon text-[#050505] hover:bg-neon-dim hover:shadow-[0_0_20px_rgba(126,231,135,0.25)]"
                      : "border border-white/15 text-white hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href={plan.ctaHref}
                  className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-neon text-[#050505] hover:bg-neon-dim hover:shadow-[0_0_20px_rgba(126,231,135,0.25)]"
                      : "border border-white/15 text-white hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}

            </div>
          ))}
        </div>

        {/* Pro Experience Day note */}
        <div className="mt-8 max-w-2xl rounded-xl border border-white/8 bg-white/[0.02] px-6 py-4">
          <p className="text-sm text-white/50">
            <span className="text-neon">💡</span>{" "}
            <strong className="text-white/70">{t("proExperienceDayTitle")}</strong>{" "}
            {t("proExperienceDay")}
          </p>
        </div>

        {/* Refund guarantee */}
        <div className="mt-6 max-w-2xl text-center">
          <p className="text-sm font-medium text-white/60">{t("refundGuarantee")}</p>
          <p className="mt-1 text-xs text-white/30">{t("refundDesc")}</p>
        </div>

        <CreemRedirectModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onContinue={startCheckout}
          isLoading={isCreatingCheckout}
          error={checkoutError}
        />

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-white/20">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs">Secure checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs">Privacy-conscious review</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-xs">Cancel anytime</span>
          </div>
        </div>
      </main>
    </div>
  );
}
