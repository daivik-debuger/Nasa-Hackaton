import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMapPoint } from "../src/ui/location-picker.js";

test("map selections preserve valid global points and wrap the date line", () => {
  assert.deepEqual(normalizeMapPoint({ lat: -15.79391234, lon: -47.88281234 }), { lat: -15.793912, lon: -47.882812 });
  assert.deepEqual(normalizeMapPoint({ lat: -15.79391234, lng: -47.88281234 }), { lat: -15.793912, lon: -47.882812 });
  assert.deepEqual(normalizeMapPoint({ lat: 10, lon: 181 }), { lat: 10, lon: -179 });
  assert.deepEqual(normalizeMapPoint({ lat: 10, lon: -181 }), { lat: 10, lon: 179 });
  assert.throws(() => normalizeMapPoint({ lat: 91, lon: 0 }), /valid location/);
  assert.throws(() => normalizeMapPoint({ lat: 0, lon: Number.NaN }), /valid location/);
});
