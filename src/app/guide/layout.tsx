import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "How to use Check AI Code | CheckAICode",
  description:
    "A short guide to scanning code, reading severity results, using Privacy Mode, and understanding Free vs Pro limits in Check AI Code.",
};

export default function GuideLayout({ children }: { children: ReactNode }) {
  return children;
}
