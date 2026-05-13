"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function RefundPage() {
  const { t } = useI18n();

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
          <Link
            href="/auth/signin"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#050505] transition hover:bg-white/90"
          >
            {t("signIn")}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Refund Policy
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Last updated: May 2026
          </p>

          <div className="mt-10 space-y-8 text-white/60">
            <section>
              <h2 className="text-xl font-semibold text-white">7-Day Satisfaction Guarantee</h2>
              <p className="mt-3 leading-relaxed">
                All new Pro subscriptions (monthly and annual) are eligible for a full refund within 7 days of the initial purchase.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">What You Get Back</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>You receive a full refund of the amount you actually paid.</li>
                <li>Monthly ($9) → refund $9. Annual ($79) → refund $79.</li>
                <li>Subscriptions are non-refundable after 7 days but can be canceled at any time to stop future charges / auto-renewal.</li>
                <li>The Launch Special pricing is forfeited upon cancellation. Re-subscribing later will be at the then-current price.</li>
                <li>Refunds are processed within 5–7 business days to the original payment method.</li>
                <li>Refunds do not apply to Team or Enterprise plans. Contact sales for custom terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">How to Request a Refund</h2>
              <p className="mt-3 leading-relaxed">
                Email{" "}
                <a href="mailto:shaguoer@gmail.com" className="text-neon underline underline-offset-4 hover:text-neon/80">
                  shaguoer@gmail.com
                </a>{" "}
                with your Gumroad order ID or license key. We will process your request within 2 business days.
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
            <Link href="/pricing" className="transition hover:text-white">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
