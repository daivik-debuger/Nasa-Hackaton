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
import { renderResearch } from "./ui/research-view.js";
import { setStatus } from "./ui/status-view.js";

const $ = (id) => document.getElementById(id);
const lastFullYear = new Date().getUTCFullYear() - 1;
const state = { region: null, crops: [], rules: [], evidence: [], sources: [], power: null, soil: null, imerg: null, requestId: 0 };

for (const location of GLOBAL_DEMO_LOCATIONS) $("demoLocation").add(new Option(location.label, location.id));
$("demoLocation").addEventListener("change", () => {
  const selected = demoLocation($("demoLocation").value);
  $("latitude").value = selected ? String(selected.lat) : "";
  $("longitude").value = selected ? String(selected.lon) : "";
  clearLoadedData();
});
for (const id of ["latitude", "longitude"]) $(id).addEventListener("input", () => { $("demoLocation").value = ""; clearLoadedData(); });

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
  renderResearch(state);
  $("retryResearch").hidden = true;
  const historyCrops = crops.filter((crop) => crop.roles.some((role) => role !== "cover"));
  for (const id of ["lastCrop", "priorCrop"]) for (const crop of historyCrops) $(id).add(new Option(crop.commonName, crop.id));
  updateCoverage();
  setStatus($("climateStatus"), state.power || state.soil ? "Regional catalog loaded. Existing observation context remains available." : "Catalog loaded. Load available Earth-observation context for your location.");
}

function locationInput() {
  return validateFieldQuery({ latitude: $("latitude").value, longitude: $("longitude").value, startYear: $("startYear").value, endYear: $("endYear").value }, { lastFullYear });
}

function coverage() {
  return resolveCoverage(locationInput(), state.region ? [state.region] : []);
}

function updateCoverage() {
  if (!$("latitude").value && !$("longitude").value) {
    $("researchCoverage").textContent = "The research library below applies to the Central Iowa pilot only; NASA climate context can be requested for locations worldwide.";
    setStatus($("coverageStatus"), "Choose a public example or enter your own coordinates anywhere in the world to check available data.");
    for (const id of ["lastCrop", "priorCrop", "summarize"]) $(id).disabled = true;
    for (const id of ["iowaLastCropField", "iowaPriorCropField"]) $(id).hidden = true;
    for (const id of ["globalLastCropField", "globalPriorCropField"]) $(id).hidden = false;
    $("summarize").textContent = "Review field snapshot";
    $("strategies").textContent = "Choose a location to explore available climate data and field notes.";
    return null;
  }
  try {
    const result = coverage();
    const supported = Boolean(result.region);
    $("researchCoverage").textContent = supported ? "This research pack applies to the Central Iowa pilot. Its crop and rotation records still need named agronomist review." : "This research pack applies only to Central Iowa. It is displayed for transparency, not as crop or rotation advice for your selected location.";
    setStatus($("coverageStatus"), supported ? "NASA POWER climate context is available to request worldwide. At this Iowa point, mapped SSURGO soil and research-only rotation patterns can also be explored." : "NASA POWER climate context is available to request worldwide. Mapped soil and regional crop-rotation evidence are not yet supported for this location.");
    for (const id of ["lastCrop", "priorCrop"]) $(id).disabled = !supported;
    for (const id of ["iowaLastCropField", "iowaPriorCropField"]) $(id).hidden = !supported;
    for (const id of ["globalLastCropField", "globalPriorCropField"]) $(id).hidden = supported;
    $("summarize").disabled = false;
    $("summarize").textContent = supported ? "Compare three strategies" : "Review field snapshot";
    if (!supported) {
      $("strategies").textContent = "No region-validated crop catalog for this location yet. Review your field snapshot without an Iowa rotation comparison.";
      $("inputSummary").textContent = "No local rotation comparison is available for this location. Your notes can still be reviewed on this page and are not saved.";
    } else if (!$("strategies").querySelector(".strategy-card")) {
      $("strategies").textContent = "Add crop history and choose a priority, then compare three Central Iowa exploratory patterns.";
    }
    return result;
  } catch (error) {
    $("researchCoverage").textContent = "Location is invalid; regional research applicability cannot be determined.";
    setStatus($("coverageStatus"), error.message, "error");
    for (const id of ["lastCrop", "priorCrop", "summarize"]) $(id).disabled = true;
    return null;
  }
}

