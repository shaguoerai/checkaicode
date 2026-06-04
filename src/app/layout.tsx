import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/seo-schema";

export const metadata: Metadata = {
  metadataBase: new URL("https://checkaicode.com"),
  title: "Check AI Code - Practical AI Code Review",
  description:
    "Review AI-generated code for practical bugs, security footguns, and framework mistakes before human review.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Check AI Code - Practical AI Code Review",
    description:
      "Review AI-generated code for practical bugs, security footguns, and framework mistakes before human review.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Check AI Code - Practical AI Code Review",
    description:
      "Review AI-generated code for practical bugs, security footguns, and framework mistakes before human review.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
