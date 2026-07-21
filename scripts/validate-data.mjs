import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const item = z.object({
  id: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(["outage", "application", "event", "transport", "alert"]),
  subtype: z.string(),
  title: z.string().min(8),
  summary: z.string().min(20),
  body: z.string().min(20),
  district: z.string(),
  neighborhoods: z.array(z.string()),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  status: z.enum(["active", "open", "planned", "ended", "unknown"]),
  sourceName: z.string(),
  sourceUrl: z.string().url(),
  sourcePublishedAt: z.string().nullable(),
  updatedAt: z.string(),
  risk: z.enum(["low", "review"]),
  isFree: z.boolean().nullable(),
  tags: z.array(z.string()),
});

const schema = z.object({
  generatedAt: z.string(),
  city: z.string(),
  items: z.array(item),
  reviewQueue: z.array(item),
});

const file = path.join(process.cwd(), "data/content.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const parsed = schema.parse(data);
const slugs = new Set();
for (const entry of [...parsed.items, ...parsed.reviewQueue]) {
  if (slugs.has(entry.slug)) throw new Error(`Tekrarlanan slug: ${entry.slug}`);
  slugs.add(entry.slug);
}
console.log(`Veri geçerli: ${parsed.items.length} yayın, ${parsed.reviewQueue.length} inceleme kaydı.`);
