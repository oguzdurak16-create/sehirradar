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
const NOW_ISO = NOW.toISOString();
const USER_AGENT = "SehirRadarBot/2.0 (+official public city information aggregator)";

const SOURCES = {
  budoCancelled: "https://budo.burulas.com.tr/tr/Budo/CancelledVoyages",
  budoAnnouncements: "https://budo.burulas.com.tr/tr/Budo/AllAnnouncements",
  mgmHourly: "https://www.mgm.gov.tr/tahmin/saatlik.aspx?m=BURSA",
  kgmRoads: "https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/YolDanisma/GunlukYolDurumuBulteni.aspx",
  bursaAfad: "https://bursa.afad.gov.tr/duyurular",
  afadEarthquakes: "https://deprem.afad.gov.tr/sondepremler",
};

const MONTHS = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
  oca: 1, şub: 2, mar: 3, nis: 4, may: 5, haz: 6,
  tem: 7, ağu: 8, eyl: 9, eki: 10, kas: 11, ara: 12,
};

const DISTRICTS = [
  "Nilüfer", "Osmangazi", "Yıldırım", "Mudanya", "Gemlik", "İnegöl",
  "Mustafakemalpaşa", "Karacabey", "Gürsu", "Kestel", "Orhangazi",
  "İznik", "Yenişehir", "Keles", "Orhaneli", "Büyükorhan", "Harmancık",
];

function clean(value = "") {
  return cheerio.load(`<body>${String(value)}</body>`, null, false).text().replace(/\s+/g, " ").trim();
}

function cleanLines(value = "") {
  return String(value).replace(/\r/g, "").split("\n").map(clean).filter(Boolean);
}

