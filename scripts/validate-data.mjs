import { readFile } from "node:fs/promises";
import { validateCropCollection } from "../src/data-validation.js";

const sourcesDocument = JSON.parse(await readFile("data/sources.json", "utf8"));
const cropsDocument = JSON.parse(await readFile("data/crops.json", "utf8"));
const schema = JSON.parse(await readFile("data/crop-record.schema.json", "utf8"));

if (!schema?.properties || !Array.isArray(schema.required)) throw new Error("Crop schema is missing properties or required fields.");
if (!Array.isArray(sourcesDocument.sources)) throw new Error("data/sources.json must contain a sources array.");

const sourceIds = sourcesDocument.sources.map((source) => source.id);
const duplicateSourceIds = sourceIds.filter((id, index) => sourceIds.indexOf(id) !== index);
if (duplicateSourceIds.length) throw new Error(`Duplicate source IDs: ${[...new Set(duplicateSourceIds)].join(", ")}`);

const errors = validateCropCollection(cropsDocument.crops, new Set(sourceIds));
if (errors.length) throw new Error(`Crop data validation failed:\n- ${errors.join("\n- ")}`);

console.log(`Data validation passed: ${sourceIds.length} source IDs and ${cropsDocument.crops.length} crop records.`);
