import type { MetadataRoute } from "next";
import { BURSA_DISTRICTS, categoryPath, data } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sehirradar.example";
  const lastModified = new Date(data.generatedAt);
  const basePages = [
    { path: "", priority: 1, changeFrequency: "hourly" as const },
    { path: "/bugun", priority: 0.95, changeFrequency: "hourly" as const },
    { path: "/kesintiler", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/basvurular", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/etkinlikler", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/kaynaklar", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/hakkinda", priority: 0.5, changeFrequency: "monthly" as const },
  ].map((page) => ({
    url: `${site}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const districtPages = BURSA_DISTRICTS.map((district) => ({
    url: `${site}/bursa/${district.slug}`,
    lastModified,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  const detailPages = data.items.map((item) => ({
    url: `${site}${categoryPath(item)}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "daily" as const,
    priority: item.status === "ended" ? 0.45 : 0.7,
  }));

  return [...basePages, ...districtPages, ...detailPages];
}
