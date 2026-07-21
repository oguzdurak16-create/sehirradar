import type { RadarData, RadarItem } from "@/lib/types";

const REMOTE_URLS = [
  "https://raw.githubusercontent.com/oguzdurak16-create/sehirradar/gh-pages/live-data.json",
  "https://oguzdurak16-create.github.io/sehirradar/live-data.json",
];

function canonical(value = "") {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\b(turkiye|[a-z]+) yol durumu\s*:?/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function provinceOf(item: RadarItem) {
  return item.province || (/bursa|buski|burulaş|budo/i.test(`${item.sourceName} ${item.title}`) ? "Bursa" : item.district || "Türkiye");
}

function genericUrl(value = "") {
  return /gunlukyoldurum|sondepremler|apiv2\/event|meteouyari|saatlik\.aspx|apigateway\/acikveri\/duyuru|gunluk-su-kesintileri|\/kesintiler\/?$|allannouncements|cancelledvoyages|\/etkinlik\/?$|burulas\.com\.tr\/?$/i.test(value);
}

function itemKey(item: RadarItem) {
  const source = canonical(item.sourceName);
  const province = canonical(provinceOf(item));
  const subtype = canonical(item.subtype || item.type);

  if (item.subtype === "earthquake") {
    return `quake|${source}|${String(item.startsAt || "").slice(0, 19)}|${canonical(item.title)}`;
  }
  if (/weather|meteo/.test(item.subtype)) {
    return `weather|${source}|${subtype}|${province}|${String(item.startsAt || "").slice(0, 13)}`;
  }
  if (item.sourceUrl && !genericUrl(item.sourceUrl)) {
    try {
      const url = new URL(item.sourceUrl);
      return `url|${source}|${url.origin}${url.pathname.replace(/\/$/, "")}`;
    } catch {}
  }
  return `body|${source}|${subtype}|${province}|${canonical(item.body || item.summary || item.title).slice(0, 420)}`;
}

function score(item: RadarItem) {
  const status = item.status === "active" || item.status === "open" ? 1000 : item.status === "planned" ? 700 : 0;
  return status + Math.min(item.body.length, 800) + (item.startsAt ? 80 : 0) + (item.endsAt ? 50 : 0);
}

export function dedupeRadarItems(items: RadarItem[]): RadarItem[] {
  const map = new Map<string, RadarItem>();
  for (const item of items) {
    if (!item?.id || !item.title || !item.sourceName) continue;
    if (item.sourceName === "Karayolları Genel Müdürlüğü" && /devlet mahallesi.*inonu bulvari.*no\s*:?\s*14|06420\s*cankaya/i.test(item.body || item.title)) continue;
    const normalized = { ...item, province: item.province || provinceOf(item) };
    const key = itemKey(normalized);
    const previous = map.get(key);
    if (!previous) {
      map.set(key, normalized);
      continue;
    }
    const winner = score(normalized) > score(previous) ? normalized : previous;
    map.set(key, {
      ...winner,
      neighborhoods: [...new Set([...(previous.neighborhoods || []), ...(normalized.neighborhoods || [])])],
      tags: [...new Set([...(previous.tags || []), ...(normalized.tags || [])])],
    });
  }
  return [...map.values()];
}

export async function fetchLiveRadarData(): Promise<RadarData | null> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const urls = typeof window !== "undefined" && window.location.hostname.endsWith("github.io")
    ? [`${basePath}/live-data.json`, ...REMOTE_URLS]
    : REMOTE_URLS;

  for (const baseUrl of urls) {
    try {
      const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
      const response = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
      if (!response.ok) continue;
      const value = await response.json() as RadarData;
      if (!Array.isArray(value.items) || value.items.length < 5) continue;
      return {
        ...value,
        city: "Türkiye",
        country: "Türkiye",
        items: dedupeRadarItems(value.items),
        reviewQueue: Array.isArray(value.reviewQueue) ? dedupeRadarItems(value.reviewQueue) : [],
      };
    } catch {}
  }
  return null;
}
