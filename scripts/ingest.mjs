import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data/content.json");
const HEALTH_FILE = path.join(ROOT, "data/source-health.json");
const TIMEOUT = Number(process.env.INGEST_TIMEOUT_MS || 25000);
const RETRIES = Number(process.env.INGEST_RETRIES || 3);
const NOW = new Date();
const nowIso = NOW.toISOString();
const UA = "SehirRadarBot/1.2 (+official public city information aggregator; contact via site)";

const DISTRICTS = [
  "Nilüfer", "Osmangazi", "Yıldırım", "Mudanya", "Gemlik", "İnegöl",
  "Mustafakemalpaşa", "Karacabey", "Gürsu", "Kestel", "Orhangazi",
  "İznik", "Yenişehir", "Keles", "Orhaneli", "Büyükorhan", "Harmancık",
];
const DISTRICT_PATTERN = DISTRICTS.map((district) => district.toLocaleUpperCase("tr-TR")).join("|");
const MONTHS = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
};

const SOURCES = {
  bursaApi: "https://bapi.bursa.bel.tr/apigateway/acikveri/duyuru",
  bursaEvents: "https://www.bursa.bel.tr/etkinlik",
  buski: "https://www.buski.gov.tr/gunluk-su-kesintileri",
  uedas: ["https://www.uedas.com.tr/tr/kesintiler", "https://www.uedas.com.tr/tr/"],
  burulas: "https://www.burulas.com.tr/",
  bursaValilik: "https://www.bursa.gov.tr/",
};

const risky = /\b(cinayet|ölüm|öldü|yaralı|kaza|şüpheli|gözaltı|tutuk|tecavüz|istismar|sağlık verisi|hasta kimliği|intihar|silah|uyuşturucu|siyasi suçlama|başkan suçladı)\b/i;
const application = /\b(başvuru|destek|kurs|kayıt|burs|yardım|hibe|personel alımı|staj|müzayede|ihale ilanı)\b/i;
const event = /\b(etkinlik|konser|tiyatro|sergi|festival|şenlik|atölye|söyleşi|sinema|gösteri)\b/i;
const transport = /\b(sefer|güzergah|güzergâh|ulaşım|otobüs|metro|tramvay|bursaray|budo|yol kapalı|trafik düzenlemesi)\b/i;

