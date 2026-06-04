import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Refund Policy - Check AI Code",
  description:
    "Check AI Code refund policy for monthly and annual Pro subscriptions, including the 7-day satisfaction guarantee.",
  alternates: {
    canonical: "/refund",
  },
};

export default function RefundLayout({ children }: { children: ReactNode }) {
  return children;
}
