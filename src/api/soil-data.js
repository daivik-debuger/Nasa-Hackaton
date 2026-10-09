export function buildSoilQuery({ lat, lon }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("Invalid soil lookup coordinates.");
  const point = `POINT(${lon.toFixed(6)} ${lat.toFixed(6)})`;
  return `SELECT TOP 80 mu.mukey, mu.musym, mu.muname, agg.flodfreqdcd, agg.aws0100wta, c.cokey, c.compname, c.comppct_r, c.drainagecl, ch.hzdept_r, ch.hzdepb_r, ch.awc_r, tg.texture FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${point}') s JOIN mapunit mu ON mu.mukey=s.mukey LEFT JOIN muaggatt agg ON agg.mukey=mu.mukey LEFT JOIN component c ON c.mukey=mu.mukey LEFT JOIN chorizon ch ON ch.cokey=c.cokey LEFT JOIN chtexturegrp tg ON tg.chkey=ch.chkey AND tg.rvindicator='Yes' ORDER BY c.comppct_r DESC, ch.hzdept_r`;
}

const numberOrNull = (value) => value === null || value === "" || value === undefined ? null : Number.isFinite(Number(value)) ? Number(value) : null;

export function parseSoilResponse(payload) {
  const raw = payload?.Table;
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("No SSURGO map unit was returned for this point.");
  const rows = raw.map((row) => Array.isArray(row) ? row : [row.mukey, row.musym, row.muname, row.flodfreqdcd, row.aws0100wta, row.cokey, row.compname, row.comppct_r, row.drainagecl, row.hzdept_r, row.hzdepb_r, row.awc_r, row.texture]);
  const first = rows[0];
  const components = new Map();
  for (const row of rows) {
    const key = String(row[5] ?? row[6] ?? "unknown");
    if (!components.has(key)) components.set(key, { name: row[6] || "Unnamed component", percent: numberOrNull(row[7]), drainage: row[8] || null, horizons: [] });
    const top = numberOrNull(row[9]), bottom = numberOrNull(row[10]);
    if (top !== null || bottom !== null) components.get(key).horizons.push({ topCm: top, bottomCm: bottom, availableWaterCapacityCmPerCm: numberOrNull(row[11]), texture: row[12] || null });
  }
  const result = {
    sourceId: "usda-ssurgo",
    mapUnit: { key: String(first[0]), symbol: first[1] || null, name: first[2] || null },
    floodingFrequency: first[3] || null,
    availableWaterStorage0to100Cm: numberOrNull(first[4]),
    components: [...components.values()],
    truncated: raw.length >= 80,
    depthRepresentedCm: Math.max(0, ...[...components.values()].flatMap((c) => c.horizons.map((h) => h.bottomCm ?? 0))),
    limitations: "Mapped polygon with possible components and horizon estimates, not a laboratory test or exact field profile."
  };
  result.missing = [
    !result.floodingFrequency && "flooding frequency",
    result.availableWaterStorage0to100Cm === null && "0–100 cm available water storage",
    result.components.every((c) => !c.drainage) && "drainage class",
    result.components.every((c) => c.horizons.every((h) => !h.texture)) && "texture"
  ].filter(Boolean);
  if (result.truncated) result.missing.push("additional components or horizons may be omitted by the 80-row service limit");
  return result;
}

export async function fetchSoilData(location, fetchImpl = globalThis.fetch) {
  const query = new URLSearchParams({ latitude: String(location.lat), longitude: String(location.lon) });
  const response = await fetchImpl(`/api/soil?${query}`, { headers: { Accept: "application/json" } });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error || `Soil service returned ${response.status}.`);
  if (body?.sourceId !== "usda-ssurgo" || !body.mapUnit?.key || !Array.isArray(body.components) || !body.components.length || !body.components.every((component) => Array.isArray(component.horizons)) || !Array.isArray(body.missing)) throw new Error("Soil service returned an incomplete mapped-soil response.");
  return body;
}
