export async function fetchImergDay(location, day, fetchImpl = globalThis.fetch) {
  const query = new URLSearchParams({ latitude: String(location.lat), longitude: String(location.lon), day });
  const response = await fetchImpl(`/api/imerg?${query}`, { headers: { Accept: "application/json" } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `IMERG service returned ${response.status}.`);
  return body;
}
