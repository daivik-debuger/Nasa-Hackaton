export const POWER_DAILY_ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point";
export const POWER_PARAMETERS = ["T2M", "T2M_MAX", "PRECTOTCORR"];

export function buildPowerUrl(location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lon) || location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180 || !Number.isInteger(location.start) || !Number.isInteger(location.end) || location.start < 1981 || location.end < location.start || location.end >= new Date().getUTCFullYear()) throw new Error("Invalid NASA POWER coordinates or year range.");
  const query = new URLSearchParams({
    parameters: POWER_PARAMETERS.join(","),
    community: "AG",
    longitude: String(location.lon),
    latitude: String(location.lat),
    start: `${location.start}0101`,
    end: `${location.end}1231`,
    "time-standard": "UTC",
    format: "JSON"
  });
  return `${POWER_DAILY_ENDPOINT}?${query.toString()}`;
}

export async function fetchPowerData(location, fetchImpl = globalThis.fetch) {
  const url = buildPowerUrl(location);
  let response;
  try {
    response = await fetchImpl(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  } catch (cause) {
    const error = new Error("Could not reach NASA POWER.", { cause });
    error.code = "network";
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`NASA POWER returned ${response.status}. Check the coordinates or try again later.`);
    error.code = "http";
    error.status = response.status;
    throw error;
  }
  try { return await response.json(); }
  catch (cause) { throw new Error("NASA POWER returned invalid JSON.", { cause }); }
}
