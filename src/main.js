import { summarizePowerPayload, validateFieldQuery } from "./climate.js";
import { resolveCoverage } from "./coverage.js";
import { GLOBAL_DEMO_LOCATIONS, demoLocation } from "./global-demo-locations.js";
import { fetchPowerData } from "./api/nasa-power.js";
import { fetchSoilData } from "./api/soil-data.js";
import { fetchImergDay } from "./api/imerg.js";
import { validateFarmInputs } from "./validation/field-inputs.js";
import { buildIndicators } from "./engine/indicators.js";
import { compareStrategies } from "./engine/compare-strategies.js";
import { resolveGlobalZone, buildGlobalZoneArchetypes } from "./engine/global-zone-resolver.js";
import { renderClimate, renderImerg } from "./ui/climate-view.js";
import { renderSoil } from "./ui/soil-view.js";
import { renderStrategies } from "./ui/strategy-view.js";
import { renderResearch } from "./ui/research-view.js";
import { renderOverview } from "./ui/overview-view.js";
import { renderCropExplorer, renderSelectedCropContext } from "./ui/crop-view.js";
import { createViewRouter } from "./ui/view-router.js";
import { createLocationPicker } from "./ui/location-picker.js";
import { setStatus } from "./ui/status-view.js";

const $ = (id) => document.getElementById(id);
const lastFullYear = new Date().getUTCFullYear() - 1;
const state = { region: null, crops: [], rules: [], evidence: [], sources: [], power: null, soil: null, imerg: null, requestId: 0, researchMode: "executive", nightCab: false };

const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function selectedPoint() {
  const lat = Number($("latitude").value), lon = Number($("longitude").value);
  return $("latitude").value && $("longitude").value ? { lat, lon } : null;
}

function currentZone() {
  const pt = selectedPoint();
  if (!pt) return null;
  return resolveGlobalZone({
    lat: pt.lat,
    lon: pt.lon,
    elevationM: $("elevationM")?.value ?? 250,
    precipRegime: $("precipRegime")?.value ?? "auto",
    irrigation: $("irrigationAccess")?.value ?? "rainfed"
  });
}

function renderAezPanel(supported = false) {
  const zone = currentZone();
  if (!$("aezName")) return;
  if (!zone) {
    $("aezBadge").textContent = "AWAITING COORDINATES";
    $("aezBadge").className = "aez-badge";
    $("aezName").textContent = "Select a coordinate on the map or benchmark list to resolve its Global Agro-Ecological Zone";
    $("aezKoppen").textContent = "—";
    $("aezAnalogs").textContent = "—";
    $("aezSchema").textContent = "—";
    return;
  }
  $("aezBadge").textContent = supported ? `PILOT VERIFIED · ${zone.id.toUpperCase()}` : `GLOBAL AEZ · ${zone.id.toUpperCase()}`;
  $("aezBadge").className = supported ? "aez-badge aez-badge-verified" : "aez-badge aez-badge-global";
  $("aezName").textContent = `${zone.name} (${zone.faoAez})`;
  $("aezKoppen").textContent = `${zone.koppen} · ${zone.thermalBand}`;
  $("aezAnalogs").textContent = zone.analogs;
  $("aezSchema").textContent = zone.schemaPattern;
}

function syncOverview() {
  renderOverview({ power: state.power, crops: state.crops, evidence: state.evidence, point: selectedPoint(), fieldName: $("fieldName").value });
}
function syncCropContext(selectedRegion = null) {
  renderSelectedCropContext({ selectedRegion, crops: state.crops, lastCrop: $("lastCrop").value, globalLastCrop: $("globalLastCrop").value });
}

// Night Cab (#0F1412) vs Direct Sunlight (#F7F8F6) Toggle
if ($("cabThemeToggle")) {
  $("cabThemeToggle").addEventListener("click", () => {
    state.nightCab = !state.nightCab;
    document.body.classList.toggle("night-cab", state.nightCab);
    $("cabThemeToggle").setAttribute("aria-pressed", String(state.nightCab));
    $("cabThemeToggle").textContent = state.nightCab ? "Daylight mode" : "Night mode";
  });
}

