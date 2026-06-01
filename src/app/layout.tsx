import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "CheckAICode — AI Code Review: Start Free, Pro from $9/mo",
  description: "Start free with 3 anonymous reviews/day or 5 signed-in reviews/day. New signed-in users get a 24-hour Pro trial. Upgrade to Pro at the $9/month launch price.",
  openGraph: {
    title: "CheckAICode Pricing — Start Free, Pro from $9/mo",
    description: "AI code review for catching practical bugs, security risks, and AI-generated code mistakes early. Start free, then upgrade to the $9/month launch price.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CheckAICode Pricing — Start Free, Pro from $9/mo",
    description: "AI code review for catching practical bugs, security risks, and AI-generated code mistakes early. Start free, then upgrade to the $9/month launch price.",
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
