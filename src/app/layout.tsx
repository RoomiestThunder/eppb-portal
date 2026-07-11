import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import AIAssistantWidget from "@/components/AIAssistantWidget";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "pageTitle"),
    description: t(locale, "pageDescription"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header session={session} locale={locale} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-black/10 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 АО «НУХ «Байтерек» — {t(locale, "heroTitle")} ({t(locale, "footerMvpNote")})</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/services" className="whitespace-nowrap hover:text-brand">{t(locale, "catalog")}</Link>
                <Link href="/tools" className="whitespace-nowrap hover:text-brand">{t(locale, "tools")}</Link>
                <Link href="/analytics" className="whitespace-nowrap hover:text-brand">{t(locale, "analytics")}</Link>
                <Link href="/map" className="whitespace-nowrap hover:text-brand">{t(locale, "map")}</Link>
                <Link href="/admin" className="whitespace-nowrap hover:text-brand">{t(locale, "admin")}</Link>
              </div>
            </div>
          </div>
        </footer>
        <AIAssistantWidget locale={locale} />
      </body>
    </html>
  );
}
