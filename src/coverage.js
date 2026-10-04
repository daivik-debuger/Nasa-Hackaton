function contains(region, { lat, lon }) {
  const { south, north, west, east } = region.bounds;
  return lat >= south && lat <= north && lon >= west && lon <= east;
}

export function resolveCoverage(location, regions) {
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon) || location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180) {
    throw new Error("Enter valid global coordinates before checking coverage.");
  }
  const region = regions.find((candidate) => contains(candidate, location)) ?? null;
  return {
    region,
    climate: "requestable",
    soil: region ? "requestable" : "not-yet-supported",
    rotation: region ? "research-only" : "not-yet-supported",
    soilSourceId: region ? "usda-ssurgo" : null
  };
}
