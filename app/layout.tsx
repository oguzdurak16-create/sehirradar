import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sehirradar.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Şehir Radar | Bursa kesinti, başvuru ve etkinlikleri", template: "%s | Şehir Radar" },
  description: "Bursa su ve elektrik kesintileri, belediye başvuruları ve ücretsiz etkinlikler tek ekranda.",
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { type: "website", locale: "tr_TR", siteName: "Şehir Radar", title: "Şehir Radar", description: "Şehrinde bugün ne oluyor?", url: siteUrl, images: [{ url: "/og.svg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Şehir Radar", description: "Bursa kesinti, başvuru ve etkinlik radarı", images: ["/og.svg"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><Header />{children}<Footer /></body></html>;
}
