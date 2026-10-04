const REQUIRED_CROP_FIELDS = ["id", "commonName", "scientificName", "cropFamily", "cropFamilySourceIds", "regions", "applicability", "roles", "traits", "evidence", "review"];
export const REQUIRED_TRAITS = ["growingPeriod", "temperatureConsiderations", "waterConsiderations", "soilCompatibility", "phRange", "rootDepthCategory", "rotationBenefits", "rotationRisks"];
const CROP_FIELDS = new Set(REQUIRED_CROP_FIELDS);
const TRAIT_FIELDS = new Set(["trait", "value", "unit", "conditions", "sourceIds", "confidence", "limitations"]);
const REVIEW_FIELDS = new Set(["status", "reviewer", "date", "notes"]);
const ID_PATTERN = /^[a-z0-9-]+$/;

function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function checkStringArray(value, field, errors) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => !nonEmptyString(item))) {
    errors.push(`${field} must contain at least one non-empty string.`);
    return false;
  }
  if (new Set(value).size !== value.length) errors.push(`${field} must not contain duplicates.`);
  return true;
}
function checkSources(value, field, knownSourceIds, errors) {
  if (!checkStringArray(value, field, errors)) return;
  for (const sourceId of value) if (!knownSourceIds.has(sourceId)) errors.push(`${field} references unknown source ID: ${sourceId}.`);
}

export function validateCropRecord(crop, knownSourceIds = new Set()) {
  const errors = [];
  if (!crop || typeof crop !== "object" || Array.isArray(crop)) return ["Crop record must be an object."];
  for (const field of REQUIRED_CROP_FIELDS) if (!(field in crop)) errors.push(`Missing required field: ${field}.`);
  for (const field of Object.keys(crop)) if (!CROP_FIELDS.has(field)) errors.push(`Unsupported crop field: ${field}.`);
  if (crop.id !== undefined && (typeof crop.id !== "string" || !ID_PATTERN.test(crop.id))) errors.push("Crop id must use lowercase letters, numbers, and hyphens.");
  for (const field of ["commonName", "scientificName", "cropFamily", "applicability"]) {
    if (crop[field] !== undefined && !nonEmptyString(crop[field])) errors.push(`${field} must be a non-empty string.`);
  }
  if (crop.regions !== undefined) checkStringArray(crop.regions, "regions", errors);
  if (crop.cropFamilySourceIds !== undefined) checkSources(crop.cropFamilySourceIds, "cropFamilySourceIds", knownSourceIds, errors);
  if (crop.roles !== undefined) checkStringArray(crop.roles, "roles", errors);
  if (crop.traits !== undefined && !Array.isArray(crop.traits)) errors.push("traits must be an array.");
  if (Array.isArray(crop.traits)) for (const required of REQUIRED_TRAITS) if (!crop.traits.some((trait) => trait?.trait === required)) errors.push(`Missing trait: ${required}.`);
  const traitNames = new Set();
  if (Array.isArray(crop.traits)) crop.traits.forEach((trait, index) => {
    if (!trait || typeof trait !== "object" || Array.isArray(trait)) { errors.push(`traits[${index}] must be an object.`); return; }
    for (const field of ["trait", "value", "sourceIds", "confidence", "limitations"]) {
      if (!(field in trait)) errors.push(`traits[${index}] is missing ${field}.`);
    }
    for (const field of Object.keys(trait)) if (!TRAIT_FIELDS.has(field)) errors.push(`traits[${index}] has unsupported field: ${field}.`);
    if (!nonEmptyString(trait.trait)) errors.push(`traits[${index}].trait must be a non-empty string.`);
    else if (traitNames.has(trait.trait)) errors.push(`Duplicate trait: ${trait.trait}.`);
    else traitNames.add(trait.trait);
    if (trait.unit !== undefined && trait.unit !== null && typeof trait.unit !== "string") errors.push(`traits[${index}].unit must be a string or null.`);
    if (trait.conditions !== undefined && typeof trait.conditions !== "string") errors.push(`traits[${index}].conditions must be a string.`);
    checkSources(trait.sourceIds, `traits[${index}].sourceIds`, knownSourceIds, errors);
    if (trait.confidence !== undefined && !["high", "medium", "low"].includes(trait.confidence)) errors.push(`traits[${index}].confidence is invalid.`);
    if (!nonEmptyString(trait.limitations)) errors.push(`traits[${index}].limitations must explain uncertainty.`);
  });
  if (crop.evidence !== undefined) checkSources(crop.evidence, "evidence", knownSourceIds, errors);
  if (crop.review !== undefined) {
    if (!crop.review || typeof crop.review !== "object" || Array.isArray(crop.review)) errors.push("review must be an object.");
    else {
      for (const field of Object.keys(crop.review)) if (!REVIEW_FIELDS.has(field)) errors.push(`review has unsupported field: ${field}.`);
      if (!["research-only", "reviewed", "approved-for-app"].includes(crop.review.status)) errors.push("review.status is invalid.");
      if (crop.review.reviewer !== undefined && crop.review.reviewer !== null && !nonEmptyString(crop.review.reviewer)) errors.push("review.reviewer must be a non-empty string or null.");
      if (crop.review.date !== undefined && crop.review.date !== null && !validDate(crop.review.date)) errors.push("review.date must be a real ISO date or null.");
      if (crop.review.notes !== undefined && typeof crop.review.notes !== "string") errors.push("review.notes must be a string.");
      if (["reviewed", "approved-for-app"].includes(crop.review.status) && (!nonEmptyString(crop.review.reviewer) || !validDate(crop.review.date))) errors.push("Reviewed crops require a named reviewer and valid date.");
    }
  }
  return errors;
}

export function validateCropCollection(crops, knownSourceIds) {
  if (!Array.isArray(crops)) return ["crops must be an array."];
  const errors = [];
  const ids = new Set();
  crops.forEach((crop, index) => {
    for (const error of validateCropRecord(crop, knownSourceIds)) errors.push(`crops[${index}]: ${error}`);
    if (crop?.id && ids.has(crop.id)) errors.push(`crops[${index}]: Duplicate crop id: ${crop.id}.`);
    if (crop?.id) ids.add(crop.id);
  });
  return errors;
}
