const categories = new Set(["data", "principle", "case"]);
const confidenceLevels = new Set(["high", "medium", "low"]);

export function validateGlobalResearch(document, sourceIds) {
  const errors = [];
  if (!Array.isArray(document?.records) || !document.records.length) return ["Global research needs a nonempty records array."];
  const seen = new Set();
  for (const record of document.records) {
    if (!record || typeof record !== "object") { errors.push("Global research record must be an object."); continue; }
    if (typeof record.id !== "string" || !/^[a-z0-9-]+$/.test(record.id)) errors.push("Global research record has an invalid ID.");
    else if (seen.has(record.id)) errors.push(`Duplicate global research ID ${record.id}.`);
    seen.add(record.id);
    if (!categories.has(record.category)) errors.push(`Global research ${record.id} has an invalid category.`);
    for (const field of ["title", "claim", "geography", "applicability", "limitations"]) {
      if (typeof record[field] !== "string" || !record[field].trim()) errors.push(`Global research ${record.id} lacks ${field}.`);
    }
    if (!confidenceLevels.has(record.confidence)) errors.push(`Global research ${record.id} has invalid confidence.`);
    if (record.allowedUse !== "context-only") errors.push(`Global research ${record.id} must remain context-only.`);
    if (record.review?.status !== "research-only" || record.review.reviewer !== null || record.review.date !== null) errors.push(`Global research ${record.id} requires explicit unreviewed status.`);
    if (!Array.isArray(record.sourceIds) || !record.sourceIds.length) errors.push(`Global research ${record.id} lacks source IDs.`);
    else for (const id of record.sourceIds) if (!sourceIds.has(id)) errors.push(`Global research ${record.id} references unknown source ${id}.`);
  }
  return errors;
}
