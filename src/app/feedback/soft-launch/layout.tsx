import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Soft Launch Feedback - Check AI Code",
  description:
    "Private soft-launch feedback form for invited Check AI Code testers.",
  alternates: {
    canonical: "/feedback/soft-launch",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Soft Launch Feedback - Check AI Code",
    description:
      "Private soft-launch feedback form for invited Check AI Code testers.",
    url: "/feedback/soft-launch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soft Launch Feedback - Check AI Code",
    description:
      "Private soft-launch feedback form for invited Check AI Code testers.",
  },
};

export default function SoftLaunchFeedbackLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
