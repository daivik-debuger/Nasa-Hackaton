// Public city-area examples for testing geographic coverage, not verified farm fields.
export const GLOBAL_DEMO_LOCATIONS = Object.freeze([
  { id: "iowa", label: "Near Ames, United States · Iowa pilot", lat: 42.035, lon: -93.55 },
  { id: "brazil", label: "Brasília, Brazil · South America", lat: -15.7939, lon: -47.8828 },
  { id: "kenya", label: "Nairobi, Kenya · Africa", lat: -1.2921, lon: 36.8219 },
  { id: "india", label: "Pune, India · Asia", lat: 18.5204, lon: 73.8567 },
  { id: "australia", label: "Brisbane, Australia · Oceania", lat: -27.4698, lon: 153.0251 },
  { id: "spain", label: "Madrid, Spain · Europe", lat: 40.4168, lon: -3.7038 }
]);

export function demoLocation(id) {
  return GLOBAL_DEMO_LOCATIONS.find((location) => location.id === id) ?? null;
}
