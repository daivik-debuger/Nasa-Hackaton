export const POWER_DAILY_ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point";
export const POWER_PARAMETERS = ["T2M", "T2M_MAX", "PRECTOTCORR"];

export function buildPowerUrl(location) {
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
  let response;
  try {
    response = await fetchImpl(buildPowerUrl(location), { headers: { Accept: "application/json" } });
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
  return response.json();
}
