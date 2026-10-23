import test from "node:test";
import assert from "node:assert/strict";
import { describeJudgeObservation } from "../src/ui/judge-demo.js";

test("judge readout waits for observations instead of showing placeholder numbers", () => {
  assert.match(describeJudgeObservation(null), /No NASA observation loaded/);
});

test("judge readout traces valid-day coverage to the supplied POWER summary", () => {
  const text = describeJudgeObservation({ start: 2025, end: 2025, count: 365, rainfallCount: 360 });
  assert.match(text, /NASA POWER 2025:/);
  assert.match(text, /365 valid mean-temperature days and 360 valid rainfall days of 365 requested/);
  assert.match(text, /99%/);
  assert.match(text, /not a field sensor or forecast/);
});

test("judge readout does not treat an invalid period as complete", () => {
  assert.match(describeJudgeObservation({ start: 2025, end: 2024, count: 0, rainfallCount: 0 }), /could not be established/);
});
