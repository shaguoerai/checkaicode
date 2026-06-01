import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "CheckAICode — AI Code Review: Start Free, Pro from $9/mo",
  description: "Start free with 3 anonymous reviews/day or 5 signed-in reviews/day. Upgrade to Pro at $9/month for unlimited AI code reviews, larger inputs, deep scan mode, and privacy controls.",
  openGraph: {
    title: "CheckAICode Pricing — Start Free, Pro from $9/mo",
    description: "AI code review for catching practical bugs, security risks, and AI-generated code mistakes early.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CheckAICode Pricing — Start Free, Pro from $9/mo",
    description: "AI code review for catching practical bugs, security risks, and AI-generated code mistakes early.",
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
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
