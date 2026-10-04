import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validatePilotLocation } from "../src/validation/field-inputs.js";
import { buildSoilQuery, parseSoilResponse } from "../src/api/soil-data.js";
import { querySoil } from "../src/api/soil-service.js";
import { buildImergUrl, summarizeImergSamples, queryImergDay } from "../src/api/imerg-service.js";
import { compareStrategies } from "../src/engine/compare-strategies.js";
import { buildIndicators } from "../src/engine/indicators.js";

const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const region = await load("../data/regions/central-iowa.json");
const manifest = await load("../data/crops.json");
const crops = await Promise.all(manifest.cropFiles.map((id) => load(`../data/crops/${id}.json`)));
const evidence = (await load("../data/evidence.json")).records;
const rules = (await load("../data/rotation-rules.json")).rules;

test("pilot region rejects a valid coordinate outside central Iowa", () => {
  assert.throws(() => validatePilotLocation({ latitude: "40", longitude: "-93.55", startYear: "2024", endYear: "2025" }, region, { lastFullYear: 2025 }), /limited to Central Iowa/);
  assert.equal(validatePilotLocation({ latitude: "42.035", longitude: "-93.55", startYear: "2024", endYear: "2025" }, region, { lastFullYear: 2025 }).lat, 42.035);
});

test("soil query validates coordinates before interpolating SQL", () => {
  assert.match(buildSoilQuery({ lat: 42.035, lon: -93.55 }), /POINT\(-93\.550000 42\.035000\)/);
  assert.throws(() => buildSoilQuery({ lat: NaN, lon: -93.55 }), /Invalid soil/);
});

test("soil response keeps multiple possible components and missing values", () => {
  const soil = parseSoilResponse({ Table: [
    ["2835021", "L107", "Webster clay loam", "None", "18.15", "1", "Webster", "90", "Poorly drained", "0", "20", "0.18", "CL"],
    ["2835021", "L107", "Webster clay loam", "None", "18.15", "2", "Nicollet", "5", null, "0", "20", null, null]
  ] });
  assert.equal(soil.components.length, 2);
  assert.equal(soil.components[0].horizons[0].texture, "CL");
  assert.equal(soil.components[1].horizons[0].availableWaterCapacityCmPerCm, null);
  assert.equal(soil.availableWaterStorage0to100Cm, 18.15);
});

test("soil lookup does not invent data after a failed request", async () => {
  await assert.rejects(() => querySoil({ lat: 42.035, lon: -93.55 }, async () => ({ ok: false, status: 503 })), /503/);
  assert.throws(() => parseSoilResponse({ Table: [] }), /No SSURGO map unit/);
});

test("IMERG URL and incomplete sample response are explicit", () => {
  const url = new URL(buildImergUrl({ lat: 42.035, lon: -93.55 }, 1, 2));
  assert.equal(url.searchParams.get("returnFirstValueOnly"), "false");
  assert.throws(() => summarizeImergSamples([{ samples: [] }], "20250728"), /only 0/);
  assert.throws(() => summarizeImergSamples([{ samples: [{ attributes: { stdtime: 1 }, value: null }] }], "20250728"), /only 0/);
});

test("IMERG rejects upstream failure and invalid day", async () => {
  await assert.rejects(() => queryImergDay({ lat: 42.035, lon: -93.55 }, "20250230", async () => ({ ok: true, json: async () => ({ samples: [] }) })), /Invalid IMERG day/);
  await assert.rejects(() => queryImergDay({ lat: 42.035, lon: -93.55 }, "20250728", async () => ({ ok: false, status: 503 })), /503/);
});

test("three strategies stay exploratory and expose rule evidence and missing inputs", () => {
  const input = { lastCrop: "corn", priorCrop: "soybean", priorities: ["cover", "diversity"], soilPh: null };
  const indicators = buildIndicators({ power: null, imerg: null, soil: null });
  const result = compareStrategies({ input, indicators, soil: null, crops, rules, evidence });
  assert.deepEqual(result.map((item) => item.id), ["lowest-change", "climate-resilience", "soil-diversity"]);
  assert.ok(result[1].rules.some((rule) => rule.id === "rye-after-corn"));
  assert.ok(result[1].evidence.some((item) => item.id === "ev-rye-before-soy"));
  assert.ok(result.every((item) => item.humanApproved === false && item.confidence.level === "limited"));
  assert.ok(result[2].missing.includes("marketAccess"));
});

test("farmer priorities alter visible questions without inventing a score", () => {
  const base = { lastCrop: "corn", priorCrop: "soybean", soilPh: null };
  const indicators = buildIndicators({ power: null, imerg: null, soil: null });
  const water = compareStrategies({ input: { ...base, priorities: ["water"] }, indicators, soil: null, crops, rules, evidence });
  const market = compareStrategies({ input: { ...base, priorities: ["market"] }, indicators, soil: null, crops, rules, evidence });
  assert.notDeepEqual(water[1].priorityQuestions, market[1].priorityQuestions);
  assert.ok(water[1].rules.some((rule) => rule.id === "rye-after-corn"));
  assert.ok(!market[1].rules.some((rule) => rule.id === "rye-after-corn"));
  assert.match(market[0].priorityQuestions[0], /market/i);
  assert.equal(market[1].sequence.length, 0);
  assert.equal(market[1].confidence.level, "limited");
  assert.ok(water.every((item) => item.humanApproved === false && !Object.hasOwn(item, "score")));
});

test("comparison refuses to guess a rotation from missing or unsupported last crop", () => {
  const indicators = buildIndicators({ power: null, imerg: null, soil: null });
  for (const lastCrop of ["", "oats"]) {
    assert.throws(() => compareStrategies({ input: { lastCrop, priorCrop: "soybean", priorities: [] }, indicators, soil: null, crops, rules, evidence }), /needs last season's crop/);
  }
});

test("second NASA dataset changes the precipitation indicator and missing-data explanation", () => {
  const input = { lastCrop: "corn", priorCrop: "soybean", priorities: ["water"], soilPh: null };
  const withoutImerg = buildIndicators({ power: null, imerg: null, soil: null });
  const withImerg = buildIndicators({ power: null, imerg: { value: 58.02, unit: "mm estimated accumulation", time: "2025-05-20 UTC", resolution: "0.1° grid" }, soil: null });
  assert.equal(withoutImerg.satellitePrecipitation, null);
  assert.equal(withImerg.satellitePrecipitation.value, 58.02);
  const before = compareStrategies({ input, indicators: withoutImerg, soil: null, crops, rules, evidence });
  const after = compareStrategies({ input, indicators: withImerg, soil: null, crops, rules, evidence });
  assert.ok(before[1].missing.includes("IMERG satellite precipitation"));
  assert.ok(!after[1].missing.includes("IMERG satellite precipitation"));
  assert.equal(after[1].confidence.level, "limited");
});
