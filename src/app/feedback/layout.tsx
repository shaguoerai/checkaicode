import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Feedback and Support - Check AI Code",
  description:
    "Send product feedback, support questions, false positives, and missed issues to the Check AI Code team.",
  alternates: {
    canonical: "/feedback",
  },
  openGraph: {
    title: "Feedback and Support - Check AI Code",
    description:
      "Send product feedback, support questions, false positives, and missed issues to the Check AI Code team.",
    url: "/feedback",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Feedback and Support - Check AI Code",
    description:
      "Send product feedback, support questions, false positives, and missed issues to the Check AI Code team.",
  },
};

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return children;
}
