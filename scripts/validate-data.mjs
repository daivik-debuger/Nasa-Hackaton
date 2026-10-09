import { readFile } from "node:fs/promises";
import { validateCropCollection } from "../src/data-validation.js";

const sourcesDocument = JSON.parse(await readFile("data/sources.json", "utf8"));
const cropsDocument = JSON.parse(await readFile("data/crops.json", "utf8"));
const region = JSON.parse(await readFile(`data/regions/${cropsDocument.regionId}.json`, "utf8"));
const evidence = JSON.parse(await readFile("data/evidence.json", "utf8"));
const rotationRules = JSON.parse(await readFile("data/rotation-rules.json", "utf8"));
const schema = JSON.parse(await readFile("data/crop-record.schema.json", "utf8"));

if (!schema?.properties || !Array.isArray(schema.required)) throw new Error("Crop schema is missing properties or required fields.");
if (!Array.isArray(sourcesDocument.sources)) throw new Error("data/sources.json must contain a sources array.");

const sourceIds = sourcesDocument.sources.map((source) => source.id);
const duplicateSourceIds = sourceIds.filter((id, index) => sourceIds.indexOf(id) !== index);
if (duplicateSourceIds.length) throw new Error(`Duplicate source IDs: ${[...new Set(duplicateSourceIds)].join(", ")}`);

const errors = [];
for (const source of sourcesDocument.sources) {
  if (!source.id || !source.name || !source.owner || !source.url || !source.limitations) errors.push(`Source ${source.id || "(missing ID)"} lacks required provenance.`);
  if (!/^https:\/\//.test(source.url || "")) errors.push(`Source ${source.id} must use a direct HTTPS URL.`);
  if (!["integrated", "planned", "research-only", "unavailable"].includes(source.integrationStatus)) errors.push(`Source ${source.id} has invalid integration status.`);
}

if (region.id !== cropsDocument.regionId || evidence.regionId !== region.id || rotationRules.regionId !== region.id) throw new Error("Pilot region IDs must match.");
const crops = await Promise.all(cropsDocument.cropFiles.map(async (id) => JSON.parse(await readFile(`data/crops/${id}.json`, "utf8"))));
errors.push(...validateCropCollection(crops, new Set(sourceIds)));
for (let index = 0; index < crops.length; index++) {
  if (crops[index].id !== cropsDocument.cropFiles[index]) errors.push(`Crop file ${cropsDocument.cropFiles[index]} has mismatched ID.`);
  if (!crops[index].regions.includes(region.id)) errors.push(`Crop ${crops[index].id} is not linked to pilot region.`);
  for (const field of Object.keys(crops[index])) if (!schema.properties[field]) errors.push(`Crop ${crops[index].id} has unsupported field ${field}.`);
}
const evidenceIds = new Set(evidence.records.map((record) => record.id));
if (evidenceIds.size !== evidence.records.length) errors.push("Duplicate evidence ID.");
for (const record of evidence.records) {
  if (!record.claim || !record.applicability || !record.limitations || !record.sourceIds?.length) errors.push(`Evidence ${record.id} lacks claim scope, limitations, or sources.`);
  if (!["high", "medium", "low"].includes(record.confidence)) errors.push(`Evidence ${record.id} has invalid confidence.`);
  if (!["app-rule", "context-only", "presentation-only", "not-usable"].includes(record.allowedUse)) errors.push(`Evidence ${record.id} has invalid allowed use.`);
  if (!record.review?.status) errors.push(`Evidence ${record.id} lacks review status.`);
  for (const id of record.sourceIds || []) if (!sourceIds.includes(id)) errors.push(`Evidence ${record.id} references unknown source ${id}.`);
}
const ruleIds = new Set(rotationRules.rules.map((rule) => rule.id));
if (ruleIds.size !== rotationRules.rules.length) errors.push("Duplicate rotation rule ID.");
for (const rule of rotationRules.rules) {
  if (rule.region !== region.id) errors.push(`Rule ${rule.id} has mismatched region.`);
  if (!rule.positiveConsideration || !rule.possibleDisadvantage || !rule.evidenceIds?.length || !rule.requiredInputs?.length) errors.push(`Rule ${rule.id} lacks a tradeoff, evidence, or required inputs.`);
  for (const id of rule.evidenceIds) if (!evidenceIds.has(id)) errors.push(`Rule ${rule.id} references unknown evidence ${id}.`);
  if (rule.humanApproved && (!rule.review.reviewer || !rule.review.date)) errors.push(`Rule ${rule.id} requires named approval.`);
}
for (const id of [...region.majorCropSourceIds, ...region.additionalCropSourceIds, ...region.normalRotations.flatMap((item) => item.sourceIds), ...region.climateRisks.flatMap((item) => item.sourceIds), ...region.soilDataSourceIds, ...Object.values(region.seasons).flatMap((item) => item.sourceIds)]) if (!sourceIds.includes(id)) errors.push(`Region references unknown source ${id}.`);
if (errors.length) throw new Error(`Crop data validation failed:\n- ${errors.join("\n- ")}`);

console.log(`Data validation passed: ${sourceIds.length} source IDs, ${crops.length} crop records, ${evidence.records.length} evidence records, ${rotationRules.rules.length} rules.`);