function clearLoadedData() {
  state.requestId++;
  state.power = state.soil = state.imerg = null;
  $("loadClimate").disabled = false;
  $("loadClimate").removeAttribute("aria-busy");
  $("loadClimate").textContent = "Load available data";
  renderClimate(null);
  renderImerg(null, null, null, "not-loaded");
  renderSoil(null, "Load data to see mapped soil where a supported provider exists.");
  $("strategies").textContent = "Location or period changed. Load data again to compare available context.";
  setStatus($("climateStatus"), "Location or period changed. Load available data again.");
  setStatus($("comparisonStatus"), "Location or period changed. Review this field again to see a current snapshot.");
  updateCoverage();
}

function farmInput() {
  return validateFarmInputs({ lastCrop: $("lastCrop").value, priorCrop: $("priorCrop").value, soilTexture: $("soilTexture").value, soilPh: $("soilPh").value, priorities: selectedPriorities(), harvestDate: null, terminationPlan: null, marketAccess: null, equipment: null, soilTest: $("soilPh").value ? "pH only" : null, diseaseHistory: null }, new Set(state.crops.map((crop) => crop.id)));
}

function selectedPriorities() { return [...document.querySelectorAll(".priority-options input:checked")].map((element) => element.value); }

function updateComparison() {
  const location = locationInput();
  const available = coverage();
  if (!available.region) {
    const notes = validateFarmInputs({ lastCrop: null, priorCrop: null, soilPh: $("soilPh").value, soilTexture: $("soilTexture").value, priorities: selectedPriorities() }, new Set());
    const last = $("globalLastCrop").value.trim() || "not entered";
    const prior = $("globalPriorCrop").value.trim() || "not entered";
    const climate = state.power ? `NASA POWER historical context for ${state.power.start}–${state.power.end}: ${state.power.mean.toFixed(1)}°C mean air temperature across ${state.power.count} valid days; ${state.power.totalRain.toFixed(0)} mm summed precipitation across ${state.power.rainfallCount} valid days; ${state.power.hotDays} days with maximum air temperature at or above 30°C. These gridded values are not field measurements, and incomplete days can make a period sum incomplete.` : "NASA POWER historical context has not been loaded for this location.";
    $("strategies").textContent = `${climate} Your priorities: ${prioritiesText(notes.priorities)}. Regional soil lookup and evidence-linked rotation strategies are not yet supported here. Your crop notes are not interpreted as agronomic evidence; confirm local soil, seasons, water, and crop suitability with a qualified adviser.`;
    $("inputSummary").textContent = `${$("fieldName").value.trim() || "Unnamed field"} · ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}. Crop notes: ${prior} → ${last}. Farmer soil texture: ${notes.soilTexture || "unknown"}; lab pH: ${notes.soilPh ?? "not provided"}. Priorities: ${prioritiesText(notes.priorities)}. Entries are not saved.`;
    return "global";
  }
  const input = farmInput();
  if (!input.lastCrop) {
    $("strategies").textContent = "Choose what grew last season before comparing regional rotation patterns. No crop sequence has been assumed.";
    $("inputSummary").textContent = "Last season's crop is missing. Your entries remain on this page and are not saved.";
    return "missing-history";
  }
  if (!["corn", "soybean"].includes(input.lastCrop)) {
    $("strategies").textContent = "This Iowa rule set currently compares histories ending in corn or soybean. Other crop histories need additional reviewed rotation evidence; no sequence was guessed.";
    $("inputSummary").textContent = `Last crop: ${input.lastCrop}. No evidence-linked sequence is available for this history. Entries are not saved.`;
    return "unsupported-history";
  }
  const indicators = buildIndicators(state);
  const strategies = compareStrategies({ input, indicators, soil: state.soil, crops: state.crops, rules: state.rules, evidence: state.evidence });
  renderStrategies(strategies, new Map(state.sources.map((source) => [source.id, source])));
  const name = $("fieldName").value.trim() || "Unnamed field";
  $("inputSummary").textContent = `${name} · ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}. History: ${input.priorCrop || "unknown"} → ${input.lastCrop || "unknown"}. Farmer soil texture: ${input.soilTexture || "unknown"}; lab pH: ${input.soilPh ?? "not provided"}. Priorities: ${prioritiesText(input.priorities)}. Entries are not saved.`;
  return "strategies";
}

function prioritiesText(priorities) { return priorities.length ? priorities.join(", ") : "none selected"; }

function markComparisonStale() {
  $("strategies").textContent = "Field notes changed. Review the field snapshot or compare supported strategies again to see current inputs.";
  $("inputSummary").textContent = "Field notes changed; the previous summary is no longer current. Entries are not saved.";
  setStatus($("comparisonStatus"), "Field notes changed. Use the review button to update this result.");
}
for (const id of ["fieldName", "globalLastCrop", "globalPriorCrop", "soilPh"]) $(id).addEventListener("input", markComparisonStale);
for (const id of ["lastCrop", "priorCrop", "soilTexture"]) $(id).addEventListener("change", markComparisonStale);
for (const element of document.querySelectorAll(".priority-options input")) element.addEventListener("change", markComparisonStale);

