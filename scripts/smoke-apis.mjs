import { fetchPowerData } from "../src/nasa-power.js";
import { querySoil } from "../src/api/soil-service.js";
import { queryImergDay } from "../src/api/imerg-service.js";

// Public demonstration point only. This script never sends a private field location.
const point = { lat: 42.035, lon: -93.55 };
const day = "20250520";
const checks = [
  ["NASA POWER", async () => {
    const data = await fetchPowerData({ ...point, start: 2025, end: 2025 });
    if (!data?.properties?.parameter?.T2M || !data?.properties?.parameter?.PRECTOTCORR) throw new Error("Required daily variables are missing.");
    return "daily temperature and precipitation returned";
  }],
  ["USDA SSURGO", async () => {
    const data = await querySoil(point);
    if (!data?.mapUnit?.key || !data.components?.length) throw new Error("Map unit or components are missing.");
    return `map unit ${data.mapUnit.symbol || data.mapUnit.key}; ${data.components.length} possible components`;
  }],
  ["NASA GPM IMERG", async () => {
    const data = await queryImergDay(point, day);
    if (data.sampleCount !== 48 || !Number.isFinite(data.value)) throw new Error("Full-day precipitation is incomplete.");
    return `${data.sampleCount} valid half-hour slots on ${day}`;
  }]
];

const results = await Promise.allSettled(checks.map(([, run]) => run()));
for (let index = 0; index < results.length; index++) {
  const result = results[index];
  console.log(`${result.status === "fulfilled" ? "PASS" : "FAIL"} ${checks[index][0]}: ${result.status === "fulfilled" ? result.value : result.reason.message}`);
}
if (results.some((result) => result.status === "rejected")) process.exitCode = 1;
