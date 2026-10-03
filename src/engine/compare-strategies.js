import { describeConfidence } from "./confidence.js";

const DEFINITIONS = {
  "lowest-change": { title: "Lowest-change", description: "Keep the familiar row-crop sequence as a baseline to compare with new ideas." },
  "climate-resilience": { title: "Climate-resilience exploration", description: "Explore a locally documented cover-crop window while viewing precipitation and soil context." },
  "soil-diversity": { title: "Soil and diversity exploration", description: "Test whether a small-grain and perennial forage phase could fit your farm." }
};

function matches(rule, input) {
  const { lastCropAny, priorityAny } = rule.conditions;
  return (!lastCropAny || lastCropAny.includes(input.lastCrop)) && (!priorityAny || priorityAny.some((p) => input.priorities.includes(p)));
}

export function compareStrategies({ input, indicators, soil, crops, rules, evidence }) {
  const cropById = new Map(crops.map((crop) => [crop.id, crop]));
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const next = input.lastCrop === "corn" ? "soybean" : "corn";
  const cover = input.lastCrop === "corn" ? "cereal-rye" : "oats";
  const sequences = {
    "lowest-change": [next, next === "corn" ? "soybean" : "corn"],
    "climate-resilience": [cover, next, next === "corn" ? "soybean" : "corn"],
    "soil-diversity": ["oats", "alfalfa", "corn", "soybean"]
  };
  return Object.entries(DEFINITIONS).map(([id, definition]) => {
    const relevant = rules.filter((rule) => rule.strategy === id && matches(rule, input));
    const required = [...new Set(relevant.flatMap((rule) => rule.requiredInputs))];
    const missing = [...indicators.missing, input.soilPh === null && "laboratory soil pH (optional; not inferred)", ...required.filter((key) => input[key] === null || input[key] === undefined || input[key] === "" || Array.isArray(input[key]) && input[key].length === 0)].filter(Boolean);
    const sequence = sequences[id].map((cropId) => cropById.get(cropId)).filter(Boolean);
    const citations = [...new Set(relevant.flatMap((rule) => rule.evidenceIds))].map((evidenceId) => evidenceById.get(evidenceId)).filter(Boolean);
    const confidence = describeConfidence({ rules: relevant, missing, soil, crops: sequence });
    return {
      id, ...definition, sequence, rules: relevant, evidence: citations, confidence, missing,
      benefits: relevant.map((rule) => rule.positiveConsideration),
      risks: relevant.map((rule) => rule.possibleDisadvantage),
      inputUsed: { lastCrop: input.lastCrop || null, priorCrop: input.priorCrop || null, priorities: input.priorities, soilPh: input.soilPh, soilTexture: input.soilTexture || null },
      indicators,
      soil: soil ? { mapUnit: soil.mapUnit, possibleComponents: soil.components.map((component) => component.name), missing: soil.missing } : null,
      localChecks: ["Planting and harvest window", "Seed and equipment access", "Pest and disease history", "Market or forage outlet", "Recent laboratory soil test", "Local agronomist review"],
      humanApproved: false,
      label: "Exploratory pattern — not an approved recommendation"
    };
  });
}
