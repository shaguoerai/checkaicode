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
      className="rounded-md border border-white/20 px-2 py-1 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
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

export default function ReviewPage() {
  const { t } = useI18n();
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
      } else {
        setError(data.error || "No result");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

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
      <main className="flex flex-1 flex-col px-6 py-8">
        <h1 className="text-2xl font-bold text-white">{t("reviewTitle")}</h1>
        <p className="mt-1 text-slate-400">{t("reviewSubtitle")}</p>

        <div className="mt-6 flex flex-1 flex-col gap-4 lg:flex-row">
          {/* Editor */}
          <div
            className="flex flex-1 flex-col rounded-xl border border-white/10 bg-white/5 p-4"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <UploadIcon />
                {t("uploadFile")}
              </button>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-9 rounded-lg border border-white/20 bg-white/5 px-3 text-sm text-white outline-none focus:ring-1 focus:ring-white/30"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
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
              className="min-h-[320px] flex-1 resize-none rounded-lg bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-200 outline-none ring-1 ring-white/10 focus:ring-white/30"
              spellCheck={false}
            />
            <button
              onClick={analyze}
              disabled={loading || !code.trim()}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:opacity-40"
            >
              {loading ? t("analyzing") : t("analyze")}
            </button>
          </div>

          {/* Result */}
          {issues !== null && (
            <div className="flex flex-1 flex-col rounded-xl border border-white/10 bg-white/5 p-4 lg:max-w-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {t("resultTitle")}
                </h2>
                {/* Score badge */}
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    score >= 80
                      ? "bg-green-500/20 text-green-400"
                      : score >= 50
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  Score: {score}/100
                </span>
              </div>

              {/* Summary */}
              {summary && (
                <p className="mb-3 text-sm text-slate-400">{summary}</p>
              )}

              {/* Issues list */}
              <div className="flex-1 overflow-auto space-y-2">
                {issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <CheckCircleIcon />
                    <p className="mt-2 text-sm">{t("resultNoIssues")}</p>
                  </div>
                ) : (
                  issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/5 bg-slate-900/50 p-3"
                    >
                      <div className="flex items-start gap-2">
                        {/* Severity badge */}
                        <span
                          className={`mt-0.5 inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            issue.severity === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : issue.severity === "warning"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {issue.severity === "critical" ? t("sevCritical") : issue.severity === "warning" ? t("sevWarning") : t("sevInfo")}
                        </span>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200">
                            {issue.message}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            L{issue.line}
                            {issue.endLine && issue.endLine !== issue.line
                              ? `-${issue.endLine}`
                              : ""}{" "}
                            · {issue.ruleId}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-1 flex-col rounded-xl border border-red-500/20 bg-red-500/5 p-4 lg:max-w-xl">
              <h2 className="text-lg font-semibold text-red-400">{t("lang") === "zh" ? "分析出错" : "Error"}</h2>
              <p className="mt-2 text-sm text-red-300">{error}</p>
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
