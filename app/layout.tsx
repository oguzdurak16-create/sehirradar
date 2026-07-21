import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TechRuntime } from "@/components/TechRuntime";
import "./globals.css";
import "./enhancements.css";
import "./editorial-theme.css";
import "./tech-theme.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sehirradar.example").replace(/\/$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#02070d",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Şehir Radar Live | Bursa gerçek zamanlı şehir verisi", template: "%s | Şehir Radar Live" },
  description: "Bursa kesintileri, BUDO seferleri, yol durumu, saatlik hava, afet uyarıları, başvurular ve etkinlikler tek canlı merkezde.",
  applicationName: "Şehir Radar Live",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: { icon: `${basePath}/icon.svg`, apple: `${basePath}/icon.svg` },
  alternates: { canonical: siteUrl, types: { "application/rss+xml": `${siteUrl}/feed.xml` } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Şehir Radar Live",
    title: "Şehir Radar Live",
    description: "Bursa'nın tüm canlı şehir sinyalleri tek merkezde.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Şehir Radar Live",
    description: "Bursa gerçek zamanlı şehir veri merkezi",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" className="dark"><body><TechRuntime /><Header />{children}<Footer /></body></html>;
}
