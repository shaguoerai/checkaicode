import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing - Check AI Code",
  description:
    "Compare Free, Pro monthly, Pro annual, and Team options for Check AI Code.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing - Check AI Code",
    description:
      "Compare Free, Pro monthly, Pro annual, and Team options for Check AI Code.",
    url: "/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing - Check AI Code",
    description:
      "Compare Free, Pro monthly, Pro annual, and Team options for Check AI Code.",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
