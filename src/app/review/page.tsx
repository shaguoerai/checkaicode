"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { Issue } from "@/lib/analyzer";

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

const ALLOWED_EXTS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".rs", ".java",
  ".c", ".cpp", ".h", ".cs", ".rb", ".php", ".swift", ".kt",
  ".scala", ".r", ".m", ".mm", ".sql", ".sh", ".bash", ".zsh",
  ".ps1", ".lua", ".pl", ".pm", ".t", ".dart", ".elm", ".fs",
  ".fsx", ".hs", ".lhs", ".erl", ".ex", ".exs", ".clj", ".cljs",
  ".coffee", ".litcoffee", ".md", ".json", ".yaml", ".yml", ".xml",
  ".html", ".css", ".scss", ".sass", ".less", ".vue", ".svelte",
];

const EXT_TO_LANG: Record<string, string> = {
  ".js": "javascript", ".jsx": "javascript",
  ".ts": "typescript", ".tsx": "typescript",
  ".py": "python", ".go": "go", ".rs": "rust",
  ".java": "java", ".c": "c", ".cpp": "cpp",
  ".h": "c", ".cs": "csharp", ".rb": "ruby",
  ".php": "php", ".swift": "swift", ".kt": "kotlin",
  ".scala": "scala", ".r": "r", ".m": "objective-c",
  ".mm": "objective-c", ".sql": "sql", ".sh": "shell",
  ".bash": "shell", ".zsh": "shell", ".ps1": "powershell",
  ".lua": "lua", ".pl": "perl", ".pm": "perl",
  ".t": "perl", ".dart": "dart", ".elm": "elm",
  ".fs": "fsharp", ".fsx": "fsharp", ".hs": "haskell",
  ".lhs": "haskell", ".erl": "erlang", ".ex": "elixir",
  ".exs": "elixir", ".clj": "clojure", ".cljs": "clojure",
  ".coffee": "coffeescript", ".litcoffee": "coffeescript",
  ".md": "markdown", ".json": "json", ".yaml": "yaml",
  ".yml": "yaml", ".xml": "xml", ".html": "html",
  ".css": "css", ".scss": "scss", ".sass": "sass",
  ".less": "less", ".vue": "vue", ".svelte": "svelte",
};

const LANG_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "shell", label: "Shell" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
];

function detectLang(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return EXT_TO_LANG[ext] || "auto";
}

/* Severity config with colors */
const SEVERITY_CONFIG = {
  critical: {
    labelColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    barColor: "bg-red-500",
    badgeBg: "bg-red-500/15",
  },
  warning: {
    labelColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    barColor: "bg-amber-500",
    badgeBg: "bg-amber-500/15",
  },
  info: {
    labelColor: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    barColor: "bg-sky-500",
    badgeBg: "bg-sky-500/15",
  },
};

