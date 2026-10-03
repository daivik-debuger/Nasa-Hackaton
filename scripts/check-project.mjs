import { readFile, access } from "node:fs/promises";

const requiredFiles = [
  "AGENTS.md",
  "index.html",
  "styles.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
  "docs/STATUS.md",
  "docs/PROJECT_PLAN.md",
  "docs/SCIENTIFIC_SAFETY.md",
  "docs/COMPETITION_SCORECARD.md",
  "data/sources.json",
  "data/crop-record.schema.json"
];

await Promise.all(requiredFiles.map((file) => access(file)));

const manifest = JSON.parse(await readFile("manifest.webmanifest", "utf8"));
if (manifest.display !== "standalone" || !manifest.start_url || !manifest.icons?.length) {
  throw new Error("PWA manifest is missing standalone display, start_url, or icons.");
}

const sources = JSON.parse(await readFile("data/sources.json", "utf8"));
if (!Array.isArray(sources.sources) || sources.sources.length === 0) {
  throw new Error("data/sources.json must contain at least one source.");
}
const sourceIds = sources.sources.map((source) => source.id);
if (new Set(sourceIds).size !== sourceIds.length) throw new Error("Source IDs must be unique.");

JSON.parse(await readFile("data/crop-record.schema.json", "utf8"));

const html = await readFile("index.html", "utf8");
for (const marker of ["name=\"viewport\"", "rel=\"manifest\"", "id=\"loadClimate\"", "id=\"climateStatus\""]) {
  if (!html.includes(marker)) throw new Error(`index.html is missing required marker: ${marker}`);
}

const app = await readFile("app.js", "utf8");
if (!app.includes("power.larc.nasa.gov") || !app.includes("serviceWorker")) {
  throw new Error("app.js is missing the NASA POWER endpoint or service-worker registration.");
}

console.log(`FieldShift checks passed: ${requiredFiles.length} required files, ${sources.sources.length} registered sources.`);
