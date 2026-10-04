import { readFile, access } from "node:fs/promises";

const requiredFiles = [
  "AGENTS.md",
  "index.html",
  "styles.css",
  "server.js",
  "src/main.js",
  "src/api/soil-data.js",
  "src/api/imerg-service.js",
  "src/engine/compare-strategies.js",
  "src/ui/strategy-view.js",
  "src/validation/field-inputs.js",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
  "LICENSE",
  "SECURITY.md",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".nvmrc",
  "package-lock.json",
  ".github/workflows/verify.yml",
  ".github/pull_request_template.md",
  "scripts/check-syntax.mjs",
  "scripts/check-assets.mjs",
  "src/climate.js",
  "src/nasa-power.js",
  "src/data-validation.js",
  "tests/fixtures/nasa-power-des-moines-2025-01-01-to-2025-01-07.json",
  "tests/fixtures/nasa-power-des-moines-2025-01-01-to-2025-01-07.metadata.json",
  "docs/STATUS.md",
  "docs/PROJECT_PLAN.md",
  "docs/DEVELOPMENT.md",
  "docs/ARCHITECTURE.md",
  "docs/PRIVACY.md",
  "docs/RELEASE_CHECKLIST.md",
  "docs/SCIENTIFIC_SAFETY.md",
  "docs/COMPETITION_SCORECARD.md",
  "data/sources.json",
  "data/crop-record.schema.json",
  "data/crops.json"
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

const app = await readFile("src/main.js", "utf8");
const powerModule = await readFile("src/nasa-power.js", "utf8");
if (!powerModule.includes("power.larc.nasa.gov") || !app.includes("serviceWorker")) {
  throw new Error("FieldShift is missing the NASA POWER endpoint or service-worker registration.");
}

console.log(`FieldShift checks passed: ${requiredFiles.length} required files, ${sources.sources.length} registered sources.`);
