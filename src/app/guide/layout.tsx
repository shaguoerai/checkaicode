import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, guideFaqSchema, guideHowToSchema } from "@/lib/seo-schema";

export const metadata: Metadata = {
  title: "How to use Check AI Code | CheckAICode",
  description:
    "A short guide to scanning code, reading severity results, using Privacy Mode, and understanding Free vs Pro limits in Check AI Code.",
  alternates: {
    canonical: "/guide",
  },
  openGraph: {
    title: "How to use Check AI Code",
    description:
      "A short guide to scanning code, reading severity results, using Privacy Mode, and understanding Free vs Pro limits.",
    url: "/guide",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to use Check AI Code",
    description:
      "A short guide to scanning code, reading severity results, using Privacy Mode, and understanding Free vs Pro limits.",
  },
};

export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          guideHowToSchema,
          guideFaqSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Guide", path: "/guide" },
          ]),
        ]}
      />
      {children}
    </>
  );
}
