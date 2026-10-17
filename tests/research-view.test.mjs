import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { researchMarkup } from "../src/ui/research-view.js";
import { validateGlobalResearch } from "../src/global-research-validation.js";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const region = await readJson("../data/regions/central-iowa.json");
const manifest = await readJson("../data/crops.json");
const crops = await Promise.all(manifest.cropFiles.map((id) => readJson(`../data/crops/${id}.json`)));
const evidence = (await readJson("../data/evidence.json")).records;
const sources = (await readJson("../data/sources.json")).sources;
const globalResearchDocument = await readJson("../data/global-research.json");
const globalResearch = globalResearchDocument.records;

test("research library exposes the complete regional pack, evidence, crop records, and source registry", () => {
  const html = researchMarkup({ region, crops, evidence, sources, globalResearch });
  for (const item of evidence) assert.ok(html.includes(item.id), item.id);
  for (const item of crops) assert.ok(html.includes(item.commonName), item.id);
  for (const item of sources) assert.ok(html.includes(item.id), item.id);
  for (const item of globalResearch) assert.ok(html.includes(item.id), item.id);
  assert.match(html, /Worldwide data and research principles/);
  assert.match(html, /Studies beyond Iowa/);
  assert.match(html, /Central Iowa evidence claims/);
  assert.match(html, /Central Iowa/);
  assert.match(html, /research-only/);
  assert.match(html, /unavailable/);
  assert.match(html, /Not established/);
  assert.equal((html.match(/class="research-group"/g) || []).length, 6);
});

test("research library escapes claims and refuses unlinked or unsafe sources", () => {
  const injected = structuredClone(evidence);
  injected[0].claim = '<script>alert("unsafe")</script>';
  const safe = researchMarkup({ region, crops, evidence: injected, sources, globalResearch });
  assert.ok(!safe.includes('<script>alert("unsafe")</script>'));
  assert.ok(safe.includes("&lt;script&gt;"));
  injected[0].sourceIds = ["missing-source"];
  assert.throws(() => researchMarkup({ region, crops, evidence: injected, sources, globalResearch }), /missing-source is missing/);
  const unsafeSources = structuredClone(sources);
  unsafeSources[0].url = "javascript:alert(1)";
  assert.throws(() => researchMarkup({ region, crops, evidence, sources: unsafeSources, globalResearch }), /unsafe URL/);
});

test("worldwide research remains sourced, unapproved context only", () => {
  const ids = new Set(sources.map((source) => source.id));
  assert.deepEqual(validateGlobalResearch(globalResearchDocument, ids), []);
  assert.ok(globalResearch.some((record) => record.id === "multi-continent-rotation-synthesis" && record.sourceIds.includes("mudare-global-rotation-2025")));
  const promoted = structuredClone(globalResearchDocument);
  promoted.records[0].allowedUse = "rotation-rule";
  assert.match(validateGlobalResearch(promoted, ids).join(" "), /context-only/);
  const unknown = structuredClone(globalResearchDocument);
  unknown.records[0].sourceIds = ["unregistered-source"];
  assert.match(validateGlobalResearch(unknown, ids).join(" "), /unknown source/);
  const approved = structuredClone(globalResearchDocument);
  approved.records[0].review.status = "approved";
  assert.match(validateGlobalResearch(approved, ids).join(" "), /unreviewed status/);
});

test("site introduction distinguishes worldwide access, reference packs and Iowa soil scope", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /Explore your field, wherever you farm/);
  assert.match(html, /Worldwide access is not worldwide crop advice/);
  assert.match(html, /Three regional reference packs/);
  assert.match(html, /mapped-soil lookup remains Iowa-scoped/);
  assert.match(html, /six-continent rotation synthesis/);
});

test("worldwide research escapes external text and requires linked sources", () => {
  const injected = structuredClone(globalResearch);
  injected[0].claim = "<img src=x onerror=alert(1)>";
  const safe = researchMarkup({ region, crops, evidence, sources, globalResearch: injected });
  assert.ok(!safe.includes("<img src=x onerror=alert(1)>"));
  assert.ok(safe.includes("&lt;img"));
  injected[0].sourceIds = ["missing-global-source"];
  assert.throws(() => researchMarkup({ region, crops, evidence, sources, globalResearch: injected }), /missing-global-source is missing/);
});
