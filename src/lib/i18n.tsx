"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "zh";

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const dict: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    signIn: "Sign In",
    // Hero
    heroTitle: "Your AI Wrote This Code.",
    heroTitleHighlight: "But Did It Write It Right?",
    heroSubtitle: "Detect hallucinations, fake APIs, security flaws in AI-generated code — before it reaches production.",
    heroBadge: "Real-time Analysis Engine",
    startFreeReview: "Scan My Code — Free",
    viewPricing: "View Pricing",
    // Features
    featuresTitle: "Core Capabilities",
    featuresSubtitle: "Deep analysis built specifically for AI-generated code",
    featHallucination: "Does that function even exist?",
    featHallucinationDesc: "Spot fake APIs and non-existent imports your AI invented.",
    featVersion: "Will this break in production?",
    featVersionDesc: "Catch breaking changes across framework updates before they become incidents.",
    featSecurity: "Is your secret exposed?",
    featSecurityDesc: "Find hardcoded keys, injection vulnerabilities, and unsafe patterns instantly.",
    // Pricing
    pricingTitle: "Pricing",
    pricingSubtitle: "Choose the plan that fits your workflow.",
    freePlan: "Free",
    freePrice: "$0 / month",
    freeDesc: "For quick checks. 3 scans/day · Rule engine · Secret detection",
    freeReviews: "3 scans / day",
    freeBasic: "Rule engine",
    freeCommunity: "Secret detection",
    getStarted: "Get Started — Free",
    proPlan: "Pro",
    proPrice: "$9 / month",
    proPriceYearly: "$79 / year",
    proDesc: "For serious devs. 200 scans/month · LLM deep analysis · Multi-file scan · Fix suggestions",
    proUnlimited: "200 scans / month",
    proAdvanced: "LLM deep analysis",
    proPriority: "Fix suggestions",
    upgradeToPro: "Upgrade to Pro",
    teamPlan: "Team",
    teamPrice: "$29 / month",
    teamDesc: "For growing teams. 500 scans/month/seat · Shared pool · Priority support",
    contactSales: "Contact Sales",
    // Review
    reviewTitle: "Code Review",
    reviewSubtitle: "Paste code or upload a file to analyze.",
    uploadFile: "Upload File",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    resultTitle: "We found {N} issue(s) in your code",
    codePlaceholder: "Paste your code here...",
    // Severity labels
    sevCritical: "CRITICAL",
    sevWarning: "WARNING",
    sevInfo: "INFO",
    // Result stats
    resultFound: "Found",
    resultIssues: "issue(s)",
    resultScanTime: "Scan time",
    resultNoIssues: "Clean bill of health. No issues detected.",
    // Auth
    authTitle: "Sign In",
    authSubtitle: "Choose your preferred sign-in method",
    continueGoogle: "Continue with Google",
    continueGitHub: "Continue with GitHub",
    // Misc
    langToggle: "中",
    // CTA
    ctaTitle: "Ready to ship code you actually trust?",
    ctaSubtitle: "One scan takes 3 seconds. One bug in production takes 3 hours to fix.",
  },
  zh: {
    // Nav
    signIn: "登录",
    // Hero
    heroTitle: "你的 AI 写了这段代码。",
    heroTitleHighlight: "但它写对了吗？",
    heroSubtitle: "在 AI 生成的代码上线前，检测幻觉、虚构 API 和安全漏洞。",
    heroBadge: "实时分析引擎",
    startFreeReview: "免费扫描代码",
    viewPricing: "查看定价",
    // Features
    featuresTitle: "核心能力",
    featuresSubtitle: "专为 AI 生成代码设计的深度分析工具",
    featHallucination: "这函数真的存在吗？",
    featHallucinationDesc: "揪出 AI 编造的虚假 API 和不存在的导入。",
    featVersion: "上线后会炸吗？",
    featVersionDesc: "在框架更新引发事故前，捕获破坏性变更。",
    featSecurity: "你的密钥泄露了吗？",
    featSecurityDesc: "瞬间发现硬编码密钥、注入漏洞和不安全写法。",
    // Pricing
    pricingTitle: "定价",
    pricingSubtitle: "选择适合你工作流的方案。",
    freePlan: "免费版",
    freePrice: "¥0 / 月",
    freeDesc: "快速检查。每日 3 次扫描 · 规则引擎 · 密钥检测",
    freeReviews: "每日 3 次扫描",
    freeBasic: "规则引擎",
    freeCommunity: "密钥检测",
    getStarted: "免费开始",
    proPlan: "专业版",
    proPrice: "$9 / 月",
    proPriceYearly: "$79 / 年",
    proDesc: "给认真的开发者。每月 200 次扫描 · LLM 深度分析 · 多文件扫描 · 修复建议",
    proUnlimited: "每月 200 次扫描",
    proAdvanced: "LLM 深度分析",
    proPriority: "修复建议",
    upgradeToPro: "升级到专业版",
    teamPlan: "团队版",
    teamPrice: "$29 / 月",
    teamDesc: "给成长的团队。每座每月 500 次扫描 · 共享额度 · 优先支持",
    contactSales: "联系销售",
    // Review
    reviewTitle: "代码审查",
    reviewSubtitle: "粘贴代码或上传文件进行分析。",
    uploadFile: "上传文件",
    analyze: "分析",
    analyzing: "分析中...",
    resultTitle: "我们在你的代码中发现了 {N} 个问题",
    codePlaceholder: "在此粘贴代码...",
    // Severity labels
    sevCritical: "严重",
    sevWarning: "警告",
    sevInfo: "信息",
    // Result stats
    resultFound: "发现",
    resultIssues: "个问题",
    resultScanTime: "扫描耗时",
    resultNoIssues: "一切正常，未发现任何问题。",
    // Auth
    authTitle: "登录",
    authSubtitle: "选择你的登录方式",
    continueGoogle: "使用 Google 登录",
    continueGitHub: "使用 GitHub 登录",
    // Misc
    langToggle: "EN",
    // CTA
    ctaTitle: "准备好发布你真正信任的代码了吗？",
    ctaSubtitle: "一次扫描只需 3 秒。一个生产环境 bug 需要 3 小时来修复。",
  },
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (saved === "zh" || saved === "en") {
      setLangState(saved);
    } else {
      const browserLang = typeof navigator !== "undefined" ? navigator.language : "en";
      setLangState(browserLang.startsWith("zh") ? "zh" : "en");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (key: string) => dict[lang][key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
