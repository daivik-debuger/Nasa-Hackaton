import { GLOBAL_DEMO_LOCATIONS } from "../src/global-demo-locations.js";
import { fetchPowerData } from "../src/nasa-power.js";
import { summarizePowerPayload } from "../src/climate.js";

// Live, opt-in check using public city-area coordinates only; not a farmer field.
// A passing result shows these point/year API requests returned valid values,
// not that every place, date, NASA product, or agronomic use is validated.
const year = 2024;
let failures = 0;
for (const place of GLOBAL_DEMO_LOCATIONS) {
  const location = { lat: place.lat, lon: place.lon, start: year, end: year };
  try {
    const payload = await fetchPowerData(location);
    const summary = summarizePowerPayload(payload, location);
    if (summary.count < 360 || summary.rainfallCount < 360) throw new Error("Too few valid daily temperature or precipitation values.");
    console.log(`PASS ${place.label}: ${summary.count} temperature days; ${summary.rainfallCount} rainfall days (${year}).`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${place.label}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