function slugify(value) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}
function clean(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function cleanLines(value = "") {
  return String(value).replace(/\r/g, "").split("\n").map((line) => clean(line)).filter(Boolean).join("\n");
}
function hash(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}
function sentence(text, max = 260) {
  const value = clean(text);
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const point = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(" "));
  return `${cut.slice(0, point > 40 ? point : max).trim()}…`;
}
function districtFrom(text) {
  const normalized = text.toLocaleLowerCase("tr-TR");
  return DISTRICTS.find((district) => normalized.includes(district.toLocaleLowerCase("tr-TR"))) || "Bursa";
}
function isoFromParts(year, month, day, hour = "09", minute = "00") {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+03:00`;
}
function parseTrDate(text) {
  const numeric = text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})(?:\s+(\d{1,2})[:.](\d{2}))?/);
  if (numeric) {
    const [, day, month, year, hour = "09", minute = "00"] = numeric;
    return isoFromParts(year, month, day, hour, minute);
  }
  const long = text.toLocaleLowerCase("tr-TR").match(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(20\d{2}))?(?:[^\d]{0,20}(\d{1,2})[:.](\d{2}))?/i);
  if (!long) return null;
  const [, day, monthName, year = String(NOW.getFullYear()), hour = "09", minute = "00"] = long;
  return isoFromParts(year, MONTHS[monthName], day, hour, minute);
}
function parseDateRange(text) {
  const numeric = [...text.matchAll(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})(?:\s+(\d{1,2})[:.](\d{2}))?/g)];
  if (numeric.length) {
    const toIso = (match) => isoFromParts(match[3], match[2], match[1], match[4] || "09", match[5] || "00");
    return { start: toIso(numeric[0]), end: numeric[1] ? toIso(numeric[1]) : null };
  }
  const start = parseTrDate(text);
  if (!start) return { start: null, end: null };
  const times = [...text.matchAll(/(\d{1,2})[:.](\d{2})/g)];
  if (times.length < 2) return { start, end: null };
  const startDate = new Date(start);
  const end = isoFromParts(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate(), times[1][1], times[1][2]);
  return { start, end };
}
function extractNeighborhoods(text) {
  const names = new Set();
  for (const match of text.matchAll(/([A-ZÇĞİÖŞÜa-zçğıöşü0-9][A-ZÇĞİÖŞÜa-zçğıöşü0-9\s'-]{1,45}?)\s+(?:Mahallesi|Mah\.|Mah\b)/gi)) {
    const value = clean(match[1]).replace(/^(ili|ilçe|ilçesi|bursa)\s+/i, "");
    if (value.length >= 2 && value.length <= 45) names.add(value);
  }
  return [...names].slice(0, 20);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchText(url) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "text/html,application/json;q=0.9,*/*;q=0.7",
          "accept-language": "tr-TR,tr;q=0.9,en;q=0.6",
          "cache-control": "no-cache",
        },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return { text: await response.text(), type: response.headers.get("content-type") || "", url };
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await sleep(700 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}
async function fetchFirst(urls) {
  let lastError;
  for (const url of urls) {
    try {
      return await fetchText(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
function classify(title, body = "") {
  const text = `${title} ${body}`;
  if (/su kesint|içme suyu hattı|su verilemeyecek/i.test(text)) return ["outage", "water"];
  if (/elektrik kesint|enerji verilemeyecek|planlı enerji/i.test(text)) return ["outage", "electricity"];
  if (transport.test(text)) return ["transport", "transport"];
  if (application.test(text)) return ["application", "social-support"];
  if (event.test(text)) return ["event", /sergi/i.test(text) ? "exhibition" : /festival|şenlik/i.test(text) ? "festival" : /atölye/i.test(text) ? "workshop" : "event"];
  return [null, null];
}
function normalizeItem({ title, body, url, sourceName, publishedAt, start, end, type, subtype, district, neighborhoods = [] }) {
  const safeTitle = clean(title);
  const safeBody = clean(body);
  if (!safeTitle || safeTitle.length < 7 || !url) return null;
  const classification = type ? [type, subtype] : classify(safeTitle, safeBody);
  if (!classification[0]) return null;
  const risk = risky.test(`${safeTitle} ${safeBody}`) ? "review" : "low";
  const resolvedDistrict = district || districtFrom(`${safeTitle} ${safeBody}`);
  const dates = { start: start || parseDateRange(`${safeTitle} ${safeBody}`).start, end: end || parseDateRange(`${safeTitle} ${safeBody}`).end };
  let status = classification[0] === "application" ? "open" : classification[0] === "event" ? "active" : "planned";
  if (dates.end && new Date(dates.end).getTime() < NOW.getTime()) status = "ended";
  const id = `${slugify(sourceName)}-${hash(`${url}|${safeTitle}|${resolvedDistrict}`)}`;
  return {
    id,
    slug: slugify(safeTitle) || id,
    type: classification[0],
    subtype: classification[1] || "general",
    title: sentence(safeTitle, 120),
    summary: sentence(safeBody || safeTitle, 260),
    body: sentence(safeBody || safeTitle, 900),
    district: resolvedDistrict,
    neighborhoods: [...new Set([...neighborhoods, ...extractNeighborhoods(safeBody)])].filter(Boolean),
    startsAt: dates.start,
    endsAt: dates.end,
    status,
    sourceName,
    sourceUrl: url,
    sourcePublishedAt: publishedAt || null,
    updatedAt: nowIso,
    risk,
    isFree: /ücretsiz|ücret alınmayacaktır/i.test(`${safeTitle} ${safeBody}`) ? true : null,
    tags: [...new Set([classification[1], resolvedDistrict, sourceName, ...neighborhoods])].filter(Boolean),
  };
}
function flattenJson(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) flattenJson(item, output);
  } else if (value && typeof value === "object") {
    const keys = Object.keys(value).map((key) => key.toLocaleLowerCase("tr-TR"));
    if (keys.some((key) => /baslik|başlık|title|duyuruadi|ad$/.test(key))) output.push(value);
    else for (const child of Object.values(value)) flattenJson(child, output);
  }
  return output;
}
function pick(object, patterns) {
  for (const [key, value] of Object.entries(object)) {
    const normalized = key.toLocaleLowerCase("tr-TR");
    if (patterns.some((pattern) => normalized.includes(pattern)) && value != null) return String(value);
  }
  return "";
}
async function ingestBursaApi() {
  const { text } = await fetchText(SOURCES.bursaApi);
  const json = JSON.parse(text);
  return flattenJson(json).map((record) => {
    const title = pick(record, ["baslik", "başlık", "title", "duyuruadi", "adi"]);
    const body = pick(record, ["aciklama", "açıklama", "icerik", "içerik", "description", "ozet", "özet"]);
    let url = pick(record, ["url", "link"]);
    if (url && !url.startsWith("http")) url = `https://www.bursa.bel.tr${url.startsWith("/") ? "" : "/"}${url}`;
    return normalizeItem({
      title,
      body,
      url: url || SOURCES.bursaApi,
      sourceName: "Bursa Büyükşehir Belediyesi",
      publishedAt: parseTrDate(pick(record, ["tarih", "date"])) || null,
    });
  }).filter(Boolean);
}
async function ingestEventHtml() {
  const { text } = await fetchText(SOURCES.bursaEvents);
  const $ = cheerio.load(text);
  const results = [];
  const seen = new Set();
  $("a[href*='/etkinlik/']").each((_, anchor) => {
    const element = $(anchor);
    const href = element.attr("href");
    if (!href) return;
    const block = element.closest("article,li,.item,.card,.event,.etkinlik").length ? element.closest("article,li,.item,.card,.event,.etkinlik") : element.parent();
    const title = clean(element.find("h1,h2,h3,h4,h5").first().text() || element.attr("title") || element.text());
    const body = clean(block.text());
    const url = new URL(href, SOURCES.bursaEvents).href;
    if (seen.has(url) || title.length < 7) return;
    seen.add(url);
    const range = parseDateRange(body);
    const item = normalizeItem({ title, body, url, sourceName: "Bursa Büyükşehir Belediyesi", start: range.start, end: range.end, type: "event", subtype: /sergi/i.test(body) ? "exhibition" : /festival|şenlik/i.test(body) ? "festival" : /atölye/i.test(body) ? "workshop" : "event" });
    if (item) results.push(item);
  });
  return results;
}
async function ingestBuski() {
  const { text } = await fetchText(SOURCES.buski);
  const $ = cheerio.load(text);
  const body = cleanLines($("body").text());
  const chunks = body.split(new RegExp(`(?=\\b(?:${DISTRICT_PATTERN})\\b)`, "giu")).filter((chunk) => /Planlanan Başlangıç Tarihi|kesinti|Kesildi/i.test(chunk));
  const results = [];
  for (const chunk of chunks.slice(0, 80)) {
    const district = districtFrom(chunk);
    const startMatch = chunk.match(/Planlanan Başlangıç Tarihi:\s*([^\n]+)/i);
    const endMatch = chunk.match(/Planlanan Bitiş Tarihi:\s*([^\n]+)/i);
    const descriptionMatch = chunk.match(/Açıklama:\s*([\s\S]+)/i);
    const heading = chunk.split("\n").slice(0, 5).filter((line) => !/Kesildi|Planlanan|Kesim Tarihi/i.test(line));
    const neighborhood = heading.find((line) => line.toLocaleUpperCase("tr-TR") !== district.toLocaleUpperCase("tr-TR") && line.length <= 50) || "";
    const bodyText = clean(descriptionMatch?.[1] || chunk);
    const item = normalizeItem({
      title: `${district}${neighborhood ? ` ${neighborhood}` : ""} su kesintisi`,
      body: bodyText,
      url: SOURCES.buski,
      sourceName: "BUSKİ",
      start: startMatch ? parseTrDate(startMatch[1]) : null,
      end: endMatch ? parseTrDate(endMatch[1]) : null,
      type: "outage",
      subtype: "water",
      district,
      neighborhoods: neighborhood ? [clean(neighborhood)] : [],
    });
    if (item) results.push(item);
  }
  return results;
}
async function ingestUedas() {
  const { text, url } = await fetchFirst(SOURCES.uedas);
  const $ = cheerio.load(text);
  const body = clean($("body").text());
  const matches = body.match(/\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s+20\d{2})?[^.]{0,120}\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}[^.]{20,850}?enerji verilemeyecektir\.?/gi) || [];
  return matches.filter((chunk) => /BURSA/i.test(chunk)).slice(0, 100).map((chunk) => {
    const district = districtFrom(chunk);
    const date = parseTrDate(chunk);
    const times = [...chunk.matchAll(/(\d{1,2})[:.](\d{2})/g)];
    let end = null;
    if (date && times.length >= 2) {
      const parsed = new Date(date);
      end = isoFromParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate(), times[1][1], times[1][2]);
    }
    return normalizeItem({
      title: `${district} planlı elektrik kesintisi`,
      body: chunk,
      url,
      sourceName: "UEDAŞ",
      start: date,
      end,
      type: "outage",
      subtype: "electricity",
      district,
      neighborhoods: extractNeighborhoods(chunk),
    });
  }).filter(Boolean);
}
async function ingestBurulas() {
  const { text } = await fetchText(SOURCES.burulas);
  const $ = cheerio.load(text);
  const results = [];
  const seen = new Set();
  $("a").each((_, anchor) => {
    const element = $(anchor);
    const block = element.closest("article,li,.card,.item,.news,.duyuru").length ? element.closest("article,li,.card,.item,.news,.duyuru") : element.parent();
    const body = clean(block.text());
    if (body.length < 25 || !transport.test(body)) return;
    const href = element.attr("href") || SOURCES.burulas;
    const url = new URL(href, SOURCES.burulas).href;
    if (seen.has(url)) return;
    seen.add(url);
    const title = sentence(clean(element.text()) || body, 120);
    const item = normalizeItem({ title, body, url, sourceName: "BURULAŞ", type: "transport", subtype: "transport" });
    if (item) results.push(item);
  });
  return results.slice(0, 60);
}
async function ingestBursaValilik() {
  const { text } = await fetchText(SOURCES.bursaValilik);
  const $ = cheerio.load(text);
  const results = [];
  const seen = new Set();
  $("a[href]").each((_, anchor) => {
    const element = $(anchor);
    const title = clean(element.attr("title") || element.find("h2,h3,h4,h5,strong").first().text() || element.text());
    if (title.length < 8 || !classify(title, title)[0]) return;
    const href = element.attr("href");
    if (!href || href.startsWith("javascript:")) return;
    const url = new URL(href, SOURCES.bursaValilik).href;
    if (seen.has(url) || !url.includes("bursa.gov.tr")) return;
    seen.add(url);
    const block = element.closest("article,li,.item,.card,.duyuru").length ? element.closest("article,li,.item,.card,.duyuru") : element.parent();
    const body = clean(block.text()) || title;
    const item = normalizeItem({ title, body, url, sourceName: "T.C. Bursa Valiliği", publishedAt: parseTrDate(body) });
    if (item) results.push(item);
  });
  return results.slice(0, 50);
}
function unique(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.type}|${slugify(item.title)}|${item.district}`;
    const previous = map.get(key);
    if (!previous || item.body.length > previous.body.length) map.set(key, item);
  }
  return [...map.values()];
}
function carryStatus(item) {
  if (item.endsAt && new Date(item.endsAt).getTime() < NOW.getTime()) return { ...item, status: "ended" };
  return item;
}
function signature(item) {
  const { updatedAt, ...stable } = item;
  return JSON.stringify(stable);
}
function preserveDays(item) {
  if (item.type === "application") return 30;
  if (item.type === "event") return 10;
  return 3;
}
async function writeJsonAtomic(file, value) {
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temp, file);
}

async function main() {
  const old = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  const jobs = [
    { name: "Bursa Büyükşehir Belediyesi duyuruları", sourceName: "Bursa Büyükşehir Belediyesi", url: SOURCES.bursaApi, run: ingestBursaApi },
    { name: "Bursa Büyükşehir Belediyesi etkinlikleri", sourceName: "Bursa Büyükşehir Belediyesi", url: SOURCES.bursaEvents, run: ingestEventHtml },
    { name: "BUSKİ su kesintileri", sourceName: "BUSKİ", url: SOURCES.buski, run: ingestBuski },
    { name: "UEDAŞ elektrik kesintileri", sourceName: "UEDAŞ", url: SOURCES.uedas[0], run: ingestUedas },
    { name: "BURULAŞ ulaşım duyuruları", sourceName: "BURULAŞ", url: SOURCES.burulas, run: ingestBurulas },
    { name: "Bursa Valiliği duyuruları", sourceName: "T.C. Bursa Valiliği", url: SOURCES.bursaValilik, run: ingestBursaValilik },
  ];

  const collected = [];
  const sourceHealth = [];
  const successfulNames = new Set();
  for (const job of jobs) {
    const startedAt = Date.now();
    try {
      const items = await job.run();
      collected.push(...items);
      successfulNames.add(job.sourceName);
      sourceHealth.push({ name: job.name, sourceName: job.sourceName, url: job.url, ok: true, count: items.length, durationMs: Date.now() - startedAt, checkedAt: nowIso, error: null });
      console.log(`${job.name}: ${items.length}`);
    } catch (error) {
      sourceHealth.push({ name: job.name, sourceName: job.sourceName, url: job.url, ok: false, count: 0, durationMs: Date.now() - startedAt, checkedAt: nowIso, error: error instanceof Error ? error.message : String(error) });
      console.error(`${job.name} başarısız:`, error instanceof Error ? error.message : error);
    }
  }

  await writeJsonAtomic(HEALTH_FILE, {
    generatedAt: nowIso,
    totalSources: jobs.length,
    healthySources: sourceHealth.filter((source) => source.ok).length,
    sources: sourceHealth,
  });

  if (!successfulNames.size) throw new Error("Hiçbir resmî kaynak okunamadı; mevcut yayın verisi korunuyor.");

  const fresh = unique(collected).map(carryStatus);
  const oldMap = new Map(old.items.map((item) => [item.id, item]));
  const refreshed = fresh.map((item) => {
    const previous = oldMap.get(item.id);
    if (!previous) return item;
    return signature(previous) === signature(item) ? { ...item, updatedAt: previous.updatedAt } : item;
  });
  const freshIds = new Set(refreshed.map((item) => item.id));
  const preserved = old.items.filter((item) => !freshIds.has(item.id)).flatMap((item) => {
    if (!successfulNames.has(item.sourceName)) return [carryStatus(item)];
    if (item.endsAt && new Date(item.endsAt).getTime() >= NOW.getTime()) return [carryStatus(item)];
    const ageDays = (NOW.getTime() - new Date(item.updatedAt).getTime()) / 86400000;
    if (ageDays <= preserveDays(item)) return [carryStatus(item)];
    return [{ ...item, status: "ended" }];
  });
  const merged = unique([...refreshed, ...preserved]).filter((item) => {
    if (item.status !== "ended") return true;
    const anchor = item.endsAt || item.updatedAt;
    return NOW.getTime() - new Date(anchor).getTime() < 86400000 * 60;
  });
  const published = merged.filter((item) => item.risk === "low");
  const review = merged.filter((item) => item.risk === "review");
  const output = { generatedAt: nowIso, city: "Bursa", items: published, reviewQueue: review };
  await writeJsonAtomic(DATA_FILE, output);
  console.log(`Tamamlandı: ${published.length} yayın, ${review.length} inceleme, ${successfulNames.size}/${jobs.length} kaynak başarılı.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
