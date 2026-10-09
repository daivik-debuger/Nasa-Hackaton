import test from "node:test";
import assert from "node:assert/strict";
import { viewForHash } from "../src/ui/view-router.js";

test("deep links open the correct focused app view", () => {
  for (const hash of ["", "#top", "#location", "#climate"]) assert.equal(viewForHash(hash), "dashboard");
  for (const hash of ["#farm", "#strategies-section"]) assert.equal(viewForHash(hash), "plan");
  assert.equal(viewForHash("#crops"), "crops");
  assert.equal(viewForHash("#research"), "research");
  assert.equal(viewForHash("#unknown"), "dashboard");
});
