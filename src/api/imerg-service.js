export const IMERG_ENDPOINT = "https://gis.earthdata.nasa.gov/portal/rest/services/GESDISC/GPM_3IMERGHH/ImageServer/getSamples";

export function buildImergUrl({ lat, lon }, startMs, endMs) {
  if (![lat, lon, startMs, endMs].every(Number.isFinite) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("Invalid IMERG request.");
  const params = new URLSearchParams({
    geometry: JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }),
    geometryType: "esriGeometryPoint",
    time: `${startMs},${endMs}`,
    returnFirstValueOnly: "false",
    outFields: "stdtime,variable,productname",
    f: "json"
  });
  return `${IMERG_ENDPOINT}?${params}`;
}

export function summarizeImergSamples(payloads, day) {
  if (!/^\d{8}$/.test(day)) throw new Error("Day must be YYYYMMDD.");
  const start = Date.parse(`${day.slice(0,4)}-${day.slice(4,6)}-${day.slice(6,8)}T00:00:00Z`);
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10).replaceAll("-", "") !== day) throw new Error("Invalid IMERG day.");
  const end = start + 24 * 3600000;
  const byTime = new Map();
  for (const payload of payloads) {
    if (!Array.isArray(payload?.samples)) throw new Error("NASA IMERG returned no sample array.");
    for (const sample of payload.samples) {
      if (sample?.attributes?.stdtime === null || sample?.attributes?.stdtime === undefined || sample?.value === null || sample?.value === undefined || sample?.value === "") continue;
      const time = Number(sample?.attributes?.stdtime);
      const value = Number(sample?.value);
      if (sample.attributes.variable && sample.attributes.variable !== "precipitation") continue;
      if (!Number.isFinite(time) || time < start || time >= end || (time - start) % 1800000 !== 0 || !Number.isFinite(value) || value < 0) continue;
      if (byTime.has(time) && Math.abs(byTime.get(time) - value) > 1e-6) throw new Error("IMERG returned conflicting values for a half-hour slot; no day total calculated.");
      byTime.set(time, value);
    }
  }
  const samples = [...byTime.entries()].sort((a, b) => a[0] - b[0]);
  if (samples.length !== 48) throw new Error(`IMERG returned only ${samples.length} of 48 valid half-hour slots; no day total calculated.`);
  return { sourceId: "nasa-gpm-imerg", day, value: samples.reduce((sum, [, rate]) => sum + rate * 0.5, 0), unit: "mm estimated accumulation", sampleCount: samples.length, resolution: "0.1° grid; 30-minute precipitation rates", time: `${day.slice(0,4)}-${day.slice(4,6)}-${day.slice(6,8)} UTC`, limitations: "Satellite-derived gridded estimate, not a field rain gauge; run and local accuracy are not verified; never a forecast." };
}

export async function queryImergDay(location, day, fetchImpl = globalThis.fetch) {
  if (!/^\d{8}$/.test(day)) throw new Error("Day must be YYYYMMDD.");
  const start = Date.parse(`${day.slice(0,4)}-${day.slice(4,6)}-${day.slice(6,8)}T00:00:00Z`);
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10).replaceAll("-", "") !== day) throw new Error("Invalid IMERG day.");
  const windows = [0, 8, 16].map((hour) => [start + hour * 3600000, start + (hour + 8) * 3600000]);
  const payloads = await Promise.all(windows.map(async ([from, to]) => {
    try {
      const response = await fetchImpl(buildImergUrl(location, from, to), { signal: AbortSignal.timeout(20000), headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`NASA IMERG returned ${response.status}.`);
      let payload;
      try { payload = await response.json(); }
      catch (error) { throw new Error("NASA IMERG returned invalid JSON.", { cause: error }); }
      if (payload?.error) throw new Error("NASA IMERG rejected the sample request.");
      return payload;
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") throw new Error("NASA IMERG timed out; retry later.", { cause: error });
      throw error;
    }
  }));
  return summarizeImergSamples(payloads, day);
}
