import test from "node:test";
import assert from "node:assert/strict";
import { cropCardsMarkup } from "../src/ui/crop-view.js";

const source = { id: "extension", name: "Extension guide", url: "https://example.edu/guide" };
const crop = {
  id: "oats", commonName: "Oats", scientificName: "Avena sativa", cropFamily: "Poaceae",
  roles: ["cash-grain", "cover"], applicability: "Central Iowa only", review: { status: "research-only" },
  traits: [
    { trait: "growingPeriod", value: "Spring grain", limitations: "Local timing varies", sourceIds: ["extension"] },
    { trait: "rotationRisks", value: "<script>alert(1)</script>", limitations: "Check conditions", sourceIds: ["extension"] }
  ]
};

test("crop explorer filters sourced pilot records and escapes research text", () => {
  const matching = cropCardsMarkup([crop], [source], { search: "poaceae", role: "cover" });
  assert.equal(matching.count, 1);
  assert.match(matching.html, /Spring grain/);
  assert.match(matching.html, /assets\/crops\/oats\.jpg/);
  assert.match(matching.html, /Illustration of Oats plant/);
  assert.match(matching.html, /https:\/\/example.edu\/guide/);
  assert.doesNotMatch(matching.html, /<script>/);
  assert.equal(cropCardsMarkup([crop], [source], { role: "forage" }).count, 0);
});

test("crop explorer rejects missing or unsafe source links", () => {
  assert.throws(() => cropCardsMarkup([crop], []), /source extension is missing/);
  assert.throws(() => cropCardsMarkup([crop], [{ ...source, url: "javascript:alert(1)" }]), /unsafe URL/);
});
