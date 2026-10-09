import { buildSoilQuery, parseSoilResponse } from "./soil-data.js";

export const SOIL_ENDPOINT = "https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest";

export async function querySoil(location, fetchImpl = globalThis.fetch) {
  const body = new URLSearchParams({ query: buildSoilQuery(location), format: "JSON" });
  let response;
  try {
    response = await fetchImpl(SOIL_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body, signal: AbortSignal.timeout(20000) });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") throw new Error("USDA soil service timed out; retry later.", { cause: error });
    throw new Error("Could not reach USDA soil service.", { cause: error });
  }
  if (!response.ok) throw new Error(`USDA soil service returned ${response.status}.`);
  let payload;
  try { payload = await response.json(); }
  catch (error) { throw new Error("USDA soil service returned invalid JSON.", { cause: error }); }
  if (payload?.error) throw new Error("USDA soil service rejected the query.");
  return parseSoilResponse(payload);
}
