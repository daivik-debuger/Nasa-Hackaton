import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateFarmInputs } from "../src/validation/field-inputs.js";
import { compareStrategies } from "../src/engine/compare-strategies.js";
import { buildIndicators } from "../src/engine/indicators.js";
import { renderStrategies } from "../src/ui/strategy-view.js";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const manifest = await readJson("../data/crops.json");
const crops = await Promise.all(manifest.cropFiles.map((id) => readJson(`../data/crops/${id}.json`)));
const rules = (await readJson("../data/rotation-rules.json")).rules;
const evidence = (await readJson("../data/evidence.json")).records;
const sources = (await readJson("../data/sources.json")).sources;

test("blank or absent lab pH remains unknown, never measured zero", () => {
  const ids = new Set(crops.map((crop) => crop.id));
  for (const value of ["", null, undefined]) {
    assert.equal(validateFarmInputs({ lastCrop: "corn", soilPh: value }, ids).soilPh, null);
  }
  assert.throws(() => validateFarmInputs({ lastCrop: "corn", soilPh: "15" }, ids), /between 0 and 14/);
});

test("strategy cards show every selected priority question", () => {
  const input = { lastCrop: "corn", priorCrop: "soybean", soilPh: null, soilTexture: null, priorities: ["water", "market"] };
  const strategies = compareStrategies({ input, indicators: buildIndicators({ power: null, imerg: null, soil: null }), soil: null, crops, rules, evidence });
  const container = { innerHTML: "" };
  const originalDocument = globalThis.document;
  globalThis.document = { getElementById: (id) => id === "strategies" ? container : null };
  try { renderStrategies(strategies, new Map(sources.map((source) => [source.id, source]))); }
  finally { globalThis.document = originalDocument; }
  const firstCard = container.innerHTML.split('</article>')[0];
  assert.match(firstCard, /Water: What do local rainfall/);
  assert.match(firstCard, /Main crop and market: Can each harvest/);
});
