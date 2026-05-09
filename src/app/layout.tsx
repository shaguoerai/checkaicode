import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Check AI Code",
  description: "Detect hallucinations, version conflicts & security risks in AI-generated code.",
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
