const REQUIRED_CROP_FIELDS = ["id", "commonName", "scientificName", "cropFamily", "regions", "traits", "evidence", "review"];

export function validateCropRecord(crop, knownSourceIds = new Set()) {
  const errors = [];
  if (!crop || typeof crop !== "object" || Array.isArray(crop)) return ["Crop record must be an object."];
  for (const field of REQUIRED_CROP_FIELDS) if (!(field in crop)) errors.push(`Missing required field: ${field}.`);
  if (crop.id !== undefined && !/^[a-z0-9-]+$/.test(crop.id)) errors.push("Crop id must use lowercase letters, numbers, and hyphens.");
  for (const field of ["commonName", "scientificName", "cropFamily"]) {
    if (crop[field] !== undefined && (typeof crop[field] !== "string" || !crop[field].trim())) errors.push(`${field} must be a non-empty string.`);
  }
  if (crop.regions !== undefined && (!Array.isArray(crop.regions) || crop.regions.length === 0)) errors.push("regions must contain at least one region.");
  if (crop.traits !== undefined && !Array.isArray(crop.traits)) errors.push("traits must be an array.");
  if (Array.isArray(crop.traits)) crop.traits.forEach((trait, index) => {
    for (const field of ["trait", "value", "sourceIds", "confidence", "limitations"]) {
      if (!(field in trait)) errors.push(`traits[${index}] is missing ${field}.`);
    }
    if (!Array.isArray(trait.sourceIds) || trait.sourceIds.length === 0) errors.push(`traits[${index}].sourceIds must not be empty.`);
    else for (const sourceId of trait.sourceIds) if (!knownSourceIds.has(sourceId)) errors.push(`traits[${index}] references unknown source ID: ${sourceId}.`);
    if (trait.confidence !== undefined && !["high", "medium", "low"].includes(trait.confidence)) errors.push(`traits[${index}].confidence is invalid.`);
  });
  if (crop.evidence !== undefined && (!Array.isArray(crop.evidence) || crop.evidence.length === 0)) errors.push("evidence must contain at least one source ID.");
  if (Array.isArray(crop.evidence)) for (const sourceId of crop.evidence) if (!knownSourceIds.has(sourceId)) errors.push(`evidence references unknown source ID: ${sourceId}.`);
  if (crop.review !== undefined && !["research-only", "reviewed", "approved-for-app"].includes(crop.review?.status)) errors.push("review.status is invalid.");
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
