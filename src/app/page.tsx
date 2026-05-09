"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import { AuthStatus } from "@/components/auth-status";

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

/* Canvas particle background — modal.com style */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    let animId = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(80, Math.floor(w * h / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(126, 231, 135, ${p.alpha})`;
        ctx.fill();
      }
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(126, 231, 135, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

/* Code demo card with syntax highlighting simulation */
function CodeDemoCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-[#0d1117] p-5 shadow-2xl">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-white/30 font-mono">example.py</span>
      </div>
      <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
        <code>
          <span className="text-[#ff7b72]">import</span>{" "}
          <span className="text-[#79c0ff]">requests</span>
          {"\n"}
          <span className="text-[#ff7b72]">def</span>{" "}
          <span className="text-[#d2a8ff]">fetch_data</span>
          <span className="text-white">(url):</span>
          {"\n"}
          <span className="text-white">    </span>
          <span className="text-[#ff7b72]">return</span>{" "}
          <span className="text-[#79c0ff]">requests</span>
          <span className="text-white">.get(url)</span>
          {"\n"}
          <span className="text-[#7ee787]"># AI hallucination detected:</span>
          {"\n"}
          <span className="text-[#7ee787]"># requests v3.0 has no .get()</span>
        </code>
      </pre>
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)"
        }}
      />
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] relative">
      <ParticleCanvas />
      <div className="relative z-10 bg-grid">
        {/* Nav */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-neon/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ee787" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">Check AI Code</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition">
              {t("viewPricing")}
            </Link>
            <LangToggle />
            <AuthStatus signInLabel={t("signIn")} />
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-col">
          <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/5 px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
              </span>
              <span className="text-xs font-medium text-neon">{t("heroBadge")}</span>
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t("heroTitle")}
              <span className="block mt-2 bg-gradient-to-r from-neon via-[#a7f3d0] to-neon bg-clip-text text-transparent animate-gradient">
                {t("heroTitleHighlight")}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/50 leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/review"
                className="group inline-flex h-12 items-center justify-center rounded-full bg-neon px-8 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim hover:shadow-[0_0_30px_rgba(126,231,135,0.3)]"
              >
                {t("startFreeReview")}
                <svg className="ml-2 h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-8 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                {t("viewPricing")}
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                <span>Coming soon</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Coming soon</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                <span>Coming soon</span>
              </div>
            </div>

            {/* Code demo card */}
            <div className="mt-16 w-full max-w-2xl animate-float">
              <CodeDemoCard />
            </div>
          </section>

          {/* Features — alternating layout */}
          <section className="px-6 py-24 border-t border-white/5">
            <div className="mx-auto max-w-5xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("featuresTitle")}</h2>
                <p className="mt-3 text-white/40">{t("featuresSubtitle")}</p>
              </div>

              {/* Feature 1 — left text, right visual */}
              <div className="grid gap-12 items-center lg:grid-cols-2 mb-20">
                <div className="order-2 lg:order-1">
                  <div className="glass-card rounded-xl p-6">
                    <div className="font-mono text-xs text-white/30 mb-3">$ checkaicode scan</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-red-400 font-mono">CRITICAL</span>
                        <span className="text-white/60">Fake API endpoint detected</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-yellow-400 font-mono">WARNING</span>
                        <span className="text-white/60">Deprecated import</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-blue-400 font-mono">INFO</span>
                        <span className="text-white/60">Missing type annotation</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neon/10 mb-4">
                    <SparklesIcon className="text-neon" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{t("featHallucination")}</h3>
                  <p className="mt-3 text-white/50 leading-relaxed">{t("featHallucinationDesc")}</p>
                </div>
              </div>

              {/* Feature 2 — right text, left visual */}
              <div className="grid gap-12 items-center lg:grid-cols-2 mb-20">
                <div className="order-1">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neon/10 mb-4">
                    <VersionIcon className="text-neon" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{t("featVersion")}</h3>
                  <p className="mt-3 text-white/50 leading-relaxed">{t("featVersionDesc")}</p>
                </div>
                <div className="order-2">
                  <div className="glass-card rounded-xl p-6 font-mono text-sm">
                    <div className="text-white/30 mb-2">package.json</div>
                    <div className="text-white/80">
                      <span className="text-[#7ee787]">"react"</span>: <span className="text-[#79c0ff]">"^18.2.0"</span>
                    </div>
                    <div className="text-white/40 line-through mt-1">
                      <span className="text-[#ff7b72]">"react"</span>: <span className="text-[#ff7b72]">"19.0.0-beta"</span>
                    </div>
                    <div className="mt-3 text-xs text-neon border-l-2 border-neon/30 pl-3">
                      Breaking change: useId() signature changed in v19
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 — left text, right visual */}
              <div className="grid gap-12 items-center lg:grid-cols-2">
                <div className="order-2 lg:order-1">
                  <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldIcon className="text-neon" />
                      <span className="text-sm font-medium text-white">Security Scan Complete</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-neon to-[#4ade80]" />
                      </div>
                      <div className="flex justify-between text-xs text-white/40">
                        <span>Security Score</span>
                        <span className="text-neon font-semibold">92/100</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neon/10 mb-4">
                    <ShieldIcon className="text-neon" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{t("featSecurity")}</h3>
                  <p className="mt-3 text-white/50 leading-relaxed">{t("featSecurityDesc")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-6 py-20 border-t border-white/5">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("ctaTitle")}</h2>
              <p className="mt-4 text-white/40">{t("ctaSubtitle")}</p>
              <Link
                href="/review"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-neon px-8 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim hover:shadow-[0_0_30px_rgba(126,231,135,0.3)]"
              >
                {t("startFreeReview")}
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="px-6 py-8 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
              <span>Check AI Code</span>
              <div className="flex gap-6">
                <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
                <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
    </svg>
  );
}

function VersionIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20M2 12h20M17 7l-5-5-5 5M17 17l-5 5-5-5"/>
    </svg>
  );
}

function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
