const siteUrl = "https://checkaicode.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "Check AI Code",
  url: siteUrl,
  email: "support@checkaicode.com",
  sameAs: ["https://x.com/yugerai"],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "Check AI Code",
  url: siteUrl,
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${siteUrl}/#software`,
  name: "Check AI Code",
  url: siteUrl,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "A practical first-pass code review tool for AI-generated code, security footguns, and framework mistakes.",
  featureList: [
    "Python, JavaScript, TypeScript, Java, and Go code scanning",
    "Static rules for security and reliability issues",
    "Optional AI-enhanced explanations for Pro users",
    "Privacy Mode that skips LLM enhancement",
    "Free daily scans and Pro upgrade options",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Pro Monthly",
      price: "9",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Pro Annual",
      price: "79",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`,
    },
  ],
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export const guideHowToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to review code with Check AI Code",
  description:
    "Scan code, review severity, use Privacy Mode, and understand Free and Pro scan limits.",
  step: [
    {
      "@type": "HowToStep",
      name: "Open the review page",
      text: "Go to the Check AI Code review page.",
      url: `${siteUrl}/review`,
    },
    {
      "@type": "HowToStep",
      name: "Paste or upload code",
      text: "Choose the language, paste or upload a code file, and start the scan.",
    },
    {
      "@type": "HowToStep",
      name: "Read the findings",
      text: "Review critical, warning, and info findings before asking for human review.",
    },
    {
      "@type": "HowToStep",
      name: "Use Pro controls when needed",
      text: "Use Deep Scan for more thorough checks or Privacy Mode to skip LLM enhancement.",
    },
  ],
};

export const guideFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does Check AI Code replace a human reviewer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. It is a first-pass scanner meant to catch practical issues before human review.",
      },
    },
    {
      "@type": "Question",
      name: "What does Privacy Mode do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Privacy Mode runs static checks and skips the LLM-enhanced explanation layer.",
      },
    },
    {
      "@type": "Question",
      name: "Which languages are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Check AI Code supports Python, JavaScript, TypeScript, Java, and Go.",
      },
    },
  ],
};

export const whyFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Check AI Code best for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It is best for a quick sanity check on AI-generated or recently changed code before human review.",
      },
    },
    {
      "@type": "Question",
      name: "How is it different from deep security scanners?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It focuses on practical first-pass findings and readable explanations, not full static analysis replacement.",
      },
    },
  ],
};
