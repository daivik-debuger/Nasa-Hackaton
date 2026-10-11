const CHECKLIST = "7ddf754f-d193-4cc9-b351-99906754a03b";
const ENDPOINT = "https://api.gbif.org/v1/species/search";

// Common-name shortcuts are search terms, not reviewed crop-trait records.
const aliases = new Map(Object.entries({
  rice: "Oryza sativa", maize: "Zea mays", corn: "Zea mays", wheat: "Triticum aestivum",
  soybean: "Glycine max", soybeans: "Glycine max", potato: "Solanum tuberosum",
  cassava: "Manihot esculenta", sorghum: "Sorghum bicolor", barley: "Hordeum vulgare",
  oats: "Avena sativa", chickpea: "Cicer arietinum", lentil: "Lens culinaris",
  sunflower: "Helianthus annuus", cotton: "Gossypium hirsutum", tomato: "Solanum lycopersicum"
}));

export function globalCropQuery(raw) {
  const term = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (term.length < 2 || term.length > 80 || !/^[\p{L}\p{M}\p{N} .'-]+$/u.test(term)) {
    const error = new Error("Enter a crop or scientific plant name (2–80 letters).");
    error.status = 400;
    throw error;
  }
  return { entered: term, lookup: aliases.get(term.toLocaleLowerCase("en")) || term };
}

export function normalizeGbifPlants(payload) {
  if (!payload || !Array.isArray(payload.results)) throw new Error("GBIF returned an incomplete plant-name response.");
  const seen = new Set();
  return payload.results.filter((item) => item?.kingdom === "Plantae" && item.rank === "SPECIES"
    && item.taxonomicStatus === "ACCEPTED" && Number.isSafeInteger(item.key)
    && typeof item.canonicalName === "string" && item.canonicalName.trim())
    .filter((item) => { const name = item.canonicalName.toLocaleLowerCase(); if (seen.has(name)) return false; seen.add(name); return true; })
    .slice(0, 12).map((item) => ({
      key: item.key,
      scientificName: item.canonicalName,
      family: typeof item.family === "string" ? item.family : null,
      url: `https://www.gbif.org/species/${item.key}`
    }));
}

export async function searchGlobalPlants(raw, fetchImpl = globalThis.fetch) {
  const { entered, lookup } = globalCropQuery(raw);
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({ q: lookup, rank: "SPECIES", datasetKey: CHECKLIST, limit: "50" }).toString();
  let response;
  try { response = await fetchImpl(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error("The live GBIF lookup is unavailable. Try again or use FAO Ecocrop."); }
  if (!response.ok) throw new Error(`GBIF lookup failed (${response.status}). Try again later.`);
  let body;
  try { body = await response.json(); }
  catch { throw new Error("GBIF returned unreadable data. Try again later."); }
  const candidates = normalizeGbifPlants(body);
  // GBIF full-text search also matches descriptions and common names of unrelated plants.
  // A resolved crop or supplied binomial must match the actual accepted species name.
  const exactName = lookup.includes(" ") ? lookup.toLocaleLowerCase("en") : null;
  const matches = exactName ? candidates.filter((plant) => plant.scientificName.toLocaleLowerCase("en") === exactName) : candidates;
  return { sourceId: "gbif-species-api", query: entered, lookup, matches };
}
