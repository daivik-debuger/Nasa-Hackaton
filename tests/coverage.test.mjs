import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveCoverage } from "../src/coverage.js";
import { summarizePowerPayload } from "../src/climate.js";
import { GLOBAL_DEMO_LOCATIONS, demoLocation } from "../src/global-demo-locations.js";
import { buildPowerUrl } from "../src/nasa-power.js";

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

test("public example locations across six continents build distinct global NASA POWER requests", () => {
  assert.equal(GLOBAL_DEMO_LOCATIONS.length, 6);
  assert.equal(demoLocation("india")?.lat, 18.5204);
  assert.equal(demoLocation("unknown"), null);
  const urls = new Set();
  for (const place of GLOBAL_DEMO_LOCATIONS) {
    const point = resolveCoverage(place, [region]);
    assert.equal(point.climate, "requestable");
    if (place.id !== "iowa") {
      assert.equal(point.region, null);
      assert.equal(point.soil, "not-yet-supported");
      assert.equal(point.rotation, "not-yet-supported");
    }
    const url = new URL(buildPowerUrl({ ...place, start: 2024, end: 2024 }));
    assert.equal(Number(url.searchParams.get("latitude")), place.lat);
    assert.equal(Number(url.searchParams.get("longitude")), place.lon);
    urls.add(url.href);
  }
  assert.equal(urls.size, GLOBAL_DEMO_LOCATIONS.length);
});
