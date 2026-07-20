import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const file = path.join(process.cwd(), "data/content.json");
const data = JSON.parse(await fs.readFile(file, "utf8"));
const used = new Set();
let changed = false;

function suffix(id) {
  return crypto.createHash("sha1").update(id).digest("hex").slice(0, 6);
}

for (const item of [...data.items, ...data.reviewQueue]) {
  const base = item.slug;
  let candidate = base;
  if (used.has(candidate)) candidate = `${base}-${suffix(item.id)}`;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${suffix(item.id)}-${index}`;
    index += 1;
  }
  if (candidate !== item.slug) {
    item.slug = candidate;
    changed = true;
  }
  used.add(candidate);
}

if (changed) await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Slug kontrolü tamamlandı: ${used.size} benzersiz adres.`);
