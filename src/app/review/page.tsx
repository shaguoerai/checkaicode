"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { Issue } from "@/lib/analyzer";
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

/* Filter chips */
function FilterChip({ active, label, onClick, colorClass }: { active: boolean; label: string; onClick: () => void; colorClass?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
        active
          ? colorClass || "border-neon/40 bg-neon/10 text-neon"
          : "border-white/10 bg-white/[0.02] text-white/40 hover:text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

/* Type config for filter colors */
const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  security: { label: "Security", color: "border-red-500/30 bg-red-500/10 text-red-400" },
  hallucinated_api: { label: "Hallucination", color: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  api_version_mismatch: { label: "Version", color: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  semantic_error: { label: "Quality", color: "border-sky-500/30 bg-sky-500/10 text-sky-400" },
  quality: { label: "Quality", color: "border-sky-500/30 bg-sky-500/10 text-sky-400" },
  dependency: { label: "Dependency", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
};

function mapIssueType(type: string): string {
  return TYPE_CONFIG[type]?.label || type;
}

function getTypeColor(type: string): string {
  return TYPE_CONFIG[type]?.color || "border-white/10 bg-white/[0.02] text-white/40";
}

/* Code snippet with line numbers */
function CodeSnippet({ code, line, endLine, highlightLine }: { code?: string; line?: number; endLine?: number; highlightLine?: number }) {
  if (!code) return null;
  const lines = code.split("\n");
  const start = Math.max(0, (highlightLine || line || 1) - 3);
  const end = Math.min(lines.length, start + 7);
  const display = lines.slice(start, end);

  return (
    <div className="mt-3 rounded-lg bg-[#0a0a0a] border border-white/5 overflow-hidden">
      <pre className="font-mono text-xs leading-relaxed p-3 overflow-x-auto">
        <code>
          {display.map((l, i) => {
            const ln = start + i + 1;
            const isHighlight = ln === (highlightLine || line);
            return (
              <div key={i} className={`flex ${isHighlight ? "bg-white/5" : ""}`}>
                <span className="w-8 shrink-0 text-right pr-2 text-white/20 select-none">{ln}</span>
                <span className={`${isHighlight ? "text-white/90" : "text-white/50"}`}>{l || " "}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

/* Expandable fix section */
function FixSection({ suggestion, fixCode, referenceUrl }: { suggestion?: string; fixCode?: string; referenceUrl?: string }) {
  const [open, setOpen] = useState(false);
  if (!suggestion && !fixCode) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-neon/70 hover:text-neon transition"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? "rotate-90" : ""}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Fix suggestion
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-neon/10 bg-neon/[0.03] p-3">
          {suggestion && <p className="text-xs text-white/60 mb-2">{suggestion}</p>}
          {fixCode && (
            <pre className="font-mono text-xs text-white/70 bg-[#0a0a0a] rounded p-2 overflow-x-auto">
              <code>{fixCode}</code>
            </pre>
          )}
          {referenceUrl && (
            <a href={referenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-neon/60 hover:text-neon underline">
              Reference
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* File tab bar */
interface FileTab {
  id: string;
  filename: string;
  code: string;
  language: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function ReviewPage() {
  const { lang, t } = useI18n();
  const [tabs, setTabs] = useState<FileTab[]>([{ id: generateId(), filename: "input", code: "", language: "auto" }]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [fileResults, setFileResults] = useState<any[] | null>(null);
  const [summary, setSummary] = useState("");
  const [score, setScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Filters */
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [scanMode, setScanMode] = useState<"standard" | "deep">("standard");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const setActiveCode = (code: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, code } : t));
  };

  const setActiveLanguage = (language: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, language } : t));
  };

  const setActiveFilename = (filename: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, filename } : t));
  };

  const addTab = () => {
    const newTab: FileTab = { id: generateId(), filename: `file${tabs.length + 1}`, code: "", language: "auto" };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const removeTab = (id: string) => {
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[Math.min(idx, newTabs.length - 1)].id);
    }
  };

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        alert(`Unsupported file type: ${ext}`);
        return;
      }
      const detected = detectLang(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          // Check if a tab with this filename already exists
          const existing = tabs.find(t => t.filename === file.name);
          if (existing) {
            setTabs(prev => prev.map(t => t.id === existing.id ? { ...t, code: text, language: detected !== "auto" ? detected : t.language } : t));
            setActiveTabId(existing.id);
          } else {
            const newTab: FileTab = { id: generateId(), filename: file.name, code: text, language: detected !== "auto" ? detected : "auto" };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
          }
        }
      };
      reader.readAsText(file);
    },
    [tabs]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file, i) => {
        setTimeout(() => handleFile(file), i * 50);
      });
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file, i) => {
        setTimeout(() => handleFile(file), i * 50);
      });
      e.target.value = "";
    },
    [handleFile]
  );

  const analyze = async () => {
    const filesToSend = tabs.filter(t => t.code.trim()).map(t => ({ filename: t.filename, code: t.code, language: t.language }));
    if (!filesToSend.length) return;
    setLoading(true);
    setIssues(null);
    setFileResults(null);
    setSummary("");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesToSend,
          scanMode,
          privacyMode,
        }),
      });
      const data = await res.json();
      if (data.issues) {
        setIssues(data.issues);
        setFileResults(data.fileResults || null);
        setSummary(data.summary || "");
        setScore(data.score ?? 100);
        setIsPro(data.isPro ?? false);
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

  /* Export functions */
  const copyJSON = () => {
    if (!issues) return;
    navigator.clipboard.writeText(JSON.stringify({ summary, score, issues, fileResults }, null, 2));
  };

  const copyMarkdown = () => {
    if (!issues) return;
    let md = `# Code Review Result\n\n**Score:** ${score}/100\n\n**Summary:** ${summary}\n\n`;
    if (fileResults && fileResults.length > 0) {
      md += `## By File\n\n`;
      for (const fr of fileResults) {
        md += `### ${fr.filename} — ${fr.score}/100\n\n${fr.summary}\n\n`;
      }
    }
    md += `## Issues (${issues.length})\n\n`;
    for (const issue of issues) {
      md += `### ${issue.ruleId} (${issue.severity})\n- **File:** ${issue.file}\n- **Line:** ${issue.line}${issue.endLine && issue.endLine !== issue.line ? `-${issue.endLine}` : ""}\n- **Type:** ${mapIssueType(issue.type)}\n- **Message:** ${issue.message}\n\n`;
      if ((issue as any).fixSuggestion) {
        md += `**Fix:** ${(issue as any).fixSuggestion}\n\n`;
      }
    }
    navigator.clipboard.writeText(md);
  };

  /* Filtered issues */
  const filteredIssues = issues?.filter((issue) => {
    const sevMatch = severityFilter === "all" || issue.severity === severityFilter;
    const typeMatch = typeFilter === "all" || issue.type === typeFilter;
    return sevMatch && typeMatch;
  }) || [];

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
          <AuthStatus signInLabel={t("signIn")} />
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
            {/* Tab bar */}
            <div className="mb-3 flex items-center gap-1 overflow-x-auto">
              <ul className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTabId(tab.id)}
                      className={`flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition border-b-2 ${
                        tab.id === activeTabId
                          ? "border-neon bg-white/[0.03] text-white"
                          : "border-transparent text-white/40 hover:text-white/60"
                      }`}
                    >
                      <span className="truncate max-w-[120px]">{tab.filename}</span>
                      {tabs.length > 1 && (
                        <span
                          onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                          className="ml-1 rounded-full p-0.5 hover:bg-white/10 text-white/30 hover:text-white/60"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={addTab}
                className="rounded-full p-1 text-white/30 hover:text-white/60 hover:bg-white/5 transition"
                title="Add file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition hover:border-neon/30 hover:bg-white/8"
              >
                <UploadIcon />
                {t("uploadFile")}
              </button>
              <select
                value={activeTab.language}
                onChange={(e) => setActiveLanguage(e.target.value)}
                className="h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-neon/30"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0a0a0a] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={activeTab.filename}
                onChange={(e) => setActiveFilename(e.target.value)}
                placeholder="filename"
                className="h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-neon/30 w-32"
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileSelect}
                accept={ALLOWED_EXTS.join(",")}
                multiple
              />
            </div>
            <textarea
              value={activeTab.code}
              onChange={(e) => setActiveCode(e.target.value)}
              placeholder={t("codePlaceholder")}
              className="min-h-[320px] flex-1 resize-none rounded-lg bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-slate-300 outline-none ring-1 ring-white/8 focus:ring-neon/30"
              spellCheck={false}
            />
            {/* Pro controls: scan mode + privacy toggle */}
            {isPro && (
              <div className="mt-3 flex items-center gap-4">
                {/* Scan mode segmented control */}
                <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                  <button
                    onClick={() => setScanMode("standard")}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      scanMode === "standard"
                        ? "bg-neon/15 text-neon"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    Standard Fast Scan
                  </button>
                  <button
                    onClick={() => setScanMode("deep")}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      scanMode === "deep"
                        ? "bg-neon/15 text-neon"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    Deep Thorough Scan
                  </button>
                </div>
                {scanMode === "deep" && (
                  <span className="text-[10px] text-amber-400/70">
                    Uses 5× quota
                  </span>
                )}
                {/* Privacy mode toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyMode}
                    onChange={(e) => setPrivacyMode(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-neon focus:ring-neon/30"
                  />
                  <span className="text-xs text-white/50">
                    Privacy Mode: Code stays local
                  </span>
                </label>
              </div>
            )}
            <button
              onClick={analyze}
              disabled={loading || !tabs.some(t => t.code.trim())}
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
                    {issues.length === 0 ? t("resultNoIssues") : t("resultTitle")}
                  </h2>
                  {summary && (
                    <p className="mt-0.5 text-xs text-white/40">{summary}</p>
                  )}
                </div>
                {/* Export buttons */}
                <div className="flex items-center gap-1">
                  <button onClick={copyJSON} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/40 hover:text-white/70 transition" title="Copy JSON">
                    JSON
                  </button>
                  <button onClick={copyMarkdown} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/40 hover:text-white/70 transition" title="Copy Markdown">
                    MD
                  </button>
                </div>
              </div>

              {/* Severity counts */}
              {issues.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2">
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

              {/* Filters */}
              {issues.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-white/30 uppercase">Severity</span>
                  <FilterChip active={severityFilter === "all"} label="All" onClick={() => setSeverityFilter("all")} />
                  <FilterChip active={severityFilter === "critical"} label="Critical" onClick={() => setSeverityFilter("critical")} colorClass="border-red-500/30 bg-red-500/10 text-red-400" />
                  <FilterChip active={severityFilter === "warning"} label="Warning" onClick={() => setSeverityFilter("warning")} colorClass="border-amber-500/30 bg-amber-500/10 text-amber-400" />
                  <FilterChip active={severityFilter === "info"} label="Info" onClick={() => setSeverityFilter("info")} colorClass="border-sky-500/30 bg-sky-500/10 text-sky-400" />
                  <span className="text-[10px] text-white/30 uppercase ml-2">Type</span>
                  <FilterChip active={typeFilter === "all"} label="All" onClick={() => setTypeFilter("all")} />
                  <FilterChip active={typeFilter === "security"} label="Security" onClick={() => setTypeFilter("security")} colorClass={getTypeColor("security")} />
                  <FilterChip active={typeFilter === "hallucinated_api"} label="Hallucination" onClick={() => setTypeFilter("hallucinated_api")} colorClass={getTypeColor("hallucinated_api")} />
                  <FilterChip active={typeFilter === "api_version_mismatch"} label="Version" onClick={() => setTypeFilter("api_version_mismatch")} colorClass={getTypeColor("api_version_mismatch")} />
                  <FilterChip active={typeFilter === "semantic_error"} label="Quality" onClick={() => setTypeFilter("semantic_error")} colorClass={getTypeColor("semantic_error")} />
                </div>
              )}

              {/* File results summary */}
              {fileResults && fileResults.length > 1 && (
                <div className="mb-3 space-y-1">
                  {fileResults.map((fr) => (
                    <div key={fr.filename} className="flex items-center justify-between rounded-md bg-white/[0.02] px-3 py-1.5 text-xs">
                      <span className="text-white/50 truncate">{fr.filename}</span>
                      <span className={`font-semibold ${fr.score >= 80 ? "text-neon" : fr.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {fr.score}/100
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Issues list */}
              <div className="flex-1 overflow-auto space-y-2 max-h-[480px]">
                {issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p className="mt-3 text-sm">{t("resultNoIssues")}</p>
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <FilterIcon />
                    <p className="mt-3 text-sm">No issues match the selected filters.</p>
                  </div>
                ) : (
                  filteredIssues.map((issue, idx) => {
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
                            <span className={`mt-0.5 inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${getTypeColor(issue.type)}`}>
                              {mapIssueType(issue.type)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white/80 leading-relaxed">
                                {issue.message}
                              </p>
                              <p className="mt-1 text-[11px] text-white/30 font-mono">
                                {issue.file !== "input" && <span className="mr-1">{issue.file}</span>}
                                L{issue.line}
                                {issue.endLine && issue.endLine !== issue.line
                                  ? `-${issue.endLine}`
                                  : ""}{" "}
                                · {issue.ruleId}
                              </p>
                              <CodeSnippet code={(issue as any).codeSnippet} line={issue.line} highlightLine={issue.line} />
                              <FixSection
                                suggestion={(issue as any).fixSuggestion}
                                fixCode={(issue as any).fixCode}
                                referenceUrl={(issue as any).referenceUrl}
                              />
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

function FilterIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
