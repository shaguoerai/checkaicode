import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Scan Your Code - Check AI Code",
  description:
    "Paste or upload code to find practical bugs, security risks, and AI-generated code mistakes before you ship.",
  alternates: {
    canonical: "/review",
  },
  openGraph: {
    title: "Scan Your Code - Check AI Code",
    description:
      "Paste or upload code to find practical bugs, security risks, and AI-generated code mistakes before you ship.",
    url: "/review",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scan Your Code - Check AI Code",
    description:
      "Paste or upload code to find practical bugs, security risks, and AI-generated code mistakes before you ship.",
  },
};

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return children;
}
