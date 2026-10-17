const groups = new Set(["cereal", "legume", "oilseed", "fallow", "cover"]);
export const RULE_CONDITIONS = new Set(["hasLegume", "waterIntensification", "cerealTransition", "somDeclining", "densityIncreasing"]);
export function validateAgronomy(data, sourceIds) {
  const errors = [];
  if (data?.schemaVersion !== 1 || ![data?.regions, data?.benchmarks, data?.rules].every(Array.isArray)) return ["Invalid agronomy catalog structure."];
  const unique = (rows, name) => {
    const ids = rows.map((r) => r?.id);
    if (ids.some((id) => typeof id !== "string" || !/^[a-zA-Z0-9-]+$/.test(id)) || new Set(ids).size !== ids.length) errors.push(`${name}: missing or duplicate IDs.`);
    return new Set(ids);
  };
  const regions = unique(data.regions, "Regions"); unique(data.benchmarks, "Benchmarks"); unique(data.rules, "Rules");
  const refs = (ids, label) => { if (!Array.isArray(ids) || !ids.length || ids.some((id) => !sourceIds.has(id))) errors.push(`${label}: unknown or missing source IDs.`); };
  const review = (r, label) => { if (r?.status !== "research-only" || r.reviewer !== null || r.date !== null) errors.push(`${label}: current catalog must remain research-only pending a separate approval release.`); };
  for (const r of data.regions) {
    if (!r || typeof r !== "object") { errors.push("Invalid region record."); continue; }
    if (!r.name || !r.scope || !r.climate || !Array.isArray(r.crops) || !Array.isArray(r.scenarios) || !r.scenarios.length) { errors.push(`Incomplete region ${r.id}.`); continue; }
    refs(r.sourceIds, r.id); review(r.review, r.id);
    const crops = unique(r.crops, r.id); unique(r.scenarios, `${r.id} scenarios`);
    for (const crop of r.crops) if (!crop?.label || !groups.has(crop?.group)) errors.push("Invalid crop record.");
    for (const s of r.scenarios) {
      if (!s || typeof s !== "object") { errors.push("Invalid scenario record."); continue; }
      if (!s.name || !s.note || !Array.isArray(s.phases) || s.phases.length < 2 || new Set(s.phases).size !== s.phases.length || s.phases.some((id) => !crops.has(id)) || typeof s.waterIntensification !== "boolean") errors.push(`Invalid sequence ${s.id}.`);
      refs(s.sourceIds, s.id);
    }
  }
  for (const b of data.benchmarks) {
    if (!b || typeof b !== "object") { errors.push("Invalid benchmark record."); continue; }
    refs([b.sourceId], b.id); review(b.review, b.id);
    if (!regions.has(b.regionId) || !["treatment-difference", "reported-rate", "qualitative", "unavailable"].includes(b.kind)) errors.push(`Invalid benchmark scope/type ${b.id}.`);
    for (const k of ["metric", "unit", "depth", "period", "design", "location", "sourceLocator", "limitation"]) if (!b[k]) errors.push(`${b.id}: missing ${k}.`);
    if (!["high", "medium", "low"].includes(b.confidence)) errors.push(`${b.id}: invalid confidence.`);
    if (b.sampleSize !== null && (!Number.isInteger(b.sampleSize) || b.sampleSize < 1)) errors.push(`${b.id}: invalid sample size.`);
    if (b.kind === "treatment-difference" && (![b.treatment, b.comparator].every(Number.isFinite) || b.value !== null || !b.comparatorLabel)) errors.push(`${b.id}: invalid treatment pair.`);
    if (b.kind === "reported-rate" && (!Number.isFinite(b.value) || b.treatment !== null || b.comparator !== null)) errors.push(`${b.id}: invalid rate.`);
    if (["qualitative", "unavailable"].includes(b.kind) && [b.value, b.treatment, b.comparator].some((v) => v !== null)) errors.push(`${b.id}: missing measurements must remain null.`);
  }
  for (const r of data.rules) {
    if (!r || typeof r !== "object") { errors.push("Invalid rule record."); continue; }
    refs(r.sourceIds, r.id); review(r.review, r.id);
    if (!Array.isArray(r.regionIds) || !r.regionIds.length || r.regionIds.some((id) => !regions.has(id)) || !RULE_CONDITIONS.has(r.when)) errors.push(`Unknown rule condition or region ${r.id}.`);
    if (!r.benefit || !r.risk || !Array.isArray(r.requiredInputs) || !r.requiredInputs.length || r.humanApproved !== false || !["water", "soil", "nitrogen", "disease"].includes(r.dimension)) errors.push(`Incomplete or unapproved rule ${r.id}.`);
  }
  return errors;
}
