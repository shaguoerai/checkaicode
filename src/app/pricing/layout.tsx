import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo-schema";

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
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
        ]}
      />
      {children}
    </>
  );
}