function slugify(value) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function hash(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function sentence(value, max = 260) {
  const text = clean(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const point = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(";"), cut.lastIndexOf(" "));
  return `${cut.slice(0, point > 50 ? point : max).trim()}…`;
}

function districtFrom(text) {
  const normalized = text.toLocaleLowerCase("tr-TR");
  return DISTRICTS.find((district) => normalized.includes(district.toLocaleLowerCase("tr-TR"))) || "Bursa";
}

function iso(year, month, day, hour = "09", minute = "00") {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+03:00`;
}

function parseDate(text) {
  const numeric = text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})(?:[^\d]{0,12}(\d{1,2})[:.](\d{2}))?/);
  if (numeric) return iso(numeric[3], numeric[2], numeric[1], numeric[4] || "09", numeric[5] || "00");
  const long = text.toLocaleLowerCase("tr-TR").match(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|oca|şub|mar|nis|may|haz|tem|ağu|eyl|eki|kas|ara)(?:\s+(20\d{2}))?(?:[^\d]{0,12}(\d{1,2})[:.](\d{2}))?/i);
  if (!long) return null;
  return iso(long[3] || NOW.getFullYear(), MONTHS[long[2]], long[1], long[4] || "09", long[5] || "00");
}

function parseRange(text) {
  const numeric = [...text.matchAll(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})(?:[^\d]{0,10}(\d{1,2})[:.](\d{2}))?/g)];
  if (numeric.length) {
    const convert = (match, hour = "09", minute = "00") => iso(match[3], match[2], match[1], match[4] || hour, match[5] || minute);
    return { start: convert(numeric[0]), end: numeric[1] ? convert(numeric[1], "23", "59") : null };
  }
  const start = parseDate(text);
  if (!start) return { start: null, end: null };
  const times = [...text.matchAll(/(\d{1,2})[:.](\d{2})/g)];
  if (times.length < 2) return { start, end: null };
  const parsed = new Date(start);
  return {
    start: iso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate(), times[0][1], times[0][2]),
    end: iso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate(), times[1][1], times[1][2]),
  };
}

function statusFrom(end, fallback = "active") {
  return end && new Date(end).getTime() < NOW.getTime() ? "ended" : fallback;
}

function createItem({ title, body, url, sourceName, type = "alert", subtype, district = "Bursa", startsAt = null, endsAt = null, tags = [] }) {
  const safeTitle = sentence(title, 120);
  const safeBody = sentence(body || title, 1000);
  if (safeTitle.length < 8 || safeBody.length < 20) return null;
  const id = `${slugify(sourceName)}-${hash(`${url}|${safeTitle}|${district}`)}`;
  return {
    id,
    slug: slugify(safeTitle) || id,
    type,
    subtype,
    title: safeTitle,
    summary: sentence(safeBody, 260),
    body: safeBody,
    district,
    neighborhoods: [],
    startsAt,
    endsAt,
    status: statusFrom(endsAt, type === "transport" ? "planned" : "active"),
    sourceName,
    sourceUrl: url,
    sourcePublishedAt: startsAt,
    updatedAt: NOW_ISO,
    risk: "low",
    isFree: null,
    tags: [...new Set([subtype, district, sourceName, ...tags])].filter(Boolean),
  };
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
          "user-agent": USER_AGENT,
          accept: "text/html,application/json;q=0.9,*/*;q=0.7",
          "accept-language": "tr-TR,tr;q=0.9",
          "cache-control": "no-cache",
        },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await sleep(attempt * 700);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function withinDays(date, pastDays = 2, futureDays = 45) {
  if (!date) return false;
  const delta = new Date(date).getTime() - NOW.getTime();
  return delta >= -pastDays * 86400000 && delta <= futureDays * 86400000;
}

async function ingestBudoCancelled() {
  const text = await fetchText(SOURCES.budoCancelled);
  const $ = cheerio.load(text);
  const pageText = clean($("body").text());
  if (/İptal Sefer Bulunamadı/i.test(pageText)) return [];
  const candidates = [];
  $("tbody tr,.cancelled-voyage,.voyage,.card,.list-group-item").each((_, element) => {
    const value = clean($(element).text());
    if (value.length >= 20 && /\d{1,2}[:.]\d{2}|Mudanya|Kabataş/i.test(value)) candidates.push(value);
  });
  if (!candidates.length) {
    const section = pageText.split(/İptal Seferler/i).slice(1).join(" ");
    candidates.push(...section.split(/(?=\d{1,2}[.\/-]\d{1,2})/).filter((value) => /Mudanya|Kabataş|Bursa|İstanbul/i.test(value)));
  }
  return [...new Set(candidates)].slice(0, 30).map((body) => {
    const range = parseRange(body);
    return createItem({
      title: `BUDO iptal sefer: ${sentence(body, 82)}`,
      body,
      url: SOURCES.budoCancelled,
      sourceName: "BUDO",
      type: "transport",
      subtype: "ferry-cancelled",
      district: "Mudanya",
      startsAt: range.start,
      endsAt: range.end,
      tags: ["deniz ulaşımı", "iptal sefer", "Mudanya", "Kabataş"],
    });
  }).filter(Boolean);
}

async function ingestBudoAnnouncements() {
  const text = await fetchText(SOURCES.budoAnnouncements);
  const $ = cheerio.load(text);
  const items = [];
  $("h2,h3,h4").each((_, heading) => {
    const title = clean($(heading).text());
    if (!/sefer|duyuru|hava|iptal|ek/i.test(title)) return;
    let body = clean($(heading).nextUntil("h2,h3,h4,hr").text());
    if (!body) body = clean($(heading).parent().text()).replace(title, "").trim();
    const date = parseDate(body);
    if (!withinDays(date, 2, 45)) return;
    const range = parseRange(body);
    const cancelled = /iptal/i.test(`${title} ${body}`);
    const item = createItem({
      title: `BUDO ${title}`,
      body,
      url: SOURCES.budoAnnouncements,
      sourceName: "BUDO",
      type: "transport",
      subtype: cancelled ? "ferry-cancelled" : "ferry-service",
      district: "Mudanya",
      startsAt: range.start,
      endsAt: range.end,
      tags: ["deniz ulaşımı", cancelled ? "iptal sefer" : "ek sefer"],
    });
    if (item) items.push(item);
  });
  return items;
}

function numbersAfter(text, label, nextLabel) {
  const pattern = new RegExp(`${label}\\s+([\\s\\S]*?)${nextLabel}`, "i");
  const match = text.match(pattern);
  return match ? [...match[1].matchAll(/-?\d+(?:[.,]\d+)?/g)].map((value) => Number(value[0].replace(",", "."))) : [];
}

async function ingestMgmHourly() {
  const text = await fetchText(SOURCES.mgmHourly);
  const $ = cheerio.load(text);
  const body = clean($("body").text());
  const dateBlock = body.match(/Tarih\s+([\d.\s]+?)\s+Saat/i)?.[1] || "";
  const dates = [...dateBlock.matchAll(/(\d{1,2})\.(\d{1,2})\.(20\d{2})/g)].map((match) => ({ day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) }));
  const hourBlock = body.match(/Saat\s+([\d:\s]+?)\s+Beklenen Hadise/i)?.[1] || "";
  const hours = [...hourBlock.matchAll(/(\d{1,2}):(\d{2})/g)].map((match) => ({ hour: Number(match[1]), minute: Number(match[2]) }));
  const temperatures = numbersAfter(body, "Sıcaklık \\(ºC\\)", "Hissedilen");
  const feels = numbersAfter(body, "Hissedilen Sıcaklık \\(ºC\\)", "Nem");
  const humidity = numbersAfter(body, "Nem \\(\\%\\)", "Rüzgar Yön");
  const gusts = numbersAfter(body, "Rüzgar Hamlesi \\(km/sa\\)", "Güncelleme");
  if (!dates.length || !hours.length || !temperatures.length) throw new Error("MGM saatlik tablo ayrıştırılamadı");

  const periods = [];
  let dateIndex = 0;
  let previousHour = hours[0].hour;
  for (let index = 0; index < Math.min(hours.length, temperatures.length); index += 1) {
    const current = hours[index];
    if (index > 0 && current.hour < previousHour && dateIndex < dates.length - 1) dateIndex += 1;
    previousHour = current.hour;
    const date = dates[Math.min(dateIndex, dates.length - 1)];
    periods.push({
      at: iso(date.year, date.month, date.day, current.hour, current.minute),
      temperature: temperatures[index],
      feels: feels[index] ?? temperatures[index],
      humidity: humidity[index] ?? null,
      gust: gusts[index] ?? null,
    });
  }

  const minTemp = Math.min(...periods.map((period) => period.temperature));
  const maxTemp = Math.max(...periods.map((period) => period.temperature));
  const maxGust = Math.max(...periods.map((period) => period.gust || 0));
  const timeline = periods.map((period) => `${new Date(period.at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}: ${period.temperature}°C, hissedilen ${period.feels}°C${period.humidity == null ? "" : `, nem %${period.humidity}`}${period.gust == null ? "" : `, hamle ${period.gust} km/sa`}`).join(" | ");
  const items = [createItem({
    title: `Bursa saatlik hava: ${minTemp}°C – ${maxTemp}°C`,
    body: `Meteoroloji Genel Müdürlüğü saatlik tahmini. ${timeline}`,
    url: SOURCES.mgmHourly,
    sourceName: "Meteoroloji Genel Müdürlüğü",
    type: "alert",
    subtype: "weather-forecast",
    district: "Bursa",
    startsAt: periods[0].at,
    endsAt: periods.at(-1).at,
    tags: ["hava durumu", "sıcaklık", "nem", "rüzgâr"],
  })].filter(Boolean);

  if (maxTemp >= 35 || maxGust >= 45 || minTemp <= 0) {
    const reasons = [];
    if (maxTemp >= 35) reasons.push(`${maxTemp}°C sıcaklık`);
    if (maxGust >= 45) reasons.push(`${maxGust} km/sa rüzgâr hamlesi`);
    if (minTemp <= 0) reasons.push(`${minTemp}°C düşük sıcaklık`);
    items.push(createItem({
      title: `Bursa hava dikkat seviyesi: ${reasons.join(", ")}`,
      body: `MGM saatlik tahmininde dikkat gerektiren değerler görüldü: ${reasons.join(", ")}. Güncel tahmin ve resmî uyarılar için kaynak sayfası kontrol edilmelidir.`,
      url: SOURCES.mgmHourly,
      sourceName: "Meteoroloji Genel Müdürlüğü",
      type: "alert",
      subtype: "weather-warning",
      district: "Bursa",
      startsAt: periods[0].at,
      endsAt: periods.at(-1).at,
      tags: ["hava uyarısı", "dikkat"],
    }));
  }
  return items.filter(Boolean);
}

async function ingestKgmRoads() {
  const text = await fetchText(SOURCES.kgmRoads);
  const $ = cheerio.load(text);
  const candidates = [];
  $("tr,li,p").each((_, element) => {
    const value = clean($(element).text());
    if (value.length > 55 && /Bursa|Mudanya|Gemlik|Orhangazi|İznik|İnegöl|Karacabey|Mustafakemalpaşa|Yalova-Bursa|Bursa-Yalova|Bursa-Ankara|Bursa-Balıkesir/i.test(value) && /yol|otoyol|trafik|şerit|ulaşım|çalışma/i.test(value)) candidates.push(value);
  });
  if (!candidates.length) {
    for (const line of cleanLines($("body").text())) {
      if (line.length > 70 && /Bursa|Mudanya|Gemlik|Orhangazi|İznik|İnegöl|Yalova-Bursa|Bursa-Yalova/i.test(line)) candidates.push(line);
    }
  }
  return [...new Set(candidates)].slice(0, 25).map((body) => {
    const district = districtFrom(body);
    const range = parseRange(body);
    return createItem({
      title: `${district} yol durumu: ${sentence(body.replace(/^\d+\s*/, ""), 82)}`,
      body,
      url: SOURCES.kgmRoads,
      sourceName: "Karayolları Genel Müdürlüğü",
      type: "transport",
      subtype: /kapalı|kapatıl/i.test(body) ? "road-closed" : "road-work",
      district,
      startsAt: range.start || NOW_ISO,
      endsAt: range.end,
      tags: ["yol durumu", "trafik", "karayolu"],
    });
  }).filter(Boolean);
}

async function ingestBursaAfad() {
  const text = await fetchText(SOURCES.bursaAfad);
  const $ = cheerio.load(text);
  const items = [];
  $("a[href]").each((_, anchor) => {
    const element = $(anchor);
    const title = clean(element.text());
    const href = element.attr("href");
    if (!href || title.length < 8 || !/afet|deprem|sel|yangın|fırtına|heyelan|uyarı|tatbikat/i.test(title)) return;
    const block = element.closest("li,article,.item,.card");
    const body = clean(block.length ? block.text() : element.parent().text());
    const date = parseDate(body);
    if (!withinDays(date, 7, 90)) return;
    const item = createItem({
      title: `Bursa AFAD: ${title}`,
      body: body || title,
      url: new URL(href, SOURCES.bursaAfad).href,
      sourceName: "Bursa AFAD",
      type: "alert",
      subtype: "afad-announcement",
      district: "Bursa",
      startsAt: date,
      tags: ["afet", "acil durum", "resmî duyuru"],
    });
    if (item) items.push(item);
  });
  return items.slice(0, 20);
}

async function ingestAfadEarthquakes() {
  const text = await fetchText(SOURCES.afadEarthquakes);
  const $ = cheerio.load(text);
  const items = [];
  $("table tbody tr,tr").each((_, row) => {
    const cells = $(row).find("td").map((__, cell) => clean($(cell).text())).get();
    if (cells.length < 7) return;
    const [dateText, latText, lonText, depthText, magnitudeType, magnitudeText, place] = cells;
    const latitude = Number(latText.replace(",", "."));
    const longitude = Number(lonText.replace(",", "."));
    const magnitude = Number(magnitudeText.replace(",", "."));
    const occurredAt = dateText ? `${dateText.replace(" ", "T")}+03:00` : null;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(magnitude) || !occurredAt) return;
    const inBursaRegion = latitude >= 39.45 && latitude <= 40.85 && longitude >= 27.25 && longitude <= 30.15;
    const recent = NOW.getTime() - new Date(occurredAt).getTime() <= 36 * 3600000;
    if (!inBursaRegion || !recent || magnitude < 2.5) return;
    const item = createItem({
      title: `M${magnitude.toFixed(1)} ${place} depremi`,
      body: `AFAD kayıtlarına göre ${place} çevresinde ${magnitudeType || "ML"} ${magnitude.toFixed(1)} büyüklüğünde, ${depthText} km derinlikte deprem kaydedildi.`,
      url: SOURCES.afadEarthquakes,
      sourceName: "AFAD Son Depremler",
      type: "alert",
      subtype: "earthquake",
      district: districtFrom(place),
      startsAt: occurredAt,
      endsAt: occurredAt,
      tags: ["deprem", `M${magnitude.toFixed(1)}`, place],
    });
    if (item) items.push(item);
  });
  return items.slice(0, 15);
}

function stableSignature(item) {
  const { updatedAt, ...stable } = item;
  return JSON.stringify(stable);
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

async function writeJson(file, value) {
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temp, file);
}

async function main() {
  const data = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  const health = JSON.parse(await fs.readFile(HEALTH_FILE, "utf8"));
  const jobs = [
    { name: "BUDO iptal seferleri", sourceName: "BUDO", url: SOURCES.budoCancelled, run: ingestBudoCancelled },
    { name: "BUDO duyuru ve ek seferleri", sourceName: "BUDO", url: SOURCES.budoAnnouncements, run: ingestBudoAnnouncements },
    { name: "MGM Bursa saatlik hava", sourceName: "Meteoroloji Genel Müdürlüğü", url: SOURCES.mgmHourly, run: ingestMgmHourly },
    { name: "KGM Bursa yol durumu", sourceName: "Karayolları Genel Müdürlüğü", url: SOURCES.kgmRoads, run: ingestKgmRoads },
    { name: "Bursa AFAD duyuruları", sourceName: "Bursa AFAD", url: SOURCES.bursaAfad, run: ingestBursaAfad },
    { name: "AFAD Bursa bölgesi depremleri", sourceName: "AFAD Son Depremler", url: SOURCES.afadEarthquakes, run: ingestAfadEarthquakes },
  ];

  const fresh = [];
  const reports = [];
  const successfulNames = new Set();
  for (const job of jobs) {
    const started = Date.now();
    try {
      const items = await job.run();
      fresh.push(...items);
      successfulNames.add(job.sourceName);
      reports.push({ name: job.name, sourceName: job.sourceName, url: job.url, ok: true, count: items.length, durationMs: Date.now() - started, checkedAt: NOW_ISO, error: null });
      console.log(`${job.name}: ${items.length}`);
    } catch (error) {
      reports.push({ name: job.name, sourceName: job.sourceName, url: job.url, ok: false, count: 0, durationMs: Date.now() - started, checkedAt: NOW_ISO, error: error instanceof Error ? error.message : String(error) });
      console.error(`${job.name} başarısız:`, error instanceof Error ? error.message : error);
    }
  }

  const managed = new Set(jobs.map((job) => job.sourceName));
  const oldById = new Map(data.items.map((item) => [item.id, item]));
  const refreshed = unique(fresh).map((item) => {
    const previous = oldById.get(item.id);
    return previous && stableSignature(previous) === stableSignature(item) ? { ...item, updatedAt: previous.updatedAt } : item;
  });
  const freshIds = new Set(refreshed.map((item) => item.id));
  const retained = data.items.filter((item) => {
    if (!managed.has(item.sourceName)) return true;
    if (freshIds.has(item.id)) return false;
    if (!successfulNames.has(item.sourceName)) return true;
    const ageHours = (NOW.getTime() - new Date(item.updatedAt).getTime()) / 3600000;
    return item.status !== "ended" && ageHours <= 48;
  });
  data.items = unique([...refreshed, ...retained]);
  data.generatedAt = NOW_ISO;

  const keptHealth = health.sources.filter((source) => !jobs.some((job) => job.name === source.name));
  health.generatedAt = NOW_ISO;
  health.sources = [...keptHealth, ...reports];
  health.totalSources = health.sources.length;
  health.healthySources = health.sources.filter((source) => source.ok).length;

  await writeJson(DATA_FILE, data);
  await writeJson(HEALTH_FILE, health);
  console.log(`Genişletilmiş tarama tamamlandı: ${refreshed.length} yeni/güncel kayıt, ${health.healthySources}/${health.totalSources} kaynak sağlıklı.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
