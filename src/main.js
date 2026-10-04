import { summarizePowerPayload, validateFieldQuery } from "./climate.js";
import { resolveCoverage } from "./coverage.js";
import { GLOBAL_DEMO_LOCATIONS, demoLocation } from "./global-demo-locations.js";
import { fetchPowerData } from "./api/nasa-power.js";
import { fetchSoilData } from "./api/soil-data.js";
import { fetchImergDay } from "./api/imerg.js";
import { validateFarmInputs } from "./validation/field-inputs.js";
import { buildIndicators } from "./engine/indicators.js";
import { compareStrategies } from "./engine/compare-strategies.js";
import { renderClimate, renderImerg } from "./ui/climate-view.js";
import { renderSoil } from "./ui/soil-view.js";
import { renderStrategies } from "./ui/strategy-view.js";
import { setStatus } from "./ui/status-view.js";

const $ = (id) => document.getElementById(id);
const lastFullYear = new Date().getUTCFullYear() - 1;
const state = { region: null, crops: [], rules: [], evidence: [], sources: [], power: null, soil: null, imerg: null, requestId: 0 };

for (const location of GLOBAL_DEMO_LOCATIONS) $("demoLocation").add(new Option(location.label, location.id));
$("demoLocation").value = "iowa";
$("demoLocation").addEventListener("change", () => {
  const selected = demoLocation($("demoLocation").value);
  $("latitude").value = selected ? String(selected.lat) : "";
  $("longitude").value = selected ? String(selected.lon) : "";
  clearLoadedData();
});
for (const id of ["latitude", "longitude"]) $(id).addEventListener("input", () => { $("demoLocation").value = ""; });

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
  updateCoverage();
  setStatus($("climateStatus"), "Catalog loaded. Load available Earth-observation context for your location.");
}

function locationInput() {
  return validateFieldQuery({ latitude: $("latitude").value, longitude: $("longitude").value, startYear: $("startYear").value, endYear: $("endYear").value }, { lastFullYear });
}

function coverage() {
  return resolveCoverage(locationInput(), state.region ? [state.region] : []);
}

function updateCoverage() {
  try {
    const result = coverage();
    const supported = Boolean(result.region);
    setStatus($("coverageStatus"), supported ? "NASA POWER climate context is available to request worldwide. At this Iowa point, mapped SSURGO soil and research-only rotation patterns can also be explored." : "NASA POWER climate context is available to request worldwide. Mapped soil and regional crop-rotation evidence are not yet supported for this location.");
    for (const id of ["lastCrop", "priorCrop", "summarize"]) $(id).disabled = !supported;
    if (!supported) {
      $("strategies").textContent = "No region-validated crop catalog for this location yet. Iowa rotation patterns will not be applied here.";
      $("inputSummary").textContent = "No local rotation comparison is available for this location. Field notes are not saved.";
    } else if (!$("strategies").querySelector(".strategy-card")) {
      $("strategies").textContent = "Add crop history and choose a priority, then compare three Central Iowa exploratory patterns.";
    }
    return result;
  } catch (error) {
    setStatus($("coverageStatus"), error.message, "error");
    for (const id of ["lastCrop", "priorCrop", "summarize"]) $(id).disabled = true;
    return null;
  }
}

function clearLoadedData() {
  state.requestId++;
  state.power = state.soil = state.imerg = null;
  renderClimate(null);
  renderImerg(null, null, null, "not-loaded");
  renderSoil(null, "Load data to see mapped soil where a supported provider exists.");
  $("strategies").textContent = "Location or period changed. Load data again to compare available context.";
  setStatus($("climateStatus"), "Location or period changed. Load available data again.");
  updateCoverage();
}

function farmInput() {
  const priorities = [...document.querySelectorAll(".priority-options input:checked")].map((element) => element.value);
  return validateFarmInputs({ lastCrop: $("lastCrop").value, priorCrop: $("priorCrop").value, soilTexture: $("soilTexture").value, soilPh: $("soilPh").value, priorities, harvestDate: null, terminationPlan: null, marketAccess: null, equipment: null, soilTest: $("soilPh").value ? "pH only" : null, diseaseHistory: null }, new Set(state.crops.map((crop) => crop.id)));
}

