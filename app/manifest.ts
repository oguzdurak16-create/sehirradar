import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    name: "Şehir Radar Live",
    short_name: "Radar Live",
    description: "Bursa kesinti, ulaşım, hava, afet, başvuru ve etkinliklerini resmî kaynaklardan takip eden canlı şehir veri merkezi.",
    start_url: `${basePath}/bugun`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#02070d",
    theme_color: "#02070d",
    lang: "tr",
    orientation: "portrait-primary",
    categories: ["news", "utilities", "local", "weather", "navigation"],
    icons: [
      { src: `${basePath}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${basePath}/maskable-icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
