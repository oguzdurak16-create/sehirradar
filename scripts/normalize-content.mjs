import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const FILE = path.join(process.cwd(), "data/content.json");
const NOW = new Date();
const MONTHS = {
  ocak: 1,
  şubat: 2,
  mart: 3,
  nisan: 4,
  mayıs: 5,
  haziran: 6,
  temmuz: 7,
  ağustos: 8,
  eylül: 9,
  ekim: 10,
  kasım: 11,
  aralık: 12,
};

function decode(value = "") {
  const html = `<body>${String(value)}</body>`;
  return cheerio.load(html, null, false).text().replace(/\s+/g, " ").trim();
}

function sentence(value, max = 260) {
  const text = decode(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const boundary = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(";"), cut.lastIndexOf(" "));
  return `${cut.slice(0, boundary > 40 ? boundary : max).trim()}…`;
}

function iso(year, month, day, hour = "09", minute = "00") {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+03:00`;
}

function dateOccurrences(text) {
  const occurrences = [];

  for (const match of text.matchAll(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})/g)) {
    occurrences.push({
      index: match.index ?? 0,
      day: Number(match[1]),
      month: Number(match[2]),
      year: Number(match[3]),
    });
  }

  const longPattern = /(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(20\d{2}))?/giu;
  for (const match of text.matchAll(longPattern)) {
    const monthName = match[2].toLocaleLowerCase("tr-TR");
    occurrences.push({
      index: match.index ?? 0,
      day: Number(match[1]),
      month: MONTHS[monthName],
      year: Number(match[3] || NOW.getFullYear()),
    });
  }

  return occurrences
    .filter((date) => date.month >= 1 && date.month <= 12 && date.day >= 1 && date.day <= 31)
    .sort((a, b) => a.index - b.index)
    .filter((date, index, array) => {
      const previous = array[index - 1];
      return !previous || previous.index !== date.index || previous.day !== date.day || previous.month !== date.month || previous.year !== date.year;
    });
}

function nearestDate(dates, index) {
  if (!dates.length) return null;
  return dates.reduce((nearest, date) => {
    if (!nearest) return date;
    return Math.abs(date.index - index) < Math.abs(nearest.index - index) ? date : nearest;
  }, null);
}

function confidentRange(text, type) {
  const dates = dateOccurrences(text);
  const timeRange = /(?:saat(?:leri)?\s*)?(\d{1,2})[:.](\d{2})\s*(?:-|–|—|ile)\s*(\d{1,2})[:.](\d{2})/giu.exec(text);

  if (timeRange) {
    const date = nearestDate(dates, timeRange.index);
    if (date) {
      let endYear = date.year;
      let endMonth = date.month;
      let endDay = date.day;
      const startMinutes = Number(timeRange[1]) * 60 + Number(timeRange[2]);
      const endMinutes = Number(timeRange[3]) * 60 + Number(timeRange[4]);
      if (endMinutes < startMinutes) {
        const nextDay = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
        endYear = nextDay.getUTCFullYear();
        endMonth = nextDay.getUTCMonth() + 1;
        endDay = nextDay.getUTCDate();
      }
      return {
        start: iso(date.year, date.month, date.day, timeRange[1], timeRange[2]),
        end: iso(endYear, endMonth, endDay, timeRange[3], timeRange[4]),
      };
    }
  }

  if (type === "event" && dates.length >= 2) {
    const start = dates[0];
    const end = dates[1];
    return {
      start: iso(start.year, start.month, start.day),
      end: iso(end.year, end.month, end.day, "23", "59"),
    };
  }

  return null;
}

function normalizedStatus(item) {
  if (item.endsAt && new Date(item.endsAt).getTime() < NOW.getTime()) return "ended";
  if (item.type === "application") return "open";
  if (["event", "alert"].includes(item.type)) return "active";
  return "planned";
}

function normalizeItem(item) {
  const title = decode(item.title);
  const body = decode(item.body || item.summary || title);
  const combined = `${title} ${body}`;
  const range = confidentRange(combined, item.type);
  const normalized = {
    ...item,
    title,
    body,
    summary: sentence(body || title, 260),
    neighborhoods: [...new Set(item.neighborhoods.map(decode).filter(Boolean))],
    tags: [...new Set(item.tags.map(decode).filter(Boolean))],
  };

  if (range) {
    normalized.startsAt = range.start;
    normalized.endsAt = range.end;
  }

  normalized.status = normalizedStatus(normalized);
  return normalized;
}

const data = JSON.parse(await fs.readFile(FILE, "utf8"));
data.items = data.items.map(normalizeItem);
data.reviewQueue = data.reviewQueue.map(normalizeItem);
await fs.writeFile(FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(`İçerik normalizasyonu tamamlandı: ${data.items.length} yayın, ${data.reviewQueue.length} inceleme.`);
