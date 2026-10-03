import { buildSoilQuery, parseSoilResponse } from "./soil-data.js";

export const SOIL_ENDPOINT = "https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest";

export async function querySoil(location, fetchImpl = globalThis.fetch) {
  const body = new URLSearchParams({ query: buildSoilQuery(location), format: "JSON" });
  const response = await fetchImpl(SOIL_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`USDA soil service returned ${response.status}.`);
  const payload = await response.json();
  if (payload?.error) throw new Error("USDA soil service rejected the query.");
  return parseSoilResponse(payload);
}