$("loadClimate").addEventListener("click", async () => {
  const button = $("loadClimate");
  let requestId = null;
  try {
    const location = locationInput();
    const available = coverage();
    requestId = ++state.requestId;
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
    if (available.soil === "not-yet-supported") renderSoil(null, "Mapped soil lookup is not yet supported for this location. No Iowa soil values were applied. A local soil test remains important.");
    else if (soilResult.status === "fulfilled") {
      try { renderSoil(soilResult.value); state.soil = soilResult.value; }
      catch { failures.push("SSURGO: mapped soil response was incomplete."); renderSoil(null); }
    }
    else { failures.push(`SSURGO: ${soilResult.reason.message}`); renderSoil(null); }
    if (powerResult.status === "fulfilled") {
      try { state.power = summarizePowerPayload(powerResult.value, location); renderClimate(state.power); }
      catch (error) { state.power = null; renderClimate(null); failures.push(`POWER: ${error.message}`); }
    } else failures.push(`POWER: ${powerResult.reason.message}`);
    if (state.power) {
      const wettest = state.power.wettestReferenceDay;
      if (wettest) {
        setStatus($("climateStatus"), "POWER loaded. Sampling NASA GPM IMERG for the matched wettest day…");
        try { state.imerg = await fetchImergDay(location, wettest.day); }
        catch (error) { failures.push(`IMERG: ${error.message}`); }
        if (requestId !== state.requestId) return;
        renderImerg(state.imerg, wettest.day, wettest.value);
      } else { failures.push("No valid POWER day in the end year for an IMERG cross-check."); renderImerg(null, null, null, "no-reference"); }
    } else renderImerg(null, null, null, "power-unavailable");
    const success = available.region ? "NASA observations and USDA mapped soil loaded for the Central Iowa demonstration. These are mapped estimates, not field measurements." : "NASA observation context loaded. Soil and region-specific crop comparisons are not yet supported here.";
    const failureLead = state.power ? "Partial data loaded." : state.soil ? "NASA climate data unavailable; mapped soil loaded." : "No live observation data loaded.";
    setStatus($("climateStatus"), failures.length ? `${failureLead} ${failures.join(" ")} Missing sources remain visible.` : success, failures.length ? "error" : "success");
    button.textContent = failures.length ? "Retry data load" : "Refresh data";
    try { updateComparison(); }
    catch (error) { setStatus($("comparisonStatus"), error.message, "error"); }
  } catch (error) { setStatus($("climateStatus"), error.message, "error"); button.textContent = "Retry data load"; }
  finally { if (requestId === null || requestId === state.requestId) { button.disabled = false; button.removeAttribute("aria-busy"); } }
});

$("summarize").addEventListener("click", () => {
  try {
    const result = updateComparison();
    const messages = {
      global: "Field snapshot updated. No region-reviewed rotation comparison is available here; Iowa rules were not applied.",
      strategies: "Three research-only exploratory patterns updated. Open each “Why this strategy?” panel for evidence and missing information.",
      "missing-history": "Choose last season's crop before comparing Iowa patterns.",
      "unsupported-history": "No evidence-linked sequence is available for this crop history."
    };
    setStatus($("comparisonStatus"), messages[result], result === "global" || result === "strategies" ? "success" : undefined);
  } catch (error) { setStatus($("comparisonStatus"), error.message, "error"); }
});

function reportCatalogError(error) {
  Object.assign(state, { region: null, crops: [], evidence: [], rules: [], sources: [] });
  $("researchSummary").textContent = "Research catalog unavailable. No source or crop claims are being shown.";
  $("researchBody").textContent = `Could not load the research catalog: ${error.message}`;
  $("retryResearch").hidden = false;
  updateCoverage();
  setStatus($("climateStatus"), `Regional catalog could not load: ${error.message}. Climate context can still be requested, but no rotation comparison is available.`, "error");
}
$("retryResearch").addEventListener("click", () => {
  $("retryResearch").hidden = true;
  $("researchSummary").textContent = "Retrying the research catalog…";
  loadCatalog().catch(reportCatalogError);
});
loadCatalog().catch(reportCatalogError);

for (const id of ["latitude", "longitude", "startYear", "endYear"]) $(id).addEventListener("change", clearLoadedData);
const offlineBanner = $("offlineBanner");
function updateConnection() { offlineBanner.hidden = navigator.onLine !== false; }
window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
updateConnection();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
