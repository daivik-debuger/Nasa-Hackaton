import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { summarizePowerPayload, validateFieldQuery } from "../src/climate.js";

const fixture = JSON.parse(await readFile(new URL("./fixtures/nasa-power-des-moines-2025-01-01-to-2025-01-07.json", import.meta.url), "utf8"));
const location = { lat: 41.5868, lon: -93.625, start: 2025, end: 2025 };

test("validates and normalizes a field query", () => {
  assert.deepEqual(validateFieldQuery({ latitude: "41.5868", longitude: "-93.625", startYear: "2021", endYear: "2025" }, { lastFullYear: 2025 }), { lat: 41.5868, lon: -93.625, start: 2021, end: 2025 });
});

test("rejects blank or out-of-range coordinates", () => {
  assert.throws(() => validateFieldQuery({ latitude: "", longitude: "-93", startYear: "2025", endYear: "2025" }, { lastFullYear: 2025 }), /Latitude is required/);
  assert.throws(() => validateFieldQuery({ latitude: "91", longitude: "-93", startYear: "2025", endYear: "2025" }, { lastFullYear: 2025 }), /valid latitude/);
  assert.throws(() => validateFieldQuery({ latitude: "41", longitude: "181", startYear: "2025", endYear: "2025" }, { lastFullYear: 2025 }), /valid latitude/);
});

test("rejects an invalid year range", () => {
  assert.throws(() => validateFieldQuery({ latitude: "41", longitude: "-93", startYear: "2025", endYear: "2024" }, { lastFullYear: 2025 }), /start year/i);
});

test("summarizes the saved real NASA POWER response", () => {
  const summary = summarizePowerPayload(fixture, location);
  assert.equal(summary.count, 7);
  assert.equal(summary.maxTemperatureCount, 7);
  assert.equal(summary.rainfallCount, 7);
  assert.equal(summary.hotDays, 0);
  assert.ok(Math.abs(summary.mean - (-8.314285714285715)) < 1e-12);
  assert.ok(Math.abs(summary.totalRain - 3.04) < 1e-12);
  assert.equal(summary.temperatureUnit, "C");
  assert.equal(summary.rainUnit, "mm/day");
});

test("excludes the documented fill value from summaries", () => {
  const syntheticMissingCase = structuredClone(fixture);
  syntheticMissingCase.properties.parameter.T2M["20250101"] = -999;
  syntheticMissingCase.properties.parameter.T2M_MAX["20250103"] = -999;
  syntheticMissingCase.properties.parameter.PRECTOTCORR["20250102"] = -999;
  const summary = summarizePowerPayload(syntheticMissingCase, location);
  assert.equal(summary.count, 6);
  assert.equal(summary.maxTemperatureCount, 6);
  assert.equal(summary.rainfallCount, 6);
  assert.ok(Math.abs(summary.totalRain - 0.22) < 1e-12);
});

test("does not turn absent NASA values into measured zeroes", () => {
  const payload = structuredClone(fixture);
  payload.properties.parameter.T2M["20250101"] = null;
  payload.properties.parameter.PRECTOTCORR["20250102"] = "";
  const summary = summarizePowerPayload(payload, location);
  assert.equal(summary.count, 6);
  assert.equal(summary.rainfallCount, 6);
  assert.ok(Math.abs(summary.totalRain - 0.22) < 1e-12);
});

test("rejects a payload with no usable temperature data", () => {
  const syntheticEmptyCase = structuredClone(fixture);
  for (const date of Object.keys(syntheticEmptyCase.properties.parameter.T2M)) syntheticEmptyCase.properties.parameter.T2M[date] = -999;
  assert.throws(() => summarizePowerPayload(syntheticEmptyCase, location), /No valid daily climate values/);
});