function updateComparison() {
  const location = locationInput();
  const available = coverage();
  if (!available.region) {
    $("strategies").textContent = "No region-validated crop catalog for this location yet. Iowa rotation patterns will not be applied here.";
    $("inputSummary").textContent = `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)} · Climate context only. No local crop-rotation comparison is available; entries are not saved.`;
    return;
  }
  const input = farmInput();
  if (!input.lastCrop) {
    $("strategies").textContent = "Choose what grew last season before comparing regional rotation patterns. No crop sequence has been assumed.";
    $("inputSummary").textContent = "Last season's crop is missing. Your entries remain on this page and are not saved.";
    return;
  }
  if (!["corn", "soybean"].includes(input.lastCrop)) {
    $("strategies").textContent = "This Iowa rule set currently compares histories ending in corn or soybean. Other crop histories need additional reviewed rotation evidence; no sequence was guessed.";
    $("inputSummary").textContent = `Last crop: ${input.lastCrop}. No evidence-linked sequence is available for this history. Entries are not saved.`;
    return;
  }
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
    const available = coverage();
    const requestId = ++state.requestId;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Loading available data…";
    state.power = state.soil = state.imerg = null;
    renderClimate(null);
    renderImerg(null, null, null, "not-loaded");
    renderSoil(null, available.soil === "requestable" ? "Loading mapped soil context…" : "Mapped soil lookup is not yet supported for this location.");
    setStatus($("climateStatus"), available.soil === "requestable" ? "Loading NASA POWER history and USDA mapped soil…" : "Loading worldwide NASA POWER climate context…");
    const [powerResult, soilResult] = await Promise.allSettled([fetchPowerData(location), available.soil === "requestable" ? fetchSoilData(location) : Promise.resolve(null)]);
    if (requestId !== state.requestId) return;
    const failures = [];
    if (powerResult.status === "fulfilled") {
      state.power = summarizePowerPayload(powerResult.value, location);
      renderClimate(state.power);
      const wettest = state.power.wettestReferenceDay;
      if (wettest) {
        setStatus($("climateStatus"), "POWER loaded. Sampling NASA GPM IMERG for the matched wettest day…");
        try { state.imerg = await fetchImergDay(location, wettest.day); }
        catch (error) { failures.push(`IMERG: ${error.message}`); }
        if (requestId !== state.requestId) return;
        renderImerg(state.imerg, wettest.day, wettest.value);
      } else { failures.push("No valid POWER day in the end year for an IMERG cross-check."); renderImerg(null); }
    } else { failures.push(`POWER: ${powerResult.reason.message}`); renderImerg(null); }
    if (available.soil === "not-yet-supported") renderSoil(null, "Mapped soil lookup is not yet supported for this location. No Iowa soil values were applied. A local soil test remains important.");
    else if (soilResult.status === "fulfilled") { state.soil = soilResult.value; renderSoil(state.soil); }
    else { failures.push(`SSURGO: ${soilResult.reason.message}`); renderSoil(null); }
    const success = available.region ? "NASA observations and USDA mapped soil loaded for the Central Iowa demonstration. These are mapped estimates, not field measurements." : "NASA observation context loaded. Soil and region-specific crop comparisons are not yet supported here.";
    setStatus($("climateStatus"), failures.length ? `Partial data loaded. ${failures.join(" ")} Missing sources remain visible.` : success, failures.length ? "error" : "success");
    button.textContent = failures.length ? "Retry data load" : "Refresh data";
    updateComparison();
  } catch (error) { setStatus($("climateStatus"), error.message, "error"); button.textContent = "Retry data load"; }
  finally { button.disabled = false; button.removeAttribute("aria-busy"); }
});

$("summarize").addEventListener("click", () => {
  try { updateComparison(); setStatus($("climateStatus"), "Three research-only exploratory patterns updated. Open each “Why this strategy?” panel for evidence and missing information.", "success"); }
  catch (error) { setStatus($("climateStatus"), error.message, "error"); }
});

loadCatalog().catch((error) => { updateCoverage(); setStatus($("climateStatus"), `Regional catalog could not load: ${error.message}. Climate context can still be requested, but no rotation comparison is available.`, "error"); });

for (const id of ["latitude", "longitude", "startYear", "endYear"]) $(id).addEventListener("change", clearLoadedData);
const offlineBanner = $("offlineBanner");
function updateConnection() { offlineBanner.hidden = navigator.onLine !== false; }
window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
updateConnection();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
