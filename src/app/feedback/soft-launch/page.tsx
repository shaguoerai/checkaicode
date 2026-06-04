"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthStatus } from "@/components/auth-status";

const channels = [
  "领航计划 AI 编程群",
  "Indie Hackers",
  "X / Twitter",
  "私聊邀请",
  "其他",
];

const languages = ["Python", "JavaScript", "TypeScript", "Java", "Go", "其他"];

export default function SoftLaunchFeedbackPage() {
  const [form, setForm] = useState({
    channel: channels[0],
    language: languages[0],
    projectType: "",
    usefulFinding: "",
    falsePositive: "",
    falseNegative: "",
    uxIssue: "",
    pricingFeedback: "",
    otherFeedback: "",
  });
  const [status, setStatus] = useState<{
    state: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ state: "idle", message: "" });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "loading", message: "正在提交反馈..." });

    const response = await fetch("/api/feedback/soft-launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus({
        state: "error",
        message: result.error || "反馈提交失败。",
      });
      return;
    }

    setStatus({
      state: "success",
      message: result.rewardGranted
        ? `感谢反馈，系统已为你的账号额外增加 ${result.rewardDays} 天 Pro。`
        : "感谢反馈，内容已保存。这个账号已经领取过本次反馈奖励。",
    });
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-neon/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ee787" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            Check AI Code
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/review" className="text-sm text-white/60 transition hover:text-white">
            去扫描
          </Link>
          <Link href="/pricing" className="text-sm text-white/60 transition hover:text-white">
            价格
          </Link>
          <AuthStatus signInLabel="登录" />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="space-y-5">
          <p className="text-sm font-medium uppercase text-neon/80">领航计划试用反馈</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            试用之后，告诉我真实感受。
          </h1>
          <p className="text-sm leading-6 text-white/55">
            请先登录并完成至少一次代码扫描，再在这里提交具体反馈。首次有效反馈会自动为你的账号额外增加 7 天 Pro。
          </p>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/55">
            有价值的反馈包括：扫出了什么真实问题、哪里误报了、漏掉了什么、流程哪里卡住、价格是否合理。请不要在这里粘贴私密源码。
          </div>
          <Link
            href="/review"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-neon px-4 text-sm font-semibold text-[#050505] transition hover:bg-neon-dim"
          >
            先去扫描代码
          </Link>
        </section>

        <form onSubmit={submitFeedback} className="space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-white/70">
              <span>来源渠道</span>
              <select
                value={form.channel}
                onChange={(event) => updateField("channel", event.target.value)}
                className="h-11 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-white outline-none transition focus:border-neon/60"
              >
                {channels.map((channel) => (
                  <option key={channel}>{channel}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-white/70">
              <span>代码语言</span>
              <select
                value={form.language}
                onChange={(event) => updateField("language", event.target.value)}
                className="h-11 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-white outline-none transition focus:border-neon/60"
              >
                {languages.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
          </div>

          <TextInput
            label="项目类型"
            value={form.projectType}
            placeholder="SaaS、小脚本、Agent 工具、内部系统..."
            onChange={(value) => updateField("projectType", value)}
          />
          <TextArea
            required
            label="哪些结果有用，或者哪里没用？"
            value={form.usefulFinding}
            placeholder="有没有扫出真实问题？结果可信吗？哪些提示让你觉得没必要？"
            onChange={(value) => updateField("usefulFinding", value)}
          />
          <TextArea
            label="误报情况"
            value={form.falsePositive}
            placeholder="有没有把正常代码报成问题？可以简单描述一下。"
            onChange={(value) => updateField("falsePositive", value)}
          />
          <TextArea
            label="漏检情况"
            value={form.falseNegative}
            placeholder="有没有你觉得应该发现、但它没发现的问题？"
            onChange={(value) => updateField("falseNegative", value)}
          />
          <TextArea
            label="使用流程问题"
            value={form.uxIssue}
            placeholder="登录、扫描、结果页、速度、试用状态，哪里不顺？"
            onChange={(value) => updateField("uxIssue", value)}
          />
          <TextArea
            label="价格感受"
            value={form.pricingFeedback}
            placeholder="9 美元/月是否合理？什么情况下你会或不会付费？"
            onChange={(value) => updateField("pricingFeedback", value)}
          />
          <TextArea
            label="其他建议"
            value={form.otherFeedback}
            placeholder="功能建议、和其他工具的对比、任何真实感受都可以。"
            onChange={(value) => updateField("otherFeedback", value)}
          />

          {status.message && (
            <p
              className={`rounded-md border px-3 py-2 text-sm ${
                status.state === "success"
                  ? "border-neon/30 bg-neon/10 text-neon"
                  : "border-red-400/30 bg-red-400/10 text-red-200"
              }`}
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.state === "loading"}
            className="h-11 w-full rounded-lg bg-neon text-sm font-semibold text-[#050505] transition hover:bg-neon-dim disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status.state === "loading" ? "提交中..." : "提交反馈"}
          </button>
        </form>
      </main>
    </div>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm text-white/70">
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-white outline-none transition placeholder:text-white/25 focus:border-neon/60"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm text-white/70">
      <span>
        {label}
        {required ? <span className="text-neon"> *</span> : null}
      </span>
      <textarea
        required={required}
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-neon/60"
      />
    </label>
  );
}
