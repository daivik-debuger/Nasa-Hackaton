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

test("rejects malformed nested traits instead of crashing", () => {
  const crop = structuredClone(validCrop);
  crop.traits[0] = null;
  crop.traits[1].sourceIds = "source-a";
  const errors = validateCropRecord(crop, knownSources);
  assert.ok(errors.some((error) => error.includes("traits[0] must be an object")));
  assert.ok(errors.some((error) => error.includes("traits[1].sourceIds")));
});

test("rejects unreviewed schema drift, duplicate traits, and invalid review dates", () => {
  const crop = structuredClone(validCrop);
  crop.unsourcedScore = 9;
  crop.traits.push(structuredClone(crop.traits[0]));
  crop.traits[0].madeUpField = "unsupported";
  crop.review = { status: "approved-for-app", reviewer: "Test Reviewer", date: "2026-02-30" };
  const errors = validateCropRecord(crop, knownSources);
  for (const fragment of ["Unsupported crop field", "Duplicate trait", "unsupported field", "real ISO date", "Reviewed crops require"]) {
    assert.ok(errors.some((error) => error.includes(fragment)), fragment);
  }
});

test("requires a reviewer and date for reviewed crops, not just approved ones", () => {
  const crop = structuredClone(validCrop);
  crop.review.status = "reviewed";
  assert.ok(validateCropRecord(crop, knownSources).some((error) => error.includes("named reviewer")));
});
