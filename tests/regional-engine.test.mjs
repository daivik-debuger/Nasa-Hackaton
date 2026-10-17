import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compareRegionalStrategies, pairedSoilChange, precipitationContext } from "../src/engine/regional-engine.js";
import { validateAgronomy } from "../src/agronomy-validation.js";
import { benchmarkMarkup, regionalResultMarkup } from "../src/ui/agronomy-view.js";

const catalog = JSON.parse(await readFile(new URL("../data/agronomy.json", import.meta.url)));
const sources = JSON.parse(await readFile(new URL("../data/sources.json", import.meta.url))).sources;
const sourceIds = new Set(sources.map((s) => s.id));
const base = { mode: "reference-scenario", regionId: "kansas-dryland", lastCrop: "sorghum", nextCrop: "", waterSupply: "unknown", allowFallow: "unknown", forageOutlet: "unknown", nodulation: "unknown", diseaseHistory: "unknown", priorities: [] };
const compare = (extra = {}, data = catalog) => compareRegionalStrategies({ catalog: data, sourceIds, input: { ...base, ...extra } });
const pair = { before: "3.2", after: "2.9", beforeDate: "2020-04-02", afterDate: "2025-04-02", depthCm: "15", method: "Loss on ignition", sameProtocol: true };

test("regional catalog resolves every source, crop phase and benchmark scope", () => assert.deepEqual(validateAgronomy(catalog, sourceIds), []));
test("malformed catalog records return validation errors without crashing", () => {
  for (const key of ["regions", "benchmarks", "rules"]) {
    const bad = structuredClone(catalog);
    bad[key].push(null);
    assert.ok(validateAgronomy(bad, sourceIds).length);
  }
});
test("invalid POWER year ranges cannot produce an indicator", () => {
  for (const [start, end] of [[0, 2025], [2025, 2020], [2025, 999999]]) {
    const result = precipitationContext({ start, end, params: { PRECTOTCORR: {} } });
    assert.equal(result.departurePct, null);
    assert.equal(result.drySpellDays, null);
    assert.match(result.missing, /invalid/);
  }
});
test("region selection never borrows another region's sequences", () => {
  for (const region of catalog.regions) {
    const r = compare({ regionId: region.id, lastCrop: "wheat" });
    assert.equal(r.region.id, region.id);
    assert.deepEqual(r.scenarios.map((s) => s.id), region.scenarios.map((s) => s.id));
    assert.ok(r.scenarios.every((s) => s.rules.every((rule) => rule.regionIds.includes(region.id))));
  }
  assert.throws(() => compare({ regionId: "global" }), /Choose an available/);
  assert.throws(() => compare({ mode: "field-recommendation" }), /approval/);
});
test("last crop anchors a documented cycle and unsupported histories remain excluded", () => {
  assert.deepEqual(compare().scenarios[0].sequence.map((c) => c.id), ["fallow", "wheat", "sorghum"]);
  const r = compare({ regionId: "upper-midwest", lastCrop: "pea" });
  assert.equal(r.scenarios[0].sequence.length, 0);
  assert.match(r.scenarios[0].excluded[0], /absent/);
  assert.throws(() => compare({ lastCrop: "rice" }), /last crop/);
});
test("cash-crop compatibility and fallow/forage constraints change results", () => {
  const r = compare({ nextCrop: "oat-triticale", allowFallow: "no", forageOutlet: "no" });
  assert.equal(r.scenarios[0].status, "constraint-conflict");
  assert.equal(r.scenarios[1].status, "research-review-required");
  assert.equal(r.scenarios[2].status, "constraint-conflict");
});
test("limited stored water changes intensification explanations but never invents a yield", () => {
  const unknown = compare(), limited = compare({ waterSupply: "no", priorities: ["water"] });
  assert.equal(unknown.scenarios[1].concerns.length, 0);
  assert.match(limited.scenarios[1].concerns[0], /Stored water/);
  assert.ok(limited.scenarios[1].rules.find((r) => r.dimension === "water").priority);
  assert.ok(limited.scenarios.every((s) => s.nitrogenCreditKgHa === null && s.predictedSomChange === null && !s.humanApproved));
});
test("legume and disease considerations trace rules and retain null nitrogen credit", () => {
  const r = compare({ regionId: "pnw-dryland", lastCrop: "wheat", nodulation: "no", diseaseHistory: "yes" });
  const pea = r.scenarios[1];
  assert.ok(pea.rules.some((rule) => rule.id === "N-LEGUME"));
  assert.ok(pea.rules.some((rule) => rule.id === "D-PEA"));
  assert.ok(pea.concerns.some((x) => x.includes("Nodulation")));
  assert.equal(pea.nitrogenCreditKgHa, null);
});
test("SOM paired difference uses percentage points and rejects mismatched or missing samples", () => {
  assert.equal(pairedSoilChange(pair, "som").delta, -0.3);
  assert.equal(pairedSoilChange({ ...pair, sameProtocol: false }, "som").delta, null);
  assert.equal(pairedSoilChange({ before: "", after: "" }, "som").delta, null);
  assert.throws(() => pairedSoilChange({ ...pair, before: "" }, "som"), /two valid/);
  assert.throws(() => pairedSoilChange({ ...pair, afterDate: "2019-04-02" }, "som"), /dates/);
  assert.throws(() => pairedSoilChange({ ...pair, afterDate: "2025-02-31" }, "som"), /dates/);
  assert.equal(compare({ som: pair }).scenarios[0].rules.some((r) => r.id === "C-SOM"), true);
});
test("bulk-density comparisons enforce valid units/range and trigger a scoped concern", () => {
  const density = { ...pair, before: "1.2", after: "1.3", method: "Dry core mass / volume" };
  assert.equal(pairedSoilChange(density, "density").delta, 0.1);
  assert.throws(() => pairedSoilChange({ ...density, before: "0" }, "density"), /bulk densities/);
  assert.ok(compare({ density }).scenarios[0].rules.some((r) => r.id === "C-COMPACTION"));
});
function weather() {
  const series = {};
  for (let t = Date.UTC(2023, 0, 1); t < Date.UTC(2025, 0, 1); t += 86400000) {
    const date = new Date(t).toISOString().slice(0, 10).replaceAll("-", "");
    series[date] = date.startsWith("2023") ? 2 : 0.5;
  }
  return { start: 2023, end: 2024, fillValue: -999, params: { PRECTOTCORR: series } };
}
test("POWER annual context respects leap years and complete calendar coverage", () => {
  const r = precipitationContext(weather());
  assert.equal(r.years[1].count, 366);
  assert.equal(r.drySpellDays, 366);
  assert.equal(r.departurePct, (183 - 730) / 730 * 100);
});
test("missing POWER days cannot become zero rain or a complete dry-spell indicator", () => {
  for (const missing of [null, undefined, "", -999, -1]) {
    const p = weather(); p.params.PRECTOTCORR["20240601"] = missing;
    const r = precipitationContext(p);
    assert.equal(r.departurePct, null); assert.equal(r.drySpellDays, null);
    assert.equal(r.years[1].count, 365);
  }
});
test("a single year is not treated as a climate normal", () => {
  const p = weather(); p.start = 2024;
  assert.equal(precipitationContext(p).departurePct, null);
  assert.equal(precipitationContext(null).drySpellDays, null);
});
test("validation rejects unknown sources, fictional numeric gaps and ambiguous cycles", () => {
  const bad = structuredClone(catalog);
  bad.benchmarks[0].sourceId = "invented";
  bad.benchmarks.find((b) => b.kind === "unavailable").value = 0;
  bad.regions[0].scenarios[0].phases.push("wheat");
  bad.rules[0].when = "eval";
  const errors = validateAgronomy(bad, sourceIds).join(" ");
  assert.match(errors, /source/); assert.match(errors, /null/); assert.match(errors, /sequence/); assert.match(errors, /condition/);
  assert.throws(() => compare({}, bad), /Invalid comparison catalog/);
});
test("benchmarks distinguish treatment differences, carbon rates and unavailable SOM", () => {
  const html = benchmarkMarkup(catalog, sources, "upper-midwest", "Bulk density");
  assert.match(html, /0.08/); assert.doesNotMatch(html, /Wheat grain yield/);
  assert.match(benchmarkMarkup(catalog, sources, "upper-midwest", "Δ soil organic matter"), /Not quantified/);
  assert.match(benchmarkMarkup(catalog, sources, "pnw-dryland"), /abstract reports different rates/);
});
test("research and explanation markup escape content and reject unsafe citations", () => {
  const bad = structuredClone(catalog); bad.benchmarks[0].location = '<img onerror="bad()">';
  assert.match(benchmarkMarkup(bad, sources), /&lt;img/);
  const registry = sources.map((s) => s.id === bad.benchmarks[0].sourceId ? { ...s, url: "javascript:alert(1)" } : s);
  assert.throws(() => benchmarkMarkup(bad, registry), /unsafe/);
  assert.match(regionalResultMarkup(compare({ waterSupply: "no" }), sources), /W-INTENSIFY/);
});