// Dual-View Research Mode Toggle
if ($("execResearchBtn") && $("deepResearchBtn")) {
  const setMode = (mode) => {
    state.researchMode = mode;
    $("execResearchBtn").className = mode === "executive" ? "button button-primary" : "button button-secondary";
    $("deepResearchBtn").className = mode === "deep" ? "button button-primary" : "button button-secondary";
    $("execResearchBtn").setAttribute("aria-pressed", String(mode === "executive"));
    $("deepResearchBtn").setAttribute("aria-pressed", String(mode === "deep"));
    if (state.region) renderResearch(state, { mode });
  };
  $("execResearchBtn").addEventListener("click", () => setMode("executive"));
  $("deepResearchBtn").addEventListener("click", () => setMode("deep"));
}

const locationPicker = createLocationPicker({
  onSelect(point) {
    $("latitude").value = String(point.lat);
    $("longitude").value = String(point.lon);
    $("demoLocation").value = "";
    clearLoadedData();
  },
  onClear() {
    $("latitude").value = "";
    $("longitude").value = "";
    $("demoLocation").value = "";
    clearLoadedData();
  }
});
createViewRouter({ onChange: (view) => { if (view === "dashboard") locationPicker.refresh?.(); } });

for (const location of GLOBAL_DEMO_LOCATIONS) $("demoLocation").add(new Option(location.label, location.id));
$("demoLocation").addEventListener("change", () => {
  const selected = demoLocation($("demoLocation").value);
  $("latitude").value = selected ? String(selected.lat) : "";
  $("longitude").value = selected ? String(selected.lon) : "";
  if (selected) locationPicker.showPin(selected, `${selected.label} selected as a public example point. This is not a verified farm field.`);
  else locationPicker.clearPin();
  clearLoadedData();
});
for (const id of ["latitude", "longitude"]) $(id).addEventListener("input", () => { $("demoLocation").value = ""; locationPicker.clearPin(); clearLoadedData(); });
for (const id of ["latitude", "longitude"]) $(id).addEventListener("change", () => {
  try { locationPicker.showPin(locationInput(), "Exact coordinate point selected. The entered coordinates will be used for data requests."); }
  catch { locationPicker.clearPin(); }
});
for (const id of ["elevationM", "precipRegime", "irrigationAccess"]) {
  if ($(id)) $(id).addEventListener("change", () => { updateCoverage(); markComparisonStale(); });
}

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
  renderResearch(state, { mode: state.researchMode });
  renderCropExplorer(state, { search: $("cropSearch").value, role: $("cropRole").value, zone: $("cropZoneFilter")?.value || "all" });
  syncOverview();
  $("retryResearch").hidden = true;
  const historyCrops = crops.filter((crop) => crop.roles.some((role) => role !== "cover"));
  for (const id of ["lastCrop", "priorCrop"]) for (const crop of historyCrops) $(id).add(new Option(crop.commonName, crop.id));
  // Default to the Central Iowa pilot point on initial startup so the user immediately sees the active resolver & data ready
  if (!$("latitude").value && !$("longitude").value) {
    const defaultDemo = demoLocation("iowa");
    if (defaultDemo) {
      $("demoLocation").value = "iowa";
      $("latitude").value = String(defaultDemo.lat);
      $("longitude").value = String(defaultDemo.lon);
      locationPicker.showPin(defaultDemo, `${defaultDemo.label} loaded as initial demonstration coordinate.`);
    }
  }
  updateCoverage();
  setStatus($("climateStatus"), state.power || state.soil ? "Regional catalog loaded. Existing observation context remains available." : "Catalog loaded. Load available Earth-observation context for your location.");
}

function locationInput() {
  if (!$("latitude").value && !$("longitude").value) throw new Error("Drop a pin, choose a public example, or enter exact coordinates before loading data.");
  return validateFieldQuery({ latitude: $("latitude").value, longitude: $("longitude").value, startYear: $("startYear").value, endYear: $("endYear").value }, { lastFullYear });
}

