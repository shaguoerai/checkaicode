import type { Metadata } from "next";
import { JavaScriptAsyncCodeReviewContent } from "./content";

const title = "JavaScript Async Code Review: Common Bugs AI-Generated Code Still Makes";
const description =
  "Review JavaScript and TypeScript async code for common AI-generated bugs: async forEach, missing returns, fire-and-forget work, swallowed errors, and unsafe sequencing.";
const canonical = "https://checkaicode.com/guides/javascript-async-code-review";

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
      name: "Why do AI-generated JavaScript snippets often have async bugs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many async bugs are syntactically valid and look plausible in examples. AI tools can copy common patterns such as async forEach, unreturned promises, or fire-and-forget side effects without preserving the timing guarantees a production handler needs.",
      },
    },
    {
      "@type": "Question",
      name: "Can a clean async code review guarantee JavaScript code is safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Async review can catch common timing and error-handling mistakes, but it does not replace tests, type checks, load testing, manual review, or monitoring in production.",
      },
    },
  ],
};

export default function JavaScriptAsyncCodeReviewPage() {
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
      <JavaScriptAsyncCodeReviewContent />
    </>
  );
}
