import test from "node:test";
import assert from "node:assert/strict";
import { validateCropCollection, validateCropRecord, REQUIRED_TRAITS } from "../src/data-validation.js";

const knownSources = new Set(["source-a"]);
const validCrop = {
  id: "test-crop",
  commonName: "Test crop",
  scientificName: "Testus cropus",
  cropFamily: "Testaceae",
  cropFamilySourceIds: ["source-a"],
  regions: ["test-region"],
  applicability: "Synthetic unit-test region only.",
  roles: ["cash-grain"],
  traits: REQUIRED_TRAITS.map((trait) => ({ trait, value: "test-only", unit: null, conditions: "Synthetic unit-test record", sourceIds: ["source-a"], confidence: "low", limitations: "Not real crop evidence." })),
  evidence: ["source-a"],
  review: { status: "research-only", reviewer: null, date: null, notes: "Synthetic unit-test record." }
};

test("accepts a schema-shaped crop whose source IDs exist", () => {
  assert.deepEqual(validateCropRecord(validCrop, knownSources), []);
});

test("rejects missing required crop fields", () => {
  const errors = validateCropRecord({ id: "incomplete" }, knownSources);
  assert.ok(errors.some((error) => error.includes("commonName")));
  assert.ok(errors.some((error) => error.includes("review")));
});

test("rejects unknown evidence and trait source IDs", () => {
  const crop = structuredClone(validCrop);
  crop.traits[0].sourceIds = ["missing-source"];
  crop.evidence = ["missing-source"];
  const errors = validateCropRecord(crop, knownSources);
  assert.equal(errors.filter((error) => error.includes("unknown source ID")).length, 2);
});

test("rejects duplicate crop IDs", () => {
  const errors = validateCropCollection([validCrop, structuredClone(validCrop)], knownSources);
  assert.ok(errors.some((error) => error.includes("Duplicate crop id")));
});
