import rawData from "@/data/content.json";
import type { ContentType, RadarData, RadarItem } from "@/lib/types";

export const data = rawData as RadarData;

export const BURSA_DISTRICTS = [
  { name: "Büyükorhan", slug: "buyukorhan" },
  { name: "Gemlik", slug: "gemlik" },
  { name: "Gürsu", slug: "gursu" },
  { name: "Harmancık", slug: "harmancik" },
  { name: "İnegöl", slug: "inegol" },
  { name: "İznik", slug: "iznik" },
  { name: "Karacabey", slug: "karacabey" },
  { name: "Keles", slug: "keles" },
  { name: "Kestel", slug: "kestel" },
  { name: "Mudanya", slug: "mudanya" },
  { name: "Mustafakemalpaşa", slug: "mustafakemalpasa" },
  { name: "Nilüfer", slug: "nilufer" },
  { name: "Orhaneli", slug: "orhaneli" },
  { name: "Orhangazi", slug: "orhangazi" },
  { name: "Osmangazi", slug: "osmangazi" },
  { name: "Yenişehir", slug: "yenisehir" },
  { name: "Yıldırım", slug: "yildirim" },
] as const;

export type PriorityLevel = "critical" | "high" | "medium" | "low";

function itemTime(item: RadarItem): number {
  return new Date(item.startsAt ?? item.updatedAt).getTime();
}

export function getPriority(item: RadarItem): PriorityLevel {
  const text = `${item.subtype} ${item.title} ${item.summary}`.toLocaleLowerCase("tr-TR");
  if (/earthquake|deprem|ferry-cancelled|iptal sefer|road-closed|yol kapalı|turuncu|kırmızı/.test(text)) return "critical";
  if (/weather-warning|hava dikkat|elektrik|su kesint|ulaşım|road-work|trafik|fırtına|sel|yangın/.test(text)) return "high";
  if (item.type === "application" || item.type === "event" || item.subtype === "weather-forecast") return "medium";
  return "low";
}

export function isFresh(item: RadarItem, hours = 4): boolean {
  return Date.now() - new Date(item.updatedAt).getTime() <= hours * 3600000;
}

export function sortItems(items: RadarItem[]): RadarItem[] {
  const statusWeight: Record<string, number> = { active: 4, open: 4, planned: 3, unknown: 2, ended: 1 };
  const priorityWeight: Record<PriorityLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...items].sort((a, b) => {
    const priorityDifference = priorityWeight[getPriority(b)] - priorityWeight[getPriority(a)];
    const statusDifference = (statusWeight[b.status] ?? 0) - (statusWeight[a.status] ?? 0);
    return priorityDifference || statusDifference || itemTime(b) - itemTime(a);
  });
}

export function getItems(type?: ContentType): RadarItem[] {
  const items = type ? data.items.filter((item) => item.type === type) : data.items;
  return sortItems(items);
}

export function getActiveItems(items = data.items): RadarItem[] {
  return sortItems(items.filter((item) => item.status !== "ended"));
}

export function isActiveToday(item: RadarItem, reference = new Date()): boolean {
  if (item.status === "ended") return false;

  const startOfDay = new Date(reference);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(reference);
  endOfDay.setHours(23, 59, 59, 999);

  const startsAt = item.startsAt ? new Date(item.startsAt) : null;
  const endsAt = item.endsAt ? new Date(item.endsAt) : null;

  if (startsAt && startsAt > endOfDay) return false;
  if (endsAt && endsAt < startOfDay) return false;
  if (!startsAt && !endsAt) return ["active", "open"].includes(item.status);

  return true;
}

export function getTodayItems(reference = new Date()): RadarItem[] {
  return sortItems(data.items.filter((item) => isActiveToday(item, reference)));
}

export function getItemBySlug(slug: string): RadarItem | undefined {
  return data.items.find((item) => item.slug === slug);
}

export function getDistricts(items = data.items): string[] {
  return Array.from(new Set(items.map((item) => item.district).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
}

export function getDistrictBySlug(slug: string) {
  return BURSA_DISTRICTS.find((district) => district.slug === slug);
}

export function getDistrictItems(districtName: string): RadarItem[] {
  return sortItems(
    data.items.filter((item) => item.district === districtName || item.district === "Bursa")
  );
}

export function categoryPath(item: RadarItem): string {
  if (["outage", "transport", "alert"].includes(item.type)) return `/kesintiler/${item.slug}`;
  if (item.type === "application") return `/basvurular/${item.slug}`;
  return `/etkinlikler/${item.slug}`;
}
