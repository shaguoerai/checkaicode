import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Why Check AI Code | CheckAICode",
  description:
    "What Check AI Code does, who it is for, what it can catch, and how it differs from traditional linting and security scanning tools.",
  openGraph: {
    title: "Why Check AI Code",
    description:
      "A practical overview of Check AI Code: AI-generated code review, security checks, runtime bug patterns, and honest limits.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Check AI Code",
    description:
      "A practical overview of Check AI Code: AI-generated code review, security checks, runtime bug patterns, and honest limits.",
  },
};

export default function WhyLayout({ children }: { children: ReactNode }) {
  return children;
}