/* Score ring component */
function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#7ee787" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
        <circle
          cx="42" cy="42" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        <circle
          cx="42" cy="42" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-white/30">/100</span>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { lang, t } = useI18n();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [summary, setSummary] = useState("");
  const [score, setScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        alert(`Unsupported file type: ${ext}`);
        return;
      }
      const detected = detectLang(file.name);
      if (detected !== "auto") setLanguage(detected);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") setCode(text);
      };
      reader.readAsText(file);
    },
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const analyze = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setIssues(null);
    setSummary("");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.issues) {
        setIssues(data.issues);
        setSummary(data.summary || "");
        setScore(data.score ?? 100);
      } else if (data.error && data.lines) {
        setError(
          lang === "zh"
            ? `文件共 ${data.lines} 行，免费版仅支持 ${data.maxLines} 行以内的文件。去掉 ${data.overBy} 行即可免费体验。`
            : data.error
        );
      } else {
        setError(data.error || "No result");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = issues?.filter((i) => i.severity === "critical").length ?? 0;
  const warningCount = issues?.filter((i) => i.severity === "warning").length ?? 0;
  const infoCount = issues?.filter((i) => i.severity === "info").length ?? 0;

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
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition">
            {t("viewPricing")}
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
      <main className="flex flex-1 flex-col px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t("reviewTitle")}</h1>
          <p className="mt-1 text-white/40">{t("reviewSubtitle")}</p>
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          {/* Editor */}
          <div
            className="flex flex-1 flex-col rounded-xl border border-white/8 bg-white/[0.02] p-4"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition hover:border-neon/30 hover:bg-white/8"
              >
                <UploadIcon />
                {t("uploadFile")}
              </button>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-neon/30"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0a0a0a] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileSelect}
                accept={ALLOWED_EXTS.join(",")}
              />
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("codePlaceholder")}
              className="min-h-[320px] flex-1 resize-none rounded-lg bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-slate-300 outline-none ring-1 ring-white/8 focus:ring-neon/30"
              spellCheck={false}
            />
            <button
              onClick={analyze}
              disabled={loading || !code.trim()}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-neon px-6 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim hover:shadow-[0_0_20px_rgba(126,231,135,0.25)] disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  {t("analyzing")}
                </span>
              ) : (
                t("analyze")
              )}
            </button>
          </div>

          {/* Result */}
          {issues !== null && (
            <div className="flex flex-1 flex-col rounded-xl border border-white/8 bg-white/[0.02] p-4 lg:max-w-xl">
              {/* Stats header */}
              <div className="mb-4 flex items-center gap-4">
                <ScoreRing score={score} />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">
                    {t("resultTitle")}
                  </h2>
                  {summary && (
                    <p className="mt-0.5 text-xs text-white/40">{summary}</p>
                  )}
                </div>
              </div>

              {/* Severity counts */}
              {issues.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-2 text-center">
                    <div className="text-lg font-bold text-red-400">{criticalCount}</div>
                    <div className="text-[10px] text-red-400/60 uppercase">{t("sevCritical")}</div>
                  </div>
                  <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-2 text-center">
                    <div className="text-lg font-bold text-amber-400">{warningCount}</div>
                    <div className="text-[10px] text-amber-400/60 uppercase">{t("sevWarning")}</div>
                  </div>
                  <div className="rounded-lg border border-sky-500/15 bg-sky-500/5 p-2 text-center">
                    <div className="text-lg font-bold text-sky-400">{infoCount}</div>
                    <div className="text-[10px] text-sky-400/60 uppercase">{t("sevInfo")}</div>
                  </div>
                </div>
              )}

              {/* Issues list */}
              <div className="flex-1 overflow-auto space-y-2 max-h-[480px]">
                {issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <CheckCircleIcon />
                    <p className="mt-3 text-sm">{t("resultNoIssues")}</p>
                  </div>
                ) : (
                  issues.map((issue, idx) => {
                    const cfg = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.info;
                    return (
                      <div
                        key={idx}
                        className={`relative rounded-lg border ${cfg.borderColor} ${cfg.bgColor} p-3 overflow-hidden`}
                      >
                        {/* Left color bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.barColor}`} />
                        <div className="pl-3">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${cfg.labelColor} ${cfg.badgeBg}`}
                            >
                              {issue.severity === "critical" ? t("sevCritical") : issue.severity === "warning" ? t("sevWarning") : t("sevInfo")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white/80 leading-relaxed">
                                {issue.message}
                              </p>
                              <p className="mt-1 text-[11px] text-white/30 font-mono">
                                L{issue.line}
                                {issue.endLine && issue.endLine !== issue.line
                                  ? `-${issue.endLine}`
                                  : ""}{" "}
                                · {issue.ruleId}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-1 flex-col rounded-xl border border-red-500/20 bg-red-500/5 p-4 lg:max-w-xl">
              <h2 className="text-lg font-semibold text-red-400">{lang === "zh" ? "分析出错" : "Error"}</h2>
              <p className="mt-2 text-sm text-red-300/80">{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
