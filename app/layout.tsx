import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TechRuntime } from "@/components/TechRuntime";
import "./globals.css";
import "./national-theme.css";
import "./mobile-nav-v7.css";

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
  title: { default: "Şehir Radar Türkiye | 81 il canlı şehir verisi", template: "%s | Şehir Radar Türkiye" },
  description: "Türkiye'nin 81 ilindeki hava ve afet uyarıları, depremler, yol durumları, kesintiler, başvurular ve etkinlikler tek canlı merkezde.",
  applicationName: "Şehir Radar Türkiye",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: { icon: `${basePath}/icon.svg`, apple: `${basePath}/icon.svg` },
  alternates: { canonical: siteUrl, types: { "application/rss+xml": `${siteUrl}/feed.xml` } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Şehir Radar Türkiye",
    title: "Şehir Radar Türkiye",
    description: "81 ilin canlı şehir sinyalleri tek merkezde.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Şehir Radar Türkiye",
    description: "Türkiye gerçek zamanlı şehir veri ağı",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" className="dark"><body><TechRuntime /><Header />{children}<Footer /></body></html>;
}
