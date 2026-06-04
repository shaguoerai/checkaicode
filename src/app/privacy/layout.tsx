import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy - Check AI Code",
  description:
    "How Check AI Code handles sign-in data, submitted code, payments, retention, cookies, and deletion requests.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
