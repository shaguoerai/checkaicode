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
    pricingSubtitle: "Start free. Upgrade when you're ready. Lock in Launch Special before it ends.",
    freePlan: "Free",
    freePrice: "$0 / month",
    freeDesc: "Start reviewing code with AI — no credit card required.",
    freeReviews: "3 code reviews per day",
    freeProDay: "1 Pro experience day (24h full access) upon signup",
    freeBasic: "Core rule engine (25+ checks)",
    freeCommunity: "GitHub / GitLab / Bitbucket integration",
    freeSupport: "Community support",
    getStarted: "Get Started Free",
    proPlan: "Pro",
    proPrice: "$9 / month",
    proPriceYearly: "$79 / year",
    proDesc: "Lock in your launch price — stays as long as you maintain active subscription.",
    proUnlimited: "Unlimited code reviews (fair use policy applies)",
    proAdvanced: "Advanced AI suggestions (fix + explain)",
    proPriority: "Priority support (24h response)",
    proCustomRules: "Custom rule packs",
    proTeamDash: "Team dashboard (up to 5 members)",
    proApi: "API access",
    upgradeToPro: "Lock In $9/mo",
    lockInYearly: "Lock In $79/yr",
    teamPlan: "Team",
    teamPrice: "Custom",
    teamDesc: "For engineering teams that ship fast and safe.",
    contactSales: "Contact Sales",
    teamEverythingPro: "Everything in Pro",
    teamUnlimitedMembers: "Unlimited team members",
    teamSso: "SSO / SAML",
    teamAnalytics: "Advanced analytics & reporting",
    teamManager: "Dedicated success manager",
    teamSla: "SLA guarantee",
    monthly: "Monthly",
    yearly: "Yearly",
    // Pricing badges & extras
    launchSpecialBadge: "Launch Special",
    futurePrice: "Future price: $19/month",
    yearlySave: "save 27%",
    proExperienceDayTitle: "Pro Experience Day:",
    proExperienceDay: "New users get 24 hours of full Pro features — no credit card required. Try before you buy. Auto-downgrades to Free after 24h unless you choose to upgrade.",
    refundGuarantee: "7-Day Satisfaction Guarantee",
    refundDesc: "Not satisfied? Cancel within 7 days for a full refund of your actual payment. No hassle, no penalties.",
    // Gumroad modal
    gumroadModalTitle: "Redirecting to Gumroad",
    gumroadModalBody: "You are about to complete your subscription via Gumroad, our payment partner. On the Gumroad page:",
    gumroadStep1: "Enter your email and payment details",
    gumroadStep2: "Choose payment method (PayPal / Credit Card)",
    gumroadStep3: "After payment, you will be automatically redirected back",
    gumroadNoAccount: "No Gumroad account required — just your email and payment info to complete the purchase.",
    gumroadContinue: "Continue",
    gumroadCancel: "Cancel",
    // FAQ
    faqTitle: "Frequently Asked Questions",
    faqQ1: "What happens after the Launch Special ends (June 30)?",
    faqA1: "Pro returns to the regular price of $19/month. Early adopters who locked in at $9 keep that rate as long as they maintain an active subscription.",
    faqQ2: "Can I switch from monthly to yearly later?",
    faqA2: "Yes, anytime. We'll prorate your remaining monthly balance toward the yearly plan.",
    faqQ3: "What counts as a \"code review\" on the Free plan?",
    faqA3: "One review = one pull request or one file upload processed by our AI. The daily limit resets at midnight UTC.",
    faqQ4: "Do I need a credit card for the Free plan?",
    faqA4: "No. Credit card is only required when upgrading to Pro.",
    faqQ5: "What happens to my data if I cancel?",
    faqA5: "Your review history and settings are preserved for 90 days. You can reactivate anytime within that window.",
    faqQ6: "Is there a student or open-source discount?",
    faqA6: "Yes — verified students and maintainers of open-source projects with 100+ stars get Pro at $5/month. Contact support to apply.",
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
    // Rate limit
    rateLimitTitle: "Daily Limit Reached",
    rateLimitDesc: "You've used all your free scans for today.",
    rateLimitSignIn: "Sign In",
    rateLimitUpgrade: "Upgrade to Pro",
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
    pricingSubtitle: "免费开始。准备好再升级。在 Launch Special 结束前锁定价格。",
    freePlan: "免费版",
    freePrice: "¥0 / 月",
    freeDesc: "开始用 AI 审查代码 — 无需信用卡。",
    freeReviews: "每日 3 次代码审查",
    freeProDay: "注册即送 1 天 Pro 体验（24 小时全功能访问）",
    freeBasic: "核心规则引擎（25+ 检查项）",
    freeCommunity: "GitHub / GitLab / Bitbucket 集成",
    freeSupport: "社区支持",
    getStarted: "免费开始",
    proPlan: "专业版",
    proPrice: "$9 / 月",
    proPriceYearly: "$79 / 年",
    proDesc: "锁定你的首发价格 — 只要保持订阅就永久有效。",
    proUnlimited: "无限代码审查（合理使用政策适用）",
    proAdvanced: "高级 AI 建议（修复 + 解释）",
    proPriority: "优先支持（24 小时响应）",
    proCustomRules: "自定义规则包",
    proTeamDash: "团队面板（最多 5 人）",
    proApi: "API 访问",
    upgradeToPro: "锁定 $9/月",
    lockInYearly: "锁定 $79/年",
    teamPlan: "团队版",
    teamPrice: "定制",
    teamDesc: "为快速安全交付的工程团队打造。",
    contactSales: "联系销售",
    teamEverythingPro: "Pro 版全部功能",
    teamUnlimitedMembers: "无限团队成员",
    teamSso: "SSO / SAML",
    teamAnalytics: "高级分析与报表",
    teamManager: "专属客户成功经理",
    teamSla: "SLA 保障",
    monthly: "月付",
    yearly: "年付",
    // Pricing badges & extras
    launchSpecialBadge: "Launch Special",
    futurePrice: "未来价格: $19/月",
    yearlySave: "省 27%",
    proExperienceDayTitle: "Pro 体验日：",
    proExperienceDay: "新用户免费获得 24 小时全功能 Pro 体验 — 无需信用卡。先试用再购买。24 小时后自动降级为免费版，除非你选择升级。",
    refundGuarantee: "7 天满意保证",
    refundDesc: "不满意？7 天内取消可全额退还实际支付金额。无麻烦，无罚金。",
    // Gumroad modal
    gumroadModalTitle: "Redirecting to Gumroad",
    gumroadModalBody: "你即将跳转到我们的支付服务商 Gumroad 完成订阅。在 Gumroad 页面上：",
    gumroadStep1: "填写你的邮箱和支付信息",
    gumroadStep2: "选择支付方式（支持 PayPal / 信用卡）",
    gumroadStep3: "支付成功后自动跳转回本站",
    gumroadNoAccount: "无需注册 Gumroad 账号，填写邮箱和支付信息即可完成购买。",
    gumroadContinue: "继续购买",
    gumroadCancel: "取消",
    // FAQ
    faqTitle: "常见问题",
    faqQ1: "Launch Special 结束后（6 月 30 日）会怎样？",
    faqA1: "Pro 恢复至常规价格 $19/月。在 $9 锁定价格的早期用户，只要保持活跃订阅即可永久享受该价格。",
    faqQ2: "之后可以从月付切换到年付吗？",
    faqA2: "可以，随时切换。我们会按比例折算你剩余的月付余额到年付计划。",
    faqQ3: "免费版的 \"代码审查\" 怎么算？",
    faqA3: "一次审查 = 一个 PR 或一个由 AI 处理的文件上传。每日限制在 UTC 午夜重置。",
    faqQ4: "免费版需要信用卡吗？",
    faqA4: "不需要。仅在升级到 Pro 时才需要信用卡。",
    faqQ5: "取消后我的数据会怎样？",
    faqA5: "你的审查历史和设置会保留 90 天。在此期间随时可以重新激活。",
    faqQ6: "有学生或开源项目优惠吗？",
    faqA6: "有 — 认证学生及 100+ stars 开源项目维护者可享受 $5/月的 Pro 价格。联系客服申请。",
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
    // Rate limit
    rateLimitTitle: "今日额度已用完",
    rateLimitDesc: "你今天的免费扫描次数已用完。",
    rateLimitSignIn: "登录",
    rateLimitUpgrade: "升级到 Pro",
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
