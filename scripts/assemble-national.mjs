import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function assemble(target, parts) {
  const content = (await Promise.all(parts.map((part) => fs.readFile(path.join(root, part), "utf8")))).join("");
  await fs.writeFile(path.join(root, target), content);
}

await Promise.all([
  assemble("scripts/national-sources.mjs", [
    "scripts/national-sources.part1",
    "scripts/national-sources.part2",
    "scripts/national-sources.part3",
    "scripts/national-sources.part4",
  ]),
  assemble("app/national-theme.css", [
    "app/national-theme.part1",
    "app/national-theme.part2",
    "app/national-theme.part3",
    "app/national-theme.part4",
  ]),
]);
