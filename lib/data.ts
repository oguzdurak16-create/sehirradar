import rawData from "@/data/content.json";
import type { ContentType, RadarData, RadarItem } from "@/lib/types";

export const data = rawData as RadarData;

export function getItems(type?: ContentType): RadarItem[] {
  const items = type ? data.items.filter((item) => item.type === type) : data.items;
  return [...items].sort((a, b) => {
    const aDate = a.startsAt ?? a.updatedAt;
    const bDate = b.startsAt ?? b.updatedAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}

export function getItemBySlug(slug: string): RadarItem | undefined {
  return data.items.find((item) => item.slug === slug);
}

export function getDistricts(items = data.items): string[] {
  return Array.from(new Set(items.map((item) => item.district).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
}

export function categoryPath(item: RadarItem): string {
  if (item.type === "outage" || item.type === "transport") return `/kesintiler/${item.slug}`;
  if (item.type === "application") return `/basvurular/${item.slug}`;
  return `/etkinlikler/${item.slug}`;
}
