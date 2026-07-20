import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Şehir Radar",
    short_name: "Şehir Radar",
    description: "Bursa kesinti, başvuru ve etkinlik radarı.",
    start_url: "/bugun",
    display: "standalone",
    background_color: "#f3f7f4",
    theme_color: "#061b15",
    lang: "tr",
    categories: ["news", "utilities", "local"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/maskable-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
