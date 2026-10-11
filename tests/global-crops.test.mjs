import test from "node:test";
import assert from "node:assert/strict";
import { globalCropQuery, normalizeGbifPlants, searchGlobalPlants } from "../src/api/global-crops-service.js";
import { fetchGlobalPlants } from "../src/api/global-crops.js";
import { globalPlantCardsMarkup } from "../src/ui/crop-view.js";

const accepted = { key: 2703459, canonicalName: "Oryza sativa", kingdom: "Plantae", rank: "SPECIES", taxonomicStatus: "ACCEPTED", family: "Poaceae" };

test("common crop names resolve to scientific lookup terms without creating trait records", () => {
  assert.deepEqual(globalCropQuery(" rice "), { entered: "rice", lookup: "Oryza sativa" });
  assert.equal(globalCropQuery("Amaranthus cruentus").lookup, "Amaranthus cruentus");
  for (const input of ["", "a", "x".repeat(81), "<script>"]) assert.throws(() => globalCropQuery(input), /Enter a crop/);
});

test("GBIF results keep only accepted plant species and safe source links", () => {
  const results = normalizeGbifPlants({ results: [accepted, { ...accepted, key: 5 }, { ...accepted, key: 8, kingdom: "Animalia" }, { ...accepted, key: 9, taxonomicStatus: "SYNONYM" }, { ...accepted, key: "bad" }] });
  assert.deepEqual(results, [{ key: 2703459, scientificName: "Oryza sativa", family: "Poaceae", url: "https://www.gbif.org/species/2703459" }]);
  assert.throws(() => normalizeGbifPlants({}), /incomplete/);
});

test("live search uses the GBIF backbone and does not invent failed data", async () => {
  const result = await searchGlobalPlants("rice", async (url) => {
    assert.equal(url.searchParams.get("q"), "Oryza sativa");
    assert.equal(url.searchParams.get("datasetKey"), "7ddf754f-d193-4cc9-b351-99906754a03b");
    return { ok: true, json: async () => ({ results: [accepted, { ...accepted, key: 15, canonicalName: "Wettinia maynensis" }] }) };
  });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].scientificName, "Oryza sativa");
  await assert.rejects(searchGlobalPlants("rice", async () => { throw new Error("offline"); }), /unavailable/);
  await assert.rejects(searchGlobalPlants("rice", async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(searchGlobalPlants("rice", async () => ({ ok: true, json: async () => ({}) })), /incomplete/);
});

test("browser lookup rejects failed or incomplete responses", async () => {
  await assert.rejects(fetchGlobalPlants("rice", async () => ({ ok: false, status: 502, json: async () => ({ error: "Upstream unavailable" }) })), /Upstream unavailable/);
  await assert.rejects(fetchGlobalPlants("rice", async () => ({ ok: true, json: async () => ({ matches: [] }) })), /incomplete/);
});

test("global plant cards escape live text and reject untrusted links", () => {
  const html = globalPlantCardsMarkup({ sourceId: "gbif-species-api", matches: [{ key: 1, scientificName: '<img src=x onerror=alert(1)>', family: "<script>", url: "https://www.gbif.org/species/1" }] });
  assert.doesNotMatch(html, /<img|<script>/);
  assert.match(html, /&lt;img/);
  assert.throws(() => globalPlantCardsMarkup({ sourceId: "gbif-species-api", matches: [{ key: 1, scientificName: "Rice", url: "javascript:alert(1)" }] }), /invalid source link/);
});
