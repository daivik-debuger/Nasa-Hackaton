import { validateAgronomy } from "../agronomy-validation.js";

const blank = (v) => v === null || v === undefined || v === "";
const day = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value ? date : null;
};

// Matched observed differences; no carbon conversion, prediction, or significance inference.
export function pairedSoilChange(pair, kind) {
  const unit = kind === "som" ? "percentage points" : "g/cm³";
  if (!pair || [pair.before, pair.after].every(blank)) return { delta: null, unit, reason: "No paired laboratory measurements supplied." };
  const before = Number(pair.before), after = Number(pair.after);
  const maximum = kind === "som" ? 100 : 3;
  if ([pair.before, pair.after].some(blank) || ![before, after].every((v) => Number.isFinite(v) && v >= 0 && v <= maximum) || kind !== "som" && (before === 0 || after === 0)) throw new Error(`Enter two valid ${kind === "som" ? "SOM percentages (0–100)" : "bulk densities (>0–3 g/cm³)"}.`);
  const start = day(pair.beforeDate), end = day(pair.afterDate);
  if (!start || !end || end <= start) throw new Error("Soil sample dates must be valid and increase in time.");
  if (!pair.sameProtocol || blank(pair.depthCm) || !Number.isFinite(Number(pair.depthCm)) || Number(pair.depthCm) <= 0 || Number(pair.depthCm) > 200 || !String(pair.method || "").trim()) return { delta: null, unit, reason: "Confirm the same field, season, depth and laboratory method; supply depth and method." };
  return { delta: Number((after - before).toFixed(4)), unit, before, after, beforeDate: pair.beforeDate, afterDate: pair.afterDate, depthCm: Number(pair.depthCm), method: pair.method.trim(), reason: "Farmer-entered paired difference; sampling uncertainty and significance are unknown." };
}

export function precipitationContext(power) {
  if (!power?.params?.PRECTOTCORR || !Number.isInteger(Number(power.start)) || !Number.isInteger(Number(power.end))) return { years: [], departurePct: null, drySpellDays: null, missing: "Load NASA POWER daily history." };
  if (Number(power.start) < 1981 || Number(power.end) > new Date().getUTCFullYear() || Number(power.end) < Number(power.start)) return { years: [], departurePct: null, drySpellDays: null, missing: "POWER year range is invalid." };
  const years = [];
  for (let year = Number(power.start); year <= Number(power.end); year++) {
    let total = 0, count = 0, longest = 0, run = 0, expected = 0;
    for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += 86400000) {
      expected++;
      const key = new Date(t).toISOString().slice(0, 10).replaceAll("-", "");
      const raw = power.params.PRECTOTCORR[key];
      if (blank(raw) || !Number.isFinite(Number(raw)) || Number(raw) === power.fillValue || Number(raw) < 0) { run = 0; continue; }
      const value = Number(raw); count++; total += value;
      run = value < 1 ? run + 1 : 0; longest = Math.max(longest, run);
    }
    years.push({ year, total, count, expected, complete: count === expected, longest });
  }
  const latest = years.at(-1), baseline = years.slice(0, -1).filter((y) => y.complete);
  const mean = baseline.length ? baseline.reduce((sum, y) => sum + y.total, 0) / baseline.length : null;
  return { years, departurePct: latest?.complete && mean > 0 ? (latest.total - mean) / mean * 100 : null,
    baselineYears: baseline.map((y) => y.year), drySpellDays: latest?.complete ? latest.longest : null,
    missing: !latest?.complete ? "Latest calendar year has missing precipitation; no annual departure or complete dry-spell indicator." : !baseline.length ? "Choose at least two complete years for a within-period comparison." : null,
    sourceId: "nasa-power-daily", unit: "mm", label: "Days below 1 mm are a descriptive convention; departure is relative to selected years, not a climate normal or drought diagnosis." };
}