function coverage() {
  return resolveCoverage(locationInput(), state.region ? [state.region] : []);
}

function updateCoverage() {
  if (!$("latitude").value && !$("longitude").value) {
    syncCropContext();
    renderAezPanel(false);
    $("researchCoverage").textContent = "The research library below applies to the Central Iowa pilot only; NASA climate context can be requested for locations worldwide.";
    setStatus($("coverageStatus"), "Drop a pin on the map, use its center, choose a public example, or enter exact coordinates anywhere in the world.");
    for (const id of ["lastCrop", "priorCrop", "summarize"]) $(id).disabled = true;
    for (const id of ["iowaLastCropField", "iowaPriorCropField"]) $(id).hidden = true;
    for (const id of ["globalLastCropField", "globalPriorCropField"]) $(id).hidden = false;
    $("summarize").textContent = "Review global AEZ & field snapshot";
    $("strategies").textContent = "Choose a location to explore available climate data, agro-ecological zone archetypes, and field notes.";
    return null;
  }
  try {
    const result = coverage();
    const supported = Boolean(result.region);
    const zone = currentZone();
    syncCropContext(result.region);
    renderAezPanel(supported);
    $("researchCoverage").textContent = supported ? "This research pack applies to the Central Iowa pilot. Its crop and rotation records still need named agronomist review." : "This research pack applies only to Central Iowa. It is displayed for transparency, not as crop or rotation advice for your selected location.";
    setStatus($("coverageStatus"), supported ? `RESOLVED ZONE: ${zone?.name || "Temperate Belt"} · Central Iowa Pilot Active (NASA POWER + USDA SSURGO + 5 Sourced Rotation Rules).` : `RESOLVED ZONE: ${zone?.name || "Global Belt"} · Global NASA POWER Active. Central Iowa soil & crop rules are strictly withheld outside Iowa; showing non-prescriptive AEZ archetypes.`);
    for (const id of ["lastCrop", "priorCrop"]) $(id).disabled = !supported;
    for (const id of ["iowaLastCropField", "iowaPriorCropField"]) $(id).hidden = !supported;
    for (const id of ["globalLastCropField", "globalPriorCropField"]) $(id).hidden = supported;
    $("summarize").disabled = false;
    $("summarize").textContent = supported ? "Compare 3 Pilot Rotation Strategies" : "Compare 3 Global AEZ Archetypes & Snapshot";
    if (!supported) {
      updateComparison();
    } else if (!$("strategies").querySelector(".strategy-card")) {
      $("strategies").textContent = "Add crop history and choose a priority, then compare three Central Iowa exploratory patterns.";
    }
    return result;
  } catch (error) {
    syncCropContext();
    renderAezPanel(false);
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
  $("loadClimate").textContent = "Load NASA & Soil Telemetry";
  renderClimate(null);
  syncOverview();
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

function renderGlobalArchetypeCards(zone, notes, climateText) {
  const archetypes = buildGlobalZoneArchetypes(zone, {
    lastCropNote: $("globalLastCrop")?.value.trim() || "",
    priorities: notes.priorities,
    soilPh: notes.soilPh,
    somPercent: $("soilSom")?.value || null,
    soilTexture: notes.soilTexture
  });
  $("strategies").innerHTML = archetypes.map((item) => `
    <article class="strategy-card strategy-card-archetype">
      <span class="strategy-kicker">${esc(item.badge)} · GLOBAL ZONE ARCHETYPE</span>
      <h3>${esc(item.title)}</h3>
      <p class="mono-num">Zone: ${esc(item.zoneName)} (${esc(item.koppen)})</p>
      <div class="sequence">${item.sequence.map((step) => `<span>${esc(step)}</span>`).join("<b>→</b>")}</div>
      <div class="priority-note">
        <p><b>+ Structural Benefit:</b> ${esc(item.benefit)}</p>
        <p><b>! Operational Risk / Limit:</b> ${esc(item.risk)}</p>
      </div>
      <p class="confidence-badge">Regional Rule Pack: Not yet validated for this coordinate · Iowa rules withheld</p>
      <details class="why-panel" open>
        <summary>Why this archetype &amp; missing local evidence</summary>
        <div class="why-content">
          <h4>NASA Observation Context</h4>
          <p>${esc(climateText)}</p>
          <h4>Priority Verification Questions</h4>
          <ul>${item.questions.map((q) => `<li>${esc(q)}</li>`).join("") || "<li>Select priorities above to generate verification questions.</li>"}</ul>
          <h4>Missing / Unverified Local Layers</h4>
          <ul>${item.missing.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
        </div>
      </details>
    </article>
  `).join("");
}

function updateComparison() {
  const location = locationInput();
  const available = coverage();
  const somVal = $("soilSom")?.value.trim() || "not provided";
  const irrigVal = $("irrigationAccess")?.value || "rainfed";
  if (!available.region) {
    const notes = validateFarmInputs({ lastCrop: null, priorCrop: null, soilPh: $("soilPh").value, soilTexture: $("soilTexture").value, priorities: selectedPriorities() }, new Set());
    const last = $("globalLastCrop").value.trim() || "not entered";
    const prior = $("globalPriorCrop").value.trim() || "not entered";
    const climate = state.power ? `NASA POWER (${state.power.start}–${state.power.end}): ${state.power.mean.toFixed(1)}°C mean T2M (${state.power.count} valid days); ${state.power.totalRain.toFixed(0)} mm PRECTOTCORR (${state.power.rainfallCount} valid days); ${state.power.hotDays} hot days ≥30°C.` : "NASA POWER historical context has not been loaded yet for this location.";
    const zone = currentZone();
    if (zone) {
      renderGlobalArchetypeCards(zone, notes, climate);
    } else {
      $("strategies").textContent = `${climate} Your priorities: ${prioritiesText(notes.priorities)}. Regional soil lookup and evidence-linked rotation strategies are not yet supported here.`;
    }
    $("inputSummary").textContent = `${$("fieldName").value.trim() || "Unnamed field"} · ${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}° · Zone: ${zone?.name || "Global"} · Crop notes: ${prior} → ${last} · Texture: ${notes.soilTexture || "unknown"} · Lab pH: ${notes.soilPh ?? "null"} · Lab SOM%: ${somVal} · Irrigation: ${irrigVal} · Priorities: ${prioritiesText(notes.priorities)}.`;
    return "global";
  }
  const input = farmInput();
  if (!input.lastCrop) {
    $("strategies").textContent = "Choose what grew last season (e.g., Corn or Soybean) in Plan rotations before comparing regional rotation patterns. No crop sequence has been assumed.";
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
  $("inputSummary").textContent = `${name} · ${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}° · History: ${input.priorCrop || "unknown"} → ${input.lastCrop || "unknown"} · Texture: ${input.soilTexture || "unknown"} · Lab pH: ${input.soilPh ?? "null"} · Lab SOM%: ${somVal} · Irrigation: ${irrigVal} · Priorities: ${prioritiesText(input.priorities)}.`;
  return "strategies";
}

function prioritiesText(priorities) { return priorities.length ? priorities.join(", ") : "none selected"; }

function markComparisonStale() {
  $("strategies").textContent = "Field notes changed. Review the field snapshot or compare supported strategies again to see current inputs.";
  $("inputSummary").textContent = "Field notes changed; the previous summary is no longer current. Entries are not saved.";
  setStatus($("comparisonStatus"), "Field notes changed. Use the review button to update this result.");
  syncOverview();
  try { syncCropContext(coverage().region); }
  catch { syncCropContext(); }
}
for (const id of ["fieldName", "globalLastCrop", "globalPriorCrop", "soilPh", "soilSom"]) {
  if ($(id)) $(id).addEventListener("input", markComparisonStale);
}
for (const id of ["lastCrop", "priorCrop", "soilTexture"]) $(id).addEventListener("change", markComparisonStale);
for (const element of document.querySelectorAll(".priority-options input")) element.addEventListener("change", markComparisonStale);
for (const id of ["cropSearch", "cropRole", "cropZoneFilter"]) {
  if ($(id)) {
    $(id).addEventListener(id === "cropSearch" ? "input" : "change", () => {
      renderCropExplorer(state, { search: $("cropSearch").value, role: $("cropRole").value, zone: $("cropZoneFilter")?.value || "all" });
    });
  }
}

$("loadClimate").addEventListener("click", async () => {
  const button = $("loadClimate");
  let requestId = null;
  try {
    const location = locationInput();
    const available = coverage();
    requestId = ++state.requestId;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Loading NASA & Soil Telemetry…";
    state.power = state.soil = state.imerg = null;
    renderClimate(null);
    syncOverview();
    renderImerg(null, null, null, "not-loaded");
    renderSoil(null, available.soil === "requestable" ? "Loading mapped soil context…" : "Mapped soil lookup is not yet supported for this location.");
    setStatus($("climateStatus"), available.soil === "requestable" ? "Loading NASA POWER history and USDA mapped soil…" : "Loading worldwide NASA POWER climate context…");
    const [powerResult, soilResult] = await Promise.allSettled([fetchPowerData(location), available.soil === "requestable" ? fetchSoilData(location) : Promise.resolve(null)]);
    if (requestId !== state.requestId) return;
    const failures = [];
    if (available.soil === "not-yet-supported") renderSoil(null, "Mapped soil lookup is not yet supported for this location (ISRIC SoilGrids REST API is paused). No Iowa soil values were applied. Operator-supplied lab soil pH, SOM %, and texture are used directly.");
    else if (soilResult.status === "fulfilled") {
      try { renderSoil(soilResult.value); state.soil = soilResult.value; }
      catch { failures.push("SSURGO: mapped soil response was incomplete."); renderSoil(null); }
    }
    else { failures.push(`SSURGO: ${soilResult.reason.message}`); renderSoil(null); }
    if (powerResult.status === "fulfilled") {
      try { state.power = summarizePowerPayload(powerResult.value, location); renderClimate(state.power); }
      catch (error) { state.power = null; renderClimate(null); failures.push(`POWER: ${error.message}`); }
    } else failures.push(`POWER: ${powerResult.reason.message}`);
    syncOverview();
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
    button.textContent = failures.length ? "Retry Telemetry Load" : "Refresh Telemetry";
    try { updateComparison(); }
    catch (error) { setStatus($("comparisonStatus"), error.message, "error"); }
  } catch (error) { setStatus($("climateStatus"), error.message, "error"); button.textContent = "Retry Telemetry Load"; }
  finally { if (requestId === null || requestId === state.requestId) { button.disabled = false; button.removeAttribute("aria-busy"); } }
});

$("summarize").addEventListener("click", () => {
  try {
    const result = updateComparison();
    const messages = {
      global: "Global AEZ archetypes & field snapshot updated. Iowa rules were strictly withheld outside Central Iowa.",
      strategies: "Three research-only exploratory patterns updated. Open each “Why this strategy?” panel for evidence and missing information.",
      "missing-history": "Choose last season's crop before comparing Iowa patterns.",
      "unsupported-history": "No evidence-linked sequence is available for this crop history."
    };
    setStatus($("comparisonStatus"), messages[result], result === "global" || result === "strategies" ? "success" : undefined);
  } catch (error) { setStatus($("comparisonStatus"), error.message, "error"); }
});

function reportCatalogError(error) {
  Object.assign(state, { region: null, crops: [], evidence: [], rules: [], sources: [] });
  renderCropExplorer(state);
  syncOverview();
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
syncOverview();
loadCatalog().catch(reportCatalogError);

for (const id of ["latitude", "longitude", "startYear", "endYear"]) $(id).addEventListener("change", clearLoadedData);
const offlineBanner = $("offlineBanner");
function updateConnection() { offlineBanner.hidden = navigator.onLine !== false; }
window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
updateConnection();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
