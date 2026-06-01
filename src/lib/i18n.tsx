"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
    freeReviews: "3 anonymous reviews/day, 5 when signed in",
    freeProDay: "1 Pro experience day (24h full access) upon signup",
    freeBasic: "Local rule engine + Semgrep checks",
    freeCommunity: "Paste code or upload files",
    freeSupport: "Saved review history when signed in",
    freeHallucination: "Fake API and method checks",
    freeSecurity: "Secret and security pattern detection",
    getStarted: "Get Started Free",
    proPlan: "Pro",
    proPrice: "$9 / month",
    proPriceYearly: "$79 / year",
    proDesc: "Lock in your launch price — stays as long as you maintain active subscription.",
    proUnlimited: "Unlimited code reviews (fair use policy applies)",
    proAdvanced: "Deep scan mode",
    proPriority: "Privacy Mode option",
    proCustomRules: "Larger files up to 3,000 lines",
    proTeamDash: "Multi-file review workflow",
    proApi: "Automatic Pro activation after payment",
    upgradeToPro: "Lock In $9/mo",
    lockInYearly: "Lock In $79/yr",
    teamPlan: "Team",
    teamPrice: "Custom",
    teamDesc: "For teams that need custom rollout and support.",
    contactSales: "Contact Sales",
    teamEverythingPro: "Everything currently in Pro",
    teamUnlimitedMembers: "Manual onboarding support",
    teamSso: "Custom billing via Creem",
    teamAnalytics: "Roadmap: team workspace",
    teamManager: "Roadmap: shared review history",
    teamSla: "Contact us before rollout",
    contactSalesTitle: "Contact sales",
    contactSalesBody: "Team plans are handled manually for now. Email us with your team size, rollout timeline, and billing needs, and we will reply with next steps.",
    contactSalesEmailLabel: "Sales email",
    contactSalesCopy: "Copy email",
    contactSalesCopied: "Copied",
    contactSalesOpenEmail: "Open email",
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
    // Creem modal
    creemModalTitle: "Continue to secure checkout",
    creemModalBody: "You are about to complete your subscription via Creem, our Merchant of Record. On the checkout page:",
    creemStep1: "Enter your billing details and payment method",
    creemStep2: "Complete the $9/month subscription",
    creemStep3: "Return to Check AI Code after payment; Pro will be activated automatically",
    creemNoAccount: "Use the same email as your Check AI Code account so we can match the subscription.",
    creemTaxIdNote: "Tax ID is optional and only needed for business purchases. Individual users can skip it.",
    creemContinue: "Continue",
    creemCancel: "Cancel",
    creatingCheckout: "Creating checkout...",
    checkoutFailed: "Unable to start checkout. Please try again or contact support.",
    gumroadModalTitle: "Continue to secure checkout",
    gumroadModalBody: "You are about to complete your subscription via Creem, our Merchant of Record. On the checkout page:",
    gumroadStep1: "Enter your billing details and payment method",
    gumroadStep2: "Complete the $9/month subscription",
    gumroadStep3: "Return to Check AI Code after payment; Pro will be activated automatically",
    gumroadNoAccount: "Use the same email as your Check AI Code account so we can match the subscription.",
    gumroadContinue: "Continue",
    gumroadCancel: "Cancel",
    activatePurchasedLicense: "Already purchased? Activate license",
    activateLicenseTitle: "Activate Pro",
    activateLicenseBody: "Enter the license key from your Gumroad receipt to unlock Pro on this account.",
    licenseKeyLabel: "License key",
    licenseKeyPlaceholder: "Paste your Gumroad license key",
    activateLicenseButton: "Activate Pro",
    activatingLicense: "Activating...",
    licenseKeyRequired: "Enter your license key.",
    licenseActivationFailed: "License activation failed.",
    licenseVerificationFailed: "Verification failed. Please try again later.",
    currentPlan: "Current plan",
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
    // Usage counter
    usageLeft: "{N} reviews left today",
    usagePro: "Pro — Unlimited",
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
    freeReviews: "匿名每日 3 次，登录后每日 5 次",
    freeProDay: "注册即送 1 天 Pro 体验（24 小时全功能访问）",
    freeBasic: "本地规则引擎 + Semgrep 检查",
    freeCommunity: "粘贴代码或上传文件",
    freeSupport: "登录后保存审查历史",
    freeHallucination: "虚假 API / 方法检查",
    freeSecurity: "密钥与安全模式检测",
    getStarted: "免费开始",
    proPlan: "专业版",
    proPrice: "$9 / 月",
    proPriceYearly: "$79 / 年",
    proDesc: "锁定你的首发价格 — 只要保持订阅就永久有效。",
    proUnlimited: "无限代码审查（合理使用政策适用）",
    proAdvanced: "Deep 深度扫描模式",
    proPriority: "Privacy Mode 隐私模式",
    proCustomRules: "更大文件：最多 3,000 行",
    proTeamDash: "多文件审查流程",
    proApi: "付款后自动开通 Pro",
    upgradeToPro: "锁定 $9/月",
    lockInYearly: "锁定 $79/年",
    teamPlan: "团队版",
    teamPrice: "定制",
    teamDesc: "为需要定制上线和支持的团队准备。",
    contactSales: "联系销售",
    teamEverythingPro: "当前 Pro 的全部功能",
    teamUnlimitedMembers: "人工上线支持",
    teamSso: "通过 Creem 定制结算",
    teamAnalytics: "路线图：团队工作区",
    teamManager: "路线图：共享审查历史",
    teamSla: "上线前请先联系我们",
    contactSalesTitle: "联系销售",
    contactSalesBody: "团队版目前采用人工开通。请邮件说明团队人数、上线时间和结算需求，我们会回复下一步安排。",
    contactSalesEmailLabel: "销售邮箱",
    contactSalesCopy: "复制邮箱",
    contactSalesCopied: "已复制",
    contactSalesOpenEmail: "打开邮件",
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
    // Creem modal
    creemModalTitle: "继续前往安全结账",
    creemModalBody: "你即将通过 Creem（我们的 Merchant of Record）完成订阅。在结账页：",
    creemStep1: "填写账单信息和支付方式",
    creemStep2: "完成 $9/月订阅",
    creemStep3: "付款后返回 Check AI Code；Pro 会自动开通",
    creemNoAccount: "请尽量使用和 Check AI Code 账号相同的邮箱，方便系统匹配订阅。",
    creemTaxIdNote: "Tax ID 仅企业购买时需要，个人用户可直接跳过。",
    creemContinue: "继续",
    creemCancel: "取消",
    creatingCheckout: "正在创建结账页...",
    checkoutFailed: "暂时无法打开结账页，请稍后重试或联系支持。",
    gumroadModalTitle: "继续前往安全结账",
    gumroadModalBody: "你即将通过 Creem（我们的 Merchant of Record）完成订阅。在结账页：",
    gumroadStep1: "填写账单信息和支付方式",
    gumroadStep2: "完成 $9/月订阅",
    gumroadStep3: "付款后返回 Check AI Code；Pro 会自动开通",
    gumroadNoAccount: "请尽量使用和 Check AI Code 账号相同的邮箱，方便系统匹配订阅。",
    gumroadContinue: "继续",
    gumroadCancel: "取消",
    activatePurchasedLicense: "已经购买？激活 license",
    activateLicenseTitle: "激活 Pro",
    activateLicenseBody: "输入 Gumroad 收据中的 license key，在当前账号上解锁 Pro。",
    licenseKeyLabel: "License key",
    licenseKeyPlaceholder: "粘贴你的 Gumroad license key",
    activateLicenseButton: "激活 Pro",
    activatingLicense: "正在激活...",
    licenseKeyRequired: "请输入 license key。",
    licenseActivationFailed: "License 激活失败。",
    licenseVerificationFailed: "验证失败，请稍后再试。",
    currentPlan: "当前方案",
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
    // Usage counter
    usageLeft: "今日剩余 {N} 次",
    usagePro: "Pro — 无限使用",
  },
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("lang");
    if (saved === "zh" || saved === "en") return saved;
    const browserLang = navigator.language;
    return browserLang.startsWith("zh") ? "zh" : "en";
  });

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
