import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "data/content.json");
const TIMEOUT = Number(process.env.LIVE_SYNC_TIMEOUT_MS || 20000);
const SOURCES = [
  process.env.LIVE_DATA_URL,
  "https://raw.githubusercontent.com/oguzdurak16-create/sehirradar/gh-pages/live-data.json",
  "https://oguzdurak16-create.github.io/sehirradar/live-data.json",
].filter(Boolean);

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, {
      headers: {
        accept: "application/json",
        "cache-control": "no-cache",
        "user-agent": "SehirRadarBuildSync/1.0",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const value = await response.json();
    if (!value || !Array.isArray(value.items) || value.items.length < 5) throw new Error("geçersiz veya boş canlı veri");
    return value;
  } finally {
    clearTimeout(timer);
  }
}

let live = null;
const errors = [];
for (const url of SOURCES) {
  try {
    live = await fetchJson(url);
    console.log(`Canlı veri alındı: ${url} (${live.items.length} kayıt)`);
    break;
  } catch (error) {
    errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (!live) throw new Error(`Türkiye canlı verisi alınamadı. ${errors.join(" | ")}`);

let existing = { reviewQueue: [] };
try {
  existing = JSON.parse(await fs.readFile(TARGET, "utf8"));
} catch {}

const output = {
  ...live,
  city: "Türkiye",
  country: "Türkiye",
  reviewQueue: Array.isArray(live.reviewQueue) ? live.reviewQueue : (existing.reviewQueue || []),
};

const temporary = `${TARGET}.tmp`;
await fs.writeFile(temporary, `${JSON.stringify(output, null, 2)}\n`);
await fs.rename(temporary, TARGET);
console.log(`Build verisi Türkiye akışıyla eşitlendi: ${output.items.length} kayıt.`);
