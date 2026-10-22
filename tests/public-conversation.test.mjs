import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicExampleLink, conversationEvidence, parsePublicExampleLink } from "../src/ui/public-conversation.js";

const base = "https://example.org/app/?fieldName=private&lat=42.035&soilPh=6.4#farm";

test("shared link includes only a public example, period and bounded question", () => {
  const href = buildPublicExampleLink(base, { id: "brazil", start: 2021, end: 2025, question: "water" }, 2025);
  assert.equal(href, "https://example.org/app/?example=brazil&start=2021&end=2025&question=water#top");
  assert.deepEqual(parsePublicExampleLink(href, 2025), { id: "brazil", start: 2021, end: 2025, question: "water" });
  assert.ok(!href.includes("private") && !href.includes("soilPh") && !href.includes("lat="));
});

test("private or malformed link values cannot be restored as public examples", () => {
  assert.equal(parsePublicExampleLink("https://example.org/?example=unknown&start=2024&end=2025&question=water", 2025), null);
  assert.equal(parsePublicExampleLink("https://example.org/?example=brazil&start=2026&end=2025&question=water", 2025), null);
  assert.equal(parsePublicExampleLink("https://example.org/?example=brazil&start=2024&end=2025&question=private", 2025), null);
  assert.throws(() => buildPublicExampleLink(base, { id: "unknown", start: 2024, end: 2025, question: "water" }, 2025));
});

test("public explanation retains coverage and scientific limitations", () => {
  const power = { start: 2021, end: 2025, count: 1826, rainfallCount: 1820, maxTemperatureCount: 1819, totalRain: 5031.4, hotDays: 142 };
  assert.match(conversationEvidence(power, "water"), /1,820 valid daily readings/);
  assert.match(conversationEvidence(power, "heat"), /not a crop-specific stress threshold/);
  assert.match(conversationEvidence(power, "soil"), /does not measure field soil organic matter/);
  assert.match(conversationEvidence(null, "water"), /Load NASA POWER history/);
});
