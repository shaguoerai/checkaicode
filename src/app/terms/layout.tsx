import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service - Check AI Code",
  description:
    "Terms for using Check AI Code, including service limits, user responsibilities, prohibited use, refunds, and cancellation.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
