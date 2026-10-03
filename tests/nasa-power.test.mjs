import test from "node:test";
import assert from "node:assert/strict";
import { buildPowerUrl, fetchPowerData, POWER_DAILY_ENDPOINT } from "../src/nasa-power.js";

const location = { lat: 41.5868, lon: -93.625, start: 2024, end: 2025 };

test("builds a bounded NASA POWER daily request", () => {
  const url = new URL(buildPowerUrl(location));
  assert.equal(url.origin + url.pathname, POWER_DAILY_ENDPOINT);
  assert.equal(url.searchParams.get("latitude"), "41.5868");
  assert.equal(url.searchParams.get("longitude"), "-93.625");
  assert.equal(url.searchParams.get("start"), "20240101");
  assert.equal(url.searchParams.get("end"), "20251231");
  assert.equal(url.searchParams.get("time-standard"), "UTC");
});

test("returns JSON from a successful request", async () => {
  const expected = { type: "Feature" };
  const fetchStub = async () => ({ ok: true, status: 200, json: async () => expected });
  assert.deepEqual(await fetchPowerData(location, fetchStub), expected);
});

test("reports HTTP failures without returning fake data", async () => {
  const fetchStub = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(() => fetchPowerData(location, fetchStub), (error) => error.code === "http" && error.status === 503);
});

test("classifies network failures", async () => {
  const fetchStub = async () => { throw new TypeError("connection failed"); };
  await assert.rejects(() => fetchPowerData(location, fetchStub), (error) => error.code === "network" && /Could not reach NASA POWER/.test(error.message));
});
