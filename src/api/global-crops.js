export async function fetchGlobalPlants(query, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(`/api/crops/search?q=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
  let body;
  try { body = await response.json(); }
  catch { throw new Error("The crop-name service returned unreadable data."); }
  if (!response.ok) throw new Error(body?.error || `Crop-name search failed (${response.status}).`);
  if (body?.sourceId !== "gbif-species-api" || !Array.isArray(body.matches)) throw new Error("The crop-name service returned incomplete results.");
  return body;
}
