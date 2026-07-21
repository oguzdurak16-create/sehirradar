import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data/content.json");
const HEALTH_FILE = path.join(ROOT, "data/source-health.json");
const MGM_URL = "https://www.mgm.gov.tr/tahmin/saatlik.aspx?m=BURSA";
const NOW = new Date();
const NOW_ISO = NOW.toISOString();
const TIMEOUT = Number(process.env.INGEST_TIMEOUT_MS || 25000);

function clean(value = "") {
  return cheerio.load(`<body>${String(value)}</body>`, null, false).text().replace(/\s+/g, " ").trim();
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
  const boundary = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(";"), cut.lastIndexOf(" "));
  return `${cut.slice(0, boundary > 50 ? boundary : max).trim()}…`;
}

function iso(year, month, day, hour, minute) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+03:00`;
}

function parseDateCell(value) {
  const match = clean(value).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})/);
  return match ? { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) } : null;
}

function parseHourCell(value) {
  const match = clean(value).match(/(\d{1,2})[:.](\d{2})/);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

function parseNumberCell(value) {
  const match = clean(value).match(/-?\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

function rowCells($, table, labelPattern) {
  let result = [];
  table.find("tr").each((_, row) => {
    if (result.length) return;
    const cells = $(row).children("th,td");
    if (!cells.length) return;
    const label = clean(cells.first().text());
    if (!labelPattern.test(label)) return;
    result = cells.slice(1).map((__, cell) => ({
      text: clean($(cell).text()),
      colspan: Math.max(1, Number($(cell).attr("colspan") || 1)),
    })).get();
  });
  return result;
}

async function fetchMgm() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(MGM_URL, {
      headers: {
        "user-agent": "SehirRadarBot/2.1 (+official public city information aggregator)",
        accept: "text/html,*/*;q=0.8",
        "accept-language": "tr-TR,tr;q=0.9",
        "cache-control": "no-cache",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function createWeatherItem({ id, slug, subtype, title, body, startsAt, endsAt, tags }) {
  return {
    id,
    slug,
    type: "alert",
    subtype,
    title,
    summary: sentence(body, 260),
    body: sentence(body, 1000),
    district: "Bursa",
    neighborhoods: [],
    startsAt,
    endsAt,
    status: endsAt && new Date(endsAt).getTime() < NOW.getTime() ? "ended" : "active",
    sourceName: "Meteoroloji Genel Müdürlüğü",
    sourceUrl: MGM_URL,
    sourcePublishedAt: startsAt,
    updatedAt: NOW_ISO,
    risk: "low",
    isFree: null,
    tags,
  };
}

async function parseMgmItems() {
  const html = await fetchMgm();
  const $ = cheerio.load(html);
  const table = $("table").filter((_, element) => /Sıcaklık\s*\(º?C\)|Hissedilen Sıcaklık/i.test(clean($(element).text()))).first();
  if (!table.length) throw new Error("MGM saatlik tahmin tablosu bulunamadı");

  const dateCells = rowCells($, table, /^Tarih$/i);
  const hourCells = rowCells($, table, /^Saat$/i);
  const temperatureCells = rowCells($, table, /^Sıcaklık/i);
  const feelsCells = rowCells($, table, /^Hissedilen Sıcaklık/i);
  const humidityCells = rowCells($, table, /^Nem/i);
  const gustCells = rowCells($, table, /^Rüzgar Hamlesi|^Rüzgâr Hamlesi/i);

  const hours = hourCells.map((cell) => parseHourCell(cell.text)).filter(Boolean);
  const temperatures = temperatureCells.map((cell) => parseNumberCell(cell.text));
  const feels = feelsCells.map((cell) => parseNumberCell(cell.text));
  const humidity = humidityCells.map((cell) => parseNumberCell(cell.text));
  const gusts = gustCells.map((cell) => parseNumberCell(cell.text));
  if (!hours.length || temperatures.length < hours.length) throw new Error("MGM saatlik hücreleri ayrıştırılamadı");

  const expandedDates = [];
  for (const cell of dateCells) {
    const date = parseDateCell(cell.text);
    if (!date) continue;
    for (let index = 0; index < cell.colspan; index += 1) expandedDates.push(date);
  }

  const firstDate = expandedDates[0] || { day: NOW.getDate(), month: NOW.getMonth() + 1, year: NOW.getFullYear() };
  const dates = [];
  let cursor = new Date(Date.UTC(firstDate.year, firstDate.month - 1, firstDate.day));
  let previousHour = hours[0].hour;
  for (let index = 0; index < hours.length; index += 1) {
    if (expandedDates[index]) {
      dates.push(expandedDates[index]);
      cursor = new Date(Date.UTC(expandedDates[index].year, expandedDates[index].month - 1, expandedDates[index].day));
    } else {
      if (index > 0 && hours[index].hour < previousHour) cursor.setUTCDate(cursor.getUTCDate() + 1);
      dates.push({ day: cursor.getUTCDate(), month: cursor.getUTCMonth() + 1, year: cursor.getUTCFullYear() });
    }
    previousHour = hours[index].hour;
  }

  const periods = hours.map((hour, index) => ({
    at: iso(dates[index].year, dates[index].month, dates[index].day, hour.hour, hour.minute),
    temperature: temperatures[index],
    feels: feels[index] ?? temperatures[index],
    humidity: humidity[index] ?? null,
    gust: gusts[index] ?? null,
  })).filter((period) => Number.isFinite(period.temperature)
    && period.temperature >= -50 && period.temperature <= 60
    && (period.humidity == null || (period.humidity >= 0 && period.humidity <= 100))
    && (period.gust == null || (period.gust >= 0 && period.gust <= 250)));

  if (!periods.length) throw new Error("MGM değerleri güvenli aralığın dışında");

  const minTemp = Math.min(...periods.map((period) => period.temperature));
  const maxTemp = Math.max(...periods.map((period) => period.temperature));
  const maxGust = Math.max(...periods.map((period) => period.gust || 0));
  const timeline = periods.map((period) => {
    const label = new Date(period.at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    return `${label}: ${period.temperature}°C, hissedilen ${period.feels}°C${period.humidity == null ? "" : `, nem %${period.humidity}`}${period.gust == null ? "" : `, hamle ${period.gust} km/sa`}`;
  }).join(" | ");

  const items = [createWeatherItem({
    id: `meteoroloji-genel-mudurlugu-${hash("bursa-hourly-weather")}`,
    slug: "bursa-saatlik-hava-tahmini",
    subtype: "weather-forecast",
    title: `Bursa saatlik hava: ${minTemp}°C – ${maxTemp}°C`,
    body: `Meteoroloji Genel Müdürlüğü saatlik tahmini. ${timeline}`,
    startsAt: periods[0].at,
    endsAt: periods.at(-1).at,
    tags: ["weather-forecast", "Bursa", "Meteoroloji Genel Müdürlüğü", "hava durumu", "sıcaklık", "nem", "rüzgâr"],
  })];

  const reasons = [];
  if (maxTemp >= 35) reasons.push(`${maxTemp}°C sıcaklık`);
  if (maxGust >= 45) reasons.push(`${maxGust} km/sa rüzgâr hamlesi`);
  if (minTemp <= 0) reasons.push(`${minTemp}°C düşük sıcaklık`);
  if (reasons.length) {
    items.push(createWeatherItem({
      id: `meteoroloji-genel-mudurlugu-${hash("bursa-hourly-warning")}`,
      slug: "bursa-saatlik-hava-dikkat-seviyesi",
      subtype: "weather-warning",
      title: `Bursa hava dikkat seviyesi: ${reasons.join(", ")}`,
      body: `MGM saatlik tahmininde dikkat gerektiren değerler görüldü: ${reasons.join(", ")}. Güncel tahmin ve resmî uyarılar için kaynak sayfası kontrol edilmelidir.`,
      startsAt: periods[0].at,
      endsAt: periods.at(-1).at,
      tags: ["weather-warning", "Bursa", "Meteoroloji Genel Müdürlüğü", "hava uyarısı", "dikkat"],
    }));
  }
  return items;
}

async function writeJson(file, value) {
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, file);
}

const data = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
const health = JSON.parse(await fs.readFile(HEALTH_FILE, "utf8"));
let weatherItems = [];
let weatherError = null;
try {
  weatherItems = await parseMgmItems();
} catch (error) {
  weatherError = error instanceof Error ? error.message : String(error);
  console.error("MGM düzeltme ayrıştırıcısı başarısız:", weatherError);
}

const cleaned = data.items.filter((item) => {
  if (item.sourceName === "Meteoroloji Genel Müdürlüğü") return weatherError != null;
  if (item.sourceName === "Bursa AFAD" && (item.sourceUrl === "https://bursa.afad.gov.tr/" || item.body.length > 650)) return false;
  return true;
}).map((item) => {
  if (item.sourceName !== "Karayolları Genel Müdürlüğü") return item;
  const stripIndex = (value) => String(value).replace(/^\d+(?=[A-ZÇĞİÖŞÜ])/u, "").trim();
  return {
    ...item,
    title: stripIndex(item.title),
    summary: stripIndex(item.summary),
    body: stripIndex(item.body),
    startsAt: item.updatedAt || NOW_ISO,
    sourcePublishedAt: null,
    status: "active",
  };
});

data.items = [...weatherItems, ...cleaned];

const mgmReport = health.sources.find((source) => source.name === "MGM Bursa saatlik hava");
if (mgmReport) {
  mgmReport.ok = weatherError == null;
  mgmReport.count = weatherItems.length;
  mgmReport.checkedAt = NOW_ISO;
  mgmReport.error = weatherError;
}
const afadReport = health.sources.find((source) => source.name === "Bursa AFAD duyuruları");
if (afadReport) afadReport.count = data.items.filter((item) => item.sourceName === "Bursa AFAD").length;
health.generatedAt = NOW_ISO;
health.healthySources = health.sources.filter((source) => source.ok).length;

await writeJson(DATA_FILE, data);
await writeJson(HEALTH_FILE, health);
console.log(`Canlı kaynak düzeltmesi tamamlandı: ${weatherItems.length} MGM kaydı, ${data.items.length} toplam kayıt.`);
