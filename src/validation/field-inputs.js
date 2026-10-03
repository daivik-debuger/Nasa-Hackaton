import { validateFieldQuery } from "../climate.js";

export function validatePilotLocation(input, region, options) {
  const location = validateFieldQuery(input, options);
  const b = region.bounds;
  if (location.lat < b.south || location.lat > b.north || location.lon < b.west || location.lon > b.east) {
    throw new Error(`This evidence catalog is limited to ${region.name}. Choose a point inside the pilot area.`);
  }
  return location;
}

export function validateFarmInputs(input, cropIds) {
  const errors = [];
  for (const key of ["lastCrop", "priorCrop"]) if (input[key] && !cropIds.has(input[key])) errors.push(`${key} is not in the pilot crop catalog.`);
  if (input.soilPh !== "" && input.soilPh !== null && input.soilPh !== undefined) {
    const ph = Number(input.soilPh);
    if (!Number.isFinite(ph) || ph < 0 || ph > 14) errors.push("Soil pH must be between 0 and 14, or left blank.");
  }
  if (errors.length) throw new Error(errors.join(" "));
  return { ...input, soilPh: input.soilPh === "" ? null : Number(input.soilPh) };
}
