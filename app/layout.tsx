import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";
import "./enhancements.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sehirradar.example";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#061b15",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Şehir Radar | Bursa kesinti, başvuru ve etkinlikleri", template: "%s | Şehir Radar" },
  description: "Bursa su ve elektrik kesintileri, belediye başvuruları, ulaşım duyuruları ve ücretsiz etkinlikler tek ekranda.",
  applicationName: "Şehir Radar",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Şehir Radar",
    title: "Şehir Radar",
    description: "Şehrinde bugün ne oluyor?",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Şehir Radar",
    description: "Bursa kesinti, başvuru ve etkinlik radarı",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><Header />{children}<Footer /></body></html>;
}
