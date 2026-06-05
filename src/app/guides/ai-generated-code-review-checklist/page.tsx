import type { Metadata } from "next";
import { AIGeneratedCodeReviewChecklistContent } from "./content";

const title = "AI-Generated Code Review Checklist: What to Check Before You Ship";
const description =
  "A practical checklist for reviewing AI-generated code before shipping. Check async bugs, auth, input validation, secrets, files, dependencies, and tests.";
const canonical = "https://checkaicode.com/guides/ai-generated-code-review-checklist";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title,
    description,
    type: "article",
    url: canonical,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: title,
  description,
  author: {
    "@type": "Organization",
    name: "Check AI Code",
  },
  datePublished: "2026-06-05",
  dateModified: "2026-06-06",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": canonical,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does AI-generated code still need code review?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. AI-generated code can look plausible while still missing awaits, skipping validation, using stale APIs, leaking secrets, or misunderstanding business logic.",
      },
    },
    {
      "@type": "Question",
      name: "Can Check AI Code replace tests or human review?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Check AI Code is a fast first-pass review layer. It helps surface practical risks, but it does not replace tests, type checks, human review, dependency scanning, or formal security audits.",
      },
    },
  ],
};

export default function AIGeneratedCodeReviewChecklistPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <AIGeneratedCodeReviewChecklistContent />
    </>
  );
}
