import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { researchMarkup } from "../src/ui/research-view.js";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const region = await readJson("../data/regions/central-iowa.json");
const manifest = await readJson("../data/crops.json");
const crops = await Promise.all(manifest.cropFiles.map((id) => readJson(`../data/crops/${id}.json`)));
const evidence = (await readJson("../data/evidence.json")).records;
const sources = (await readJson("../data/sources.json")).sources;

test("research library exposes the complete regional pack, evidence, crop records, and source registry", () => {
  const html = researchMarkup({ region, crops, evidence, sources });
  for (const item of evidence) assert.ok(html.includes(item.id), item.id);
  for (const item of crops) assert.ok(html.includes(item.commonName), item.id);
  for (const item of sources) assert.ok(html.includes(item.id), item.id);
  assert.match(html, /Central Iowa/);
  assert.match(html, /research-only/);
  assert.match(html, /unavailable/);
  assert.match(html, /Not established/);
  assert.equal((html.match(/class="research-group"/g) || []).length, 4);
});

test("research library escapes claims and refuses unlinked or unsafe sources", () => {
  const injected = structuredClone(evidence);
  injected[0].claim = '<script>alert("unsafe")</script>';
  const safe = researchMarkup({ region, crops, evidence: injected, sources });
  assert.ok(!safe.includes('<script>alert("unsafe")</script>'));
  assert.ok(safe.includes("&lt;script&gt;"));
  injected[0].sourceIds = ["missing-source"];
  assert.throws(() => researchMarkup({ region, crops, evidence: injected, sources }), /missing-source is missing/);
  const unsafeSources = structuredClone(sources);
  unsafeSources[0].url = "javascript:alert(1)";
  assert.throws(() => researchMarkup({ region, crops, evidence, sources: unsafeSources }), /unsafe URL/);
});
