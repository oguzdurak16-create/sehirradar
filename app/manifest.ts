import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Şehir Radar Live",
    short_name: "Radar Live",
    description: "Bursa kesinti, ulaşım, hava, afet, başvuru ve etkinliklerini resmî kaynaklardan takip eden canlı şehir veri merkezi.",
    start_url: "/bugun",
    display: "standalone",
    background_color: "#02070d",
    theme_color: "#02070d",
    lang: "tr",
    orientation: "portrait-primary",
    categories: ["news", "utilities", "local", "weather", "navigation"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/maskable-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
