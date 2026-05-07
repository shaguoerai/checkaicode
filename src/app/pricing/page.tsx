"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

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
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: t("freePlan"),
      price: t("freePrice"),
      desc: t("freeDesc"),
      features: [
        { text: t("freeReviews"), included: true },
        { text: t("freeBasic"), included: true },
        { text: t("freeCommunity"), included: true },
        { text: t("featHallucination"), included: false },
        { text: t("featSecurity"), included: false },
        { text: t("proPriority"), included: false },
      ],
      cta: t("getStarted"),
      ctaHref: "/review",
      highlighted: false,
    },
    {
      name: t("proPlan"),
      price: isYearly ? t("proPriceYearly") : t("proPrice"),
      desc: t("proDesc"),
      features: [
        { text: t("proUnlimited"), included: true },
        { text: t("proAdvanced"), included: true },
        { text: t("proPriority"), included: true },
        { text: "Multi-file scan", included: true },
        { text: "Fix suggestions", included: true },
        { text: "API access", included: true },
      ],
      cta: t("upgradeToPro"),
      ctaHref: "#",
      highlighted: true,
      billingToggle: true,
    },
    {
      name: t("teamPlan") || "Team",
      price: t("teamPrice") || "$29 / month",
      desc: t("teamDesc") || "For organizations with custom needs.",
      features: [
        { text: t("proUnlimited"), included: true },
        { text: "SSO / SAML", included: true },
        { text: "Audit logs", included: true },
        { text: "Custom rules", included: true },
        { text: "Dedicated support", included: true },
        { text: "SLA guarantee", included: true },
      ],
      cta: t("contactSales") || "Contact Sales",
      ctaHref: "#",
      highlighted: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-neon/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ee787" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <Link href="/" className="text-lg font-semibold text-white tracking-tight">
            Check AI Code
          </Link>
        </div>
        <div className="flex items-center gap-3">
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
      <main className="flex flex-1 flex-col items-center px-6 py-16">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/5 px-3 py-1 mb-4">
            <span className="text-xs font-medium text-neon">Simple pricing</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {t("pricingTitle")}
        </h1>
        <p className="mt-2 text-white/40">{t("pricingSubtitle")}</p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-2 py-1.5">
          <button
            onClick={() => setIsYearly(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${!isYearly ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${isYearly ? "bg-neon/20 text-neon" : "text-white/40 hover:text-white/60"}`}
          >
            Yearly
            <span className="ml-1.5 rounded bg-neon/10 px-1.5 py-0.5 text-[10px] text-neon">Save 27%</span>
          </button>
        </div>

        <div className="mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? "border-2 border-neon/30 bg-gradient-to-b from-neon/5 to-transparent"
                  : "border border-white/8 bg-white/[0.02]"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-neon px-3 py-1 text-xs font-semibold text-[#050505]">
                    Most Popular
                  </span>
                </div>
              )}

              <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold text-white">{plan.price}</p>
              <p className="mt-1 text-sm text-white/40">{plan.desc}</p>

              <div className="mt-6 flex-1">
                {plan.features.map((f, i) => (
                  <FeatureRow key={i} included={f.included} text={f.text} />
                ))}
              </div>

              {plan.ctaHref === "#" ? (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/stripe/checkout");
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else if (data.error === "Unauthorized") {
                        window.location.href = "/auth/signin";
                      } else {
                        alert("Checkout unavailable. Please try again later.");
                      }
                    } catch {
                      alert("Checkout unavailable. Please try again later.");
                    }
                  }}
                  className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${
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
                  className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${
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

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/20">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs">Code never stored</span>
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