export function compareRegionalStrategies({ catalog, sourceIds, input, power = null }) {
  const errors = validateAgronomy(catalog, sourceIds);
  if (errors.length) throw new Error(`Invalid comparison catalog: ${errors[0]}`);
  const region = catalog.regions.find((r) => r.id === input.regionId);
  if (!region) throw new Error("Choose an available evidence region.");
  if (input.mode !== "reference-scenario") throw new Error("These regional packs support reference scenarios only; field recommendation approval is pending.");
  const byId = new Map(region.crops.map((c) => [c.id, c]));
  if (!byId.has(input.lastCrop)) throw new Error("Choose a last crop listed in this regional scenario pack.");
  if (input.nextCrop && !byId.has(input.nextCrop)) throw new Error("The required next crop is not in this region.");
  for (const key of ["waterSupply", "forageOutlet", "nodulation", "diseaseHistory", "allowFallow"]) if (!["unknown", "yes", "no"].includes(input[key])) throw new Error(`Choose a valid ${key} response.`);
  if (!Array.isArray(input.priorities) || input.priorities.some((p) => !["water", "soil", "nitrogen", "disease"].includes(p))) throw new Error("Invalid comparison priority.");
  const som = pairedSoilChange(input.som, "som"), density = pairedSoilChange(input.density, "density");
  const climate = precipitationContext(power);
  const scenarios = region.scenarios.map((scenario) => {
    // Catalog cycles have unique phase IDs, so history selects one unambiguous next phase.
    const anchor = scenario.phases.indexOf(input.lastCrop);
    const sequence = anchor < 0 ? [] : [...scenario.phases.slice(anchor + 1), ...scenario.phases.slice(0, anchor + 1)].map((id) => byId.get(id));
    const excluded = [];
    if (anchor < 0) excluded.push("Last crop is absent from this documented cycle; transition evidence is missing.");
    if (input.nextCrop && sequence[0]?.id !== input.nextCrop) excluded.push("Does not meet your required next crop.");
    if (input.allowFallow === "no" && sequence.some((c) => c.group === "fallow")) excluded.push("Conflicts with your no-fallow constraint.");
    if (scenario.requiresForage && input.forageOutlet === "no") excluded.push("Requires a forage outlet you marked unavailable.");
    const path = [byId.get(input.lastCrop), ...sequence];
    const cerealTransition = path.some((crop, index) => index > 0 && ["wheat", "winter-wheat", "barley"].includes(crop.id) && path[index - 1].group === "cereal");
    const facts = { hasLegume: sequence.some((c) => c.group === "legume"), waterIntensification: scenario.waterIntensification, cerealTransition, somDeclining: som.delta !== null && som.delta < 0, densityIncreasing: density.delta !== null && density.delta > 0 };
    const rules = sequence.length ? catalog.rules.filter((r) => r.regionIds.includes(region.id) && facts[r.when]).map((r) => ({ ...r, priority: input.priorities.includes(r.dimension) })) : [];
    const required = new Set(rules.flatMap((r) => r.requiredInputs));
    if (scenario.requiresForage) required.add("forageOutlet");
    const missing = [...required].filter((key) => input[key] === "unknown" || input[key] == null);
    if (som.delta === null) missing.push("comparable SOM samples");
    if (density.delta === null) missing.push("comparable bulk-density samples");
    if (climate.missing) missing.push(climate.missing);
    const concerns = [];
    if (facts.waterIntensification && input.waterSupply === "no") concerns.push("Stored water is marked limited: the added crop phase requires local water-budget review.");
    if (facts.hasLegume && input.nodulation === "no") concerns.push("Nodulation is unconfirmed/unsuccessful: no nitrogen credit can be assumed.");
    if (input.diseaseHistory === "yes") concerns.push("Known disease history: a local pathogen assessment is required before using this sequence.");
    if (facts.waterIntensification && climate.departurePct !== null && climate.departurePct < 0) concerns.push("Latest complete POWER year was drier than the selected baseline; review water demand with current soil measurements.");
    return { ...scenario, sequence, excluded, concerns, rules, missing: [...new Set(missing)], functionalGroups: new Set(sequence.filter((c) => c.group !== "fallow").map((c) => c.group)).size,
      status: excluded.length ? "constraint-conflict" : "research-review-required", humanApproved: false, confidence: "limited", nitrogenCreditKgHa: null, predictedSomChange: null };
  });
  return { region, scenarios, som, density, climate, mode: input.mode, priorities: input.priorities, inputUsed: input, approval: "No regional pack has named agronomist approval. Outputs compare documented reference cycles; local suitability is unvalidated." };
}
