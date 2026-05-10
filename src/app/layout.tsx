import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "CheckAICode — AI Code Review: Start Free, Pro from $9/mo",
  description: "Start free with 3 reviews/day. Lock in Pro at $9/month (Launch Special available until June 30). Unlimited AI code reviews, advanced fixes, and team features.",
  openGraph: {
    title: "CheckAICode Pricing — Lock in $9/mo Before June 30",
    description: "AI code review that actually catches bugs. Start free, upgrade when ready. Lock in $9/month for as long as you maintain your subscription.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CheckAICode Pricing — Lock in $9/mo Before June 30",
    description: "AI code review that actually catches bugs. Start free, upgrade when ready. Lock in $9/month for as long as you maintain your subscription.",
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
