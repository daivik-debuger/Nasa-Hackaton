import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveCoverage } from "../src/coverage.js";
import { summarizePowerPayload } from "../src/climate.js";

const region = JSON.parse(await readFile(new URL("../data/regions/central-iowa.json", import.meta.url), "utf8"));
const powerFixture = JSON.parse(await readFile(new URL("./fixtures/nasa-power-des-moines-2025-01-01-to-2025-01-07.json", import.meta.url), "utf8"));

test("global coordinates retain climate access without borrowing Iowa evidence", () => {
  const india = resolveCoverage({ lat: 20.5937, lon: 78.9629 }, [region]);
  const brazil = resolveCoverage({ lat: -15.7939, lon: -47.8828 }, [region]);
  for (const item of [india, brazil]) {
    assert.equal(item.climate, "requestable");
    assert.equal(item.soil, "not-yet-supported");
    assert.equal(item.rotation, "not-yet-supported");
    assert.equal(item.region, null);
  }
});

test("Central Iowa alone receives its research-only catalog and SSURGO provider", () => {
  const item = resolveCoverage({ lat: 42.035, lon: -93.55 }, [region]);
  assert.equal(item.region.id, "central-iowa");
  assert.equal(item.soilSourceId, "usda-ssurgo");
  assert.equal(item.rotation, "research-only");
});

test("coverage rejects impossible global coordinates", () => {
  assert.throws(() => resolveCoverage({ lat: 92, lon: 0 }, [region]), /valid global coordinates/);
});

test("IMERG reference day is selected by calendar year, not northern growing season", () => {
  const summary = summarizePowerPayload(powerFixture, { lat: -15.7939, lon: -47.8828, start: 2025, end: 2025 });
  assert.match(summary.wettestReferenceDay.day, /^202501/);
});
