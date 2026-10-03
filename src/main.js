import { summarizePowerPayload } from "./climate.js";
import { fetchPowerData } from "./api/nasa-power.js";
import { fetchSoilData } from "./api/soil-data.js";
import { fetchImergDay } from "./api/imerg.js";
import { validatePilotLocation, validateFarmInputs } from "./validation/field-inputs.js";
import { buildIndicators } from "./engine/indicators.js";
import { compareStrategies } from "./engine/compare-strategies.js";
import { renderClimate, renderImerg } from "./ui/climate-view.js";
import { renderSoil } from "./ui/soil-view.js";
import { renderStrategies } from "./ui/strategy-view.js";
import { setStatus } from "./ui/status-view.js";

const $ = (id) => document.getElementById(id);
const lastFullYear = new Date().getUTCFullYear() - 1;
const state = { region: null, crops: [], rules: [], evidence: [], sources: [], power: null, soil: null, imerg: null };

for (const id of ["startYear", "endYear"]) {
  for (let year = lastFullYear; year >= 1981; year--) $(id).add(new Option(String(year), String(year)));
}
$("startYear").value = String(Math.max(1981, lastFullYear - 4));
$("endYear").value = String(lastFullYear);

async function json(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.json();
}

async function loadCatalog() {
  const [region, manifest, evidence, rules, sources] = await Promise.all([
    json("./data/regions/central-iowa.json"), json("./data/crops.json"), json("./data/evidence.json"), json("./data/rotation-rules.json"), json("./data/sources.json")
  ]);
  if (manifest.regionId !== region.id || evidence.regionId !== region.id || rules.regionId !== region.id) throw new Error("Pilot data has mismatched region IDs.");
  const crops = await Promise.all(manifest.cropFiles.map((id) => json(`./data/crops/${id}.json`)));
  Object.assign(state, { region, crops, evidence: evidence.records, rules: rules.rules, sources: sources.sources });
  const historyCrops = crops.filter((crop) => crop.roles.some((role) => role !== "cover"));
  for (const id of ["lastCrop", "priorCrop"]) for (const crop of historyCrops) $(id).add(new Option(crop.commonName, crop.id));
  setStatus($("climateStatus"), "Central Iowa pilot catalog loaded. Enter your field history, then load climate and soil context.");
}

function locationInput() {
  if (!state.region) throw new Error("Pilot catalog is still loading.");
  return validatePilotLocation({ latitude: $("latitude").value, longitude: $("longitude").value, startYear: $("startYear").value, endYear: $("endYear").value }, state.region, { lastFullYear });
}

function farmInput() {
  const priorities = [...document.querySelectorAll(".priority-options input:checked")].map((element) => element.value);
  return validateFarmInputs({ lastCrop: $("lastCrop").value, priorCrop: $("priorCrop").value, soilTexture: $("soilTexture").value, soilPh: $("soilPh").value, priorities, harvestDate: null, terminationPlan: null, marketAccess: null, equipment: null, soilTest: $("soilPh").value ? "pH only" : null, diseaseHistory: null }, new Set(state.crops.map((crop) => crop.id)));
}

function updateComparison() {
  const location = locationInput();
  const input = farmInput();
  const indicators = buildIndicators(state);
  const strategies = compareStrategies({ input, indicators, soil: state.soil, crops: state.crops, rules: state.rules, evidence: state.evidence });
  renderStrategies(strategies, new Map(state.sources.map((source) => [source.id, source])));
  const name = $("fieldName").value.trim() || "Unnamed field";
  $("inputSummary").textContent = `${name} · ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}. History: ${input.priorCrop || "unknown"} → ${input.lastCrop || "unknown"}. Farmer soil texture: ${input.soilTexture || "unknown"}; lab pH: ${input.soilPh ?? "not provided"}. Priorities: ${prioritiesText(input.priorities)}. Entries are not saved.`;
}

function prioritiesText(priorities) { return priorities.length ? priorities.join(", ") : "none selected"; }

$("loadClimate").addEventListener("click", async () => {
  const button = $("loadClimate");
  try {
    const location = locationInput();
    button.disabled = true;
    state.power = state.soil = state.imerg = null;
    setStatus($("climateStatus"), "Loading NASA POWER history and USDA mapped soil…");
    const [powerResult, soilResult] = await Promise.allSettled([fetchPowerData(location), fetchSoilData(location)]);
    const failures = [];
    if (powerResult.status === "fulfilled") {
      state.power = summarizePowerPayload(powerResult.value, location);
      renderClimate(state.power);
      const wettest = state.power.wettestGrowingSeasonDay;
      if (wettest) {
        setStatus($("climateStatus"), "POWER loaded. Sampling NASA GPM IMERG for the matched wettest growing-season day…");
        try { state.imerg = await fetchImergDay(location, wettest.day); }
        catch (error) { failures.push(`IMERG: ${error.message}`); }
        renderImerg(state.imerg, wettest.day, wettest.value);
      } else { failures.push("No valid POWER growing-season day for IMERG cross-check."); renderImerg(null); }
    } else { failures.push(`POWER: ${powerResult.reason.message}`); renderImerg(null); }
    if (soilResult.status === "fulfilled") { state.soil = soilResult.value; renderSoil(state.soil); }
    else { failures.push(`SSURGO: ${soilResult.reason.message}`); renderSoil(null); }
    setStatus($("climateStatus"), failures.length ? `Partial data loaded. ${failures.join(" ")} Missing sources remain visible in strategy confidence.` : "NASA POWER, NASA GPM IMERG and USDA SSURGO loaded. These are mapped estimates, not field measurements.", failures.length ? "error" : "success");
    updateComparison();
  } catch (error) { setStatus($("climateStatus"), error.message, "error"); }
  finally { button.disabled = false; }
});

$("summarize").addEventListener("click", () => {
  try { updateComparison(); setStatus($("climateStatus"), "Three research-only exploratory patterns updated. Open each “Why this strategy?” panel for evidence and missing information.", "success"); }
  catch (error) { setStatus($("climateStatus"), error.message, "error"); }
});

loadCatalog().catch((error) => setStatus($("climateStatus"), `Pilot catalog could not load: ${error.message}`, "error"));

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
