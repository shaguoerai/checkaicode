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
    heroTitle: "Check AI Code",
    heroSubtitle: "Detect hallucinations, version conflicts \u0026 security risks in AI-generated code — before it reaches production.",
    startFreeReview: "Start Free Review",
    viewPricing: "View Pricing",
    // Features
    featHallucination: "Hallucination Detection",
    featHallucinationDesc: "Spot fake APIs, non-existent imports, and imaginary functions that LLMs love to invent.",
    featVersion: "Version Compatibility",
    featVersionDesc: "Verify dependency versions and catch breaking changes across framework updates.",
    featSecurity: "Security Scan",
    featSecurityDesc: "Surface hardcoded secrets, unsafe evals, and injection vulnerabilities instantly.",
    // Pricing
    pricingTitle: "Pricing",
    pricingSubtitle: "Choose the plan that fits your workflow.",
    freePlan: "Free",
    freePrice: "$0 / month",
    freeDesc: "For individual developers getting started.",
    freeReviews: "10 reviews / month",
    freeBasic: "Basic analysis",
    freeCommunity: "Community support",
    getStarted: "Get Started",
    proPlan: "Pro",
    proPrice: "$19 / month",
    proDesc: "For teams shipping code at scale.",
    proUnlimited: "Unlimited reviews",
    proAdvanced: "Advanced security scan",
    proPriority: "Priority support",
    upgradeToPro: "Upgrade to Pro",
    // Review
    reviewTitle: "Code Review",
    reviewSubtitle: "Paste code or upload a file to analyze.",
    uploadFile: "Upload File",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    resultTitle: "Analysis Result",
    codePlaceholder: "Paste your code here...",
    // Auth
    authTitle: "Sign In",
    authSubtitle: "Choose your preferred sign-in method",
    continueGoogle: "Continue with Google",
    continueGitHub: "Continue with GitHub",
    // Misc
    langToggle: "中",
  },
  zh: {
    // Nav
    signIn: "登录",
    // Hero
    heroTitle: "AI 代码审查",
    heroSubtitle: "在 AI 生成的代码进入生产环境之前，检测幻觉、版本冲突与安全风险。",
    startFreeReview: "免费开始审查",
    viewPricing: "查看定价",
    // Features
    featHallucination: "幻觉检测",
    featHallucinationDesc: "识别虚构 API、不存在的导入和 LLM 喜欢编造的函数。",
    featVersion: "版本兼容性",
    featVersionDesc: "验证依赖版本，捕获框架更新中的破坏性变更。",
    featSecurity: "安全扫描",
    featSecurityDesc: "即时发现硬编码密钥、不安全 eval 和注入漏洞。",
    // Pricing
    pricingTitle: "定价",
    pricingSubtitle: "选择适合你工作流的方案。",
    freePlan: "免费版",
    freePrice: "¥0 / 月",
    freeDesc: "适合个人开发者入门使用。",
    freeReviews: "每月 10 次审查",
    freeBasic: "基础分析",
    freeCommunity: "社区支持",
    getStarted: "开始使用",
    proPlan: "专业版",
    proPrice: "$19 / 月（暂定）",
    proDesc: "适合规模化交付代码的团队。",
    proUnlimited: "无限次审查",
    proAdvanced: "高级安全扫描",
    proPriority: "优先支持",
    upgradeToPro: "升级到专业版",
    // Review
    reviewTitle: "代码审查",
    reviewSubtitle: "粘贴代码或上传文件进行分析。",
    uploadFile: "上传文件",
    analyze: "分析",
    analyzing: "分析中...",
    resultTitle: "分析结果",
    codePlaceholder: "在此粘贴代码...",
    // Auth
    authTitle: "登录",
    authSubtitle: "选择你的登录方式",
    continueGoogle: "使用 Google 登录",
    continueGitHub: "使用 GitHub 登录",
    // Misc
    langToggle: "EN",
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
