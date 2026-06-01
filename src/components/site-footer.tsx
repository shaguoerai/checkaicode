import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/30 sm:flex-row">
        <Link href="/" className="transition hover:text-white/60">
          Check AI Code
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Legal and support links">
          <Link href="/why" className="transition hover:text-white/60">
            Why
          </Link>
          <Link href="/guide" className="transition hover:text-white/60">
            Guide
          </Link>
          <Link href="/privacy" className="transition hover:text-white/60">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-white/60">
            Terms
          </Link>
          <Link href="/refund" className="transition hover:text-white/60">
            Refund Policy
          </Link>
          <Link href="/feedback" className="transition hover:text-white/60">
            Feedback
          </Link>
        </nav>
      </div>
    </footer>
  );
}
