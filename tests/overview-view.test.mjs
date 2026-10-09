import test from "node:test";
import assert from "node:assert/strict";
import { climateCoverage } from "../src/ui/overview-view.js";

test("dashboard coverage uses the least complete NASA series and the requested calendar days", () => {
  assert.deepEqual(climateCoverage({ start: 2024, end: 2024, count: 366, rainfallCount: 183 }), { days: 366, percent: 50 });
  assert.deepEqual(climateCoverage({ start: 2025, end: 2025, count: 365, rainfallCount: 365 }), { days: 365, percent: 100 });
  assert.equal(climateCoverage(null), null);
});
