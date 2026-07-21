import fs from "node:fs/promises";
import path from "node:path";

const FILE = path.join(process.cwd(), "data/content.json");
const data = JSON.parse(await fs.readFile(FILE, "utf8"));

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

function provinceOf(item) {
  return item.province || (/bursa|buski|burulas|budo/i.test(`${item.sourceName} ${item.title}`) ? "Bursa" : item.district || "Türkiye");
}

function isGenericUrl(value = "") {
  return /gunlukyoldurum|sondepremler|apiv2\/event|meteouyari|saatlik\.aspx|apigateway\/acikveri\/duyuru|gunluk-su-kesintileri|\/kesintiler\/?$|allannouncements|cancelledvoyages|\/etkinlik\/?$|burulas\.com\.tr\/?$/i.test(value);
}

function keyOf(item) {
  const source = canonical(item.sourceName);
  const province = canonical(provinceOf(item));
  const subtype = canonical(item.subtype || item.type);
  if (item.subtype === "earthquake") {
    return `quake|${source}|${String(item.startsAt || "").slice(0, 19)}|${canonical(item.title)}`;
  }
  if (/weather|meteo/.test(item.subtype)) {
    return `weather|${source}|${subtype}|${province}|${String(item.startsAt || "").slice(0, 13)}`;
  }
  if (item.sourceUrl && !isGenericUrl(item.sourceUrl)) {
    try {
      const url = new URL(item.sourceUrl);
      return `url|${source}|${url.origin}${url.pathname.replace(/\/$/, "")}`;
    } catch {}
  }
  const body = canonical(item.body || item.summary || item.title).slice(0, 420);
  return `body|${source}|${subtype}|${province}|${body}`;
}

function score(item) {
  const status = item.status === "active" || item.status === "open" ? 1000 : item.status === "planned" ? 700 : 0;
  const dates = (item.startsAt ? 80 : 0) + (item.endsAt ? 50 : 0);
  const content = Math.min(String(item.body || "").length, 800);
  return status + dates + content + new Date(item.updatedAt || 0).getTime() / 1e13;
}

function mergeItems(a, b) {
  const winner = score(b) > score(a) ? b : a;
  const other = winner === a ? b : a;
  return {
    ...other,
    ...winner,
    province: winner.province || other.province || provinceOf(winner),
    neighborhoods: [...new Set([...(a.neighborhoods || []), ...(b.neighborhoods || [])])],
    tags: [...new Set([...(a.tags || []), ...(b.tags || [])])],
    updatedAt: new Date(a.updatedAt || 0) > new Date(b.updatedAt || 0) ? a.updatedAt : b.updatedAt,
  };
}

function valid(item) {
  if (!item || !item.id || !item.title || !item.sourceName) return false;
  if (item.sourceName === "Karayolları Genel Müdürlüğü" && /devlet mahallesi.*inonu bulvari.*no\s*:?\s*14|06420\s*cankaya/i.test(item.body || item.title)) return false;
  return true;
}

function dedupe(items) {
  const map = new Map();
  for (const item of items.filter(valid)) {
    const normalized = { ...item, province: item.province || provinceOf(item) };
    const key = keyOf(normalized);
    map.set(key, map.has(key) ? mergeItems(map.get(key), normalized) : normalized);
  }
  return [...map.values()];
}

const before = data.items.length;
data.items = dedupe(data.items || []);
data.reviewQueue = dedupe(data.reviewQueue || []);
data.city = "Türkiye";
data.country = "Türkiye";

const temporary = `${FILE}.tmp`;
await fs.writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`);
await fs.rename(temporary, FILE);
console.log(`Tekilleştirme tamamlandı: ${before} -> ${data.items.length} yayın.`);
