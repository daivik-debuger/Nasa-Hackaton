export function describeConfidence({ rules, missing, soil, crops }) {
  const unapproved = rules.some((rule) => !rule.humanApproved) || crops.some((crop) => crop?.review?.status !== "approved-for-app");
  const reasons = [];
  if (unapproved) reasons.push("Research-only crop or rule evidence awaits named human review.");
  if (missing.length) reasons.push(`Missing: ${missing.join(", ")}.`);
  if (soil) reasons.push("SSURGO is a map-unit estimate with multiple possible components.");
  return { level: unapproved || missing.length ? "limited" : "contextual", reasons, humanApproved: !unapproved };
}
