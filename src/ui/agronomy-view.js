import { compareRegionalStrategies, precipitationContext } from "../engine/regional-engine.js";
import { validateAgronomy } from "../agronomy-validation.js";

export const escapeHtml = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const e = escapeHtml;
const number = (v, digits = 2) => Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: digits }) : "Unavailable";
function sourceLinks(ids, sources) {
  return [...new Set(ids)].map((id) => {
    const source = sources.find((s) => s.id === id);
    if (!source || new URL(source.url).protocol !== "https:") throw new Error(`Missing or unsafe source ${id}.`);
    return `<a href="${e(source.url)}" target="_blank" rel="noopener noreferrer">${e(source.name)}</a>`;
  }).join(" · ");
}

export function benchmarkMarkup(catalog, sources, regionId = "all", metric = "all") {
  const rows = catalog.benchmarks.filter((b) => (regionId === "all" || b.regionId === regionId) && (metric === "all" || b.metric === metric));
  const body = rows.map((b) => {
    const value = b.kind === "treatment-difference" ? `${number(b.treatment)} − ${number(b.comparator)} = ${number(b.treatment - b.comparator)}` : b.kind === "reported-rate" ? number(b.value) : "Not quantified";
    return `<tr><th scope="row">${e(b.metric)}<small>${e(b.location)}</small></th><td class="numeric">${e(value)}<small>${e(b.unit)} · ${e(b.kind)}</small></td><td>${e(b.treatmentLabel)}${b.comparatorLabel ? `<small>Comparator: ${e(b.comparatorLabel)}</small>` : ""}</td><td>${e(b.depth)}<small>${e(b.period)}</small></td><td><details><summary>Method & source</summary><p>${e(b.design)} · Replicates: ${b.sampleSize ?? "not extracted"}.</p><p>${e(b.limitation)}</p><p>${e(b.sourceLocator)}</p><p>${sourceLinks([b.sourceId], sources)}</p><p>${e(b.confidence)} evidence confidence · research-only</p></details></td></tr>`;
  }).join("");
  return `<div class="table-scroll" role="region" aria-label="Empirical trial benchmarks" tabindex="0"><table class="benchmark-table"><caption>${rows.length} scoped results. Treatment differences, annual rates and observed trends have different meanings; do not pool them.</caption><thead><tr><th scope="col">Indicator / site</th><th scope="col">Reported value or difference</th><th scope="col">Management</th><th scope="col">Depth / period</th><th scope="col">Provenance</th></tr></thead><tbody>${body || '<tr><td colspan="5">No benchmarks match these filters.</td></tr>'}</tbody></table></div>`;
}

export function regionalResultMarkup(result, sources) {
  const paired = (label, value) => `<div><span>${label}</span><strong class="numeric">${number(value.delta)} <small>${e(value.unit)}</small></strong><p>${e(value.reason)}</p></div>`;
  return `<p class="research-warning">${e(result.approval)}</p><div class="soil-delta-grid">${paired("Observed Δ SOM", result.som)}${paired("Observed Δ bulk density", result.density)}</div>
    <div class="scenario-results">${result.scenarios.map((s) => `<article class="scenario-result ${s.excluded.length ? "has-conflict" : ""}"><header><p class="section-kicker">${e(s.status.replaceAll("-", " "))}</p><h3>${e(s.name)}</h3><p>${e(s.note)}</p></header><ol class="phase-list">${s.sequence.map((c) => `<li>${e(c.label)}</li>`).join("") || "<li>Transition not established</li>"}</ol>
    <p class="numeric">${s.functionalGroups} functional crop groups · confidence limited</p>
    ${s.excluded.length ? `<ul class="constraint-list">${s.excluded.map((x) => `<li>${e(x)}</li>`).join("")}</ul>` : ""}
    ${s.concerns.length ? `<ul class="constraint-list">${s.concerns.map((x) => `<li>${e(x)}</li>`).join("")}</ul>` : ""}
    <details class="why-panel"><summary>Why this result? · ${s.rules.length} considerations</summary><div class="why-content">${s.rules.map((r) => `<section class="rule-trace ${r.priority ? "priority-trace" : ""}"><h4>${e(r.dimension)}${r.priority ? " · your priority" : ""}</h4><p>${e(r.benefit)}</p><p>${e(r.risk)}</p><p class="metadata">${e(r.id)} · ${e(r.when)} · ${e(r.confidence)} evidence confidence · unapproved</p><p>${sourceLinks(r.sourceIds, sources)}</p></section>`).join("") || "<p>No agronomic consideration matched these inputs.</p>"}<h4>Missing context</h4><ul>${s.missing.map((m) => `<li>${e(m)}</li>`).join("") || "<li>Listed inputs supplied; independent review still required.</li>"}</ul><h4>Sequence source</h4><p>${sourceLinks(s.sourceIds, sources)}</p><p>Nitrogen credit and future SOM change are unestimated. Confirm cultivar, dates, herbicide carryover, soil, equipment and market access locally.</p></div></details></article>`).join("")}</div>
    <details class="result-audit"><summary>Inputs and calculation record</summary><p>${e(result.region.scope)}</p><p>POWER context: ${result.climate.years.length ? `${result.climate.years[0].year}–${result.climate.years.at(-1).year}` : "not included"}. Latest-year departure: ${number(result.climate.departurePct)}%. Longest observed run below 1 mm/day: ${number(result.climate.drySpellDays, 0)} days.</p><p>${e(result.climate.label || result.climate.missing)}</p><pre>${e(JSON.stringify(result.inputUsed, null, 2))}</pre></details>`;
}

const choice = (id, label, yes, no) => `<label class="field"><span>${label}</span><select id="${id}"><option value="unknown">Unknown / not checked</option><option value="yes">${yes}</option><option value="no">${no}</option></select></label>`;
const pairFields = (kind, label, unit) => `<fieldset class="lab-pair"><legend>${label} · ${unit}</legend><div class="form-grid">${["before", "after"].map((phase) => `<label class="field"><span>${phase === "before" ? "Earlier" : "Later"} value</span><input id="${kind}-${phase}" type="number" step="any" min="0" max="${kind === "som" ? 100 : 3}"></label><label class="field"><span>${phase === "before" ? "Earlier" : "Later"} sample date</span><input id="${kind}-${phase}Date" type="date"></label>`).join("")}<label class="field"><span>Sampling depth, 0 to … cm</span><input id="${kind}-depthCm" type="number" min="1" max="200" step="any"></label><label class="field"><span>Laboratory method</span><input id="${kind}-method" type="text" maxlength="100" placeholder="Method printed on your report"></label></div><label class="check-option"><input id="${kind}-sameProtocol" type="checkbox">Same field, sampling season, depth and laboratory method</label></fieldset>`;

export function createAgronomyWorkbench({ getContext }) {
  const root = document.getElementById("regionalWorkbench");
  let catalog, sources;
  const $ = (id) => document.getElementById(id);
  root.innerHTML = `<header class="section-header compact-header"><div><p class="section-kicker">Regional comparison laboratory</p><h2>Build a rotation worth investigating.</h2><p>Compare published crop cycles against your constraints. Select the study system you want to explore; its evidence does not establish suitability for your map pin.</p></div></header><p id="regionalLoadState" role="status">Loading regional evidence…</p><div id="regionalFormHost"></div><div id="regionalResults" aria-live="polite"></div>`;
  function invalidate() {
    if ($("regionalResults")) $("regionalResults").textContent = "Inputs or observations changed. Run the comparison to update the result.";
    if ($("regionalClimateNote")) {
      const { power } = getContext();
      $("regionalClimateNote").textContent = power ? `Selected-point POWER: ${power.lat.toFixed(3)}, ${power.lon.toFixed(3)} · ${power.start}–${power.end}. This location may differ from the study region.` : "No selected-point POWER data loaded. Load it on Dashboard to include weather context.";
    }
  }
  function setCatalog(data, registry) {
    const errors = validateAgronomy(data, new Set(registry.map((s) => s.id)));
    if (errors.length) throw new Error(errors[0]);
    catalog = data; sources = registry;
    $("regionalLoadState").textContent = `${catalog.regions.length} regional reference packs · research-only · no agronomist approval`;
    $("regionalFormHost").innerHTML = `<form id="regionalForm"><div class="form-grid">
      <label class="field"><span>Evidence region</span><select id="scenarioRegion">${catalog.regions.map((r) => `<option value="${e(r.id)}">${e(r.name)}</option>`).join("")}</select></label><p id="scenarioScope" class="scope-note"></p>
      <label class="field"><span>Last crop in the reference scenario</span><select id="scenarioLast" required></select></label><label class="field"><span>Required next crop</span><select id="scenarioNext"></select></label>
      ${choice("scenarioWater", "Stored water adequate for an added crop?", "Confirmed adequate locally", "Limited / inadequate")}${choice("scenarioFallow", "Can the plan include a fallow phase?", "Allowed", "Exclude fallow")}${choice("scenarioForage", "Forage outlet and harvest equipment available?", "Available", "Unavailable")}${choice("scenarioNodulation", "Legume nodulation confirmed locally?", "Confirmed", "Not successful / unconfirmed")}${choice("scenarioDisease", "Known disease pressure in this field?", "Yes — needs pathogen review", "None reported")}
      <fieldset class="priority-field field-full"><legend>Highlight the tradeoffs that matter</legend><div class="priority-options">${["water", "soil", "nitrogen", "disease"].map((p) => `<label class="check-option"><input type="checkbox" name="scenarioPriority" value="${p}">${p}</label>`).join("")}</div></fieldset>
      <div class="field-full"><label class="check-option"><input type="checkbox" id="scenarioClimate">Include the selected map point’s POWER history as context</label><p id="regionalClimateNote" class="supporting-text"></p></div></div>
      <details class="lab-inputs"><summary>Compare laboratory soil samples · optional</summary><p>Enter measured SOM percentages or bulk densities from comparable reports. Organic carbon is a different measurement. Values remain in this page.</p>${pairFields("som", "Soil organic matter", "%")}${pairFields("density", "Bulk density", "g/cm³")}</details>
      <div class="primary-action-row"><p>Results show constraints and evidence; numerical field outcomes need further validation.</p><button class="button button-primary" type="submit">Compare regional scenarios</button></div><p id="regionalStatus" class="status" role="status"></p></form>`;
    function syncRegion() {
      const r = catalog.regions.find((item) => item.id === $("scenarioRegion").value);
      $("scenarioScope").textContent = `${r.climate} ${r.scope}`;
      const options = r.crops.map((c) => `<option value="${e(c.id)}">${e(c.label)}</option>`).join("");
      $("scenarioLast").innerHTML = '<option value="">Choose last crop</option>' + options;
      $("scenarioNext").innerHTML = '<option value="">No required next crop</option>' + options;
      invalidate();
    }
    $("scenarioRegion").addEventListener("change", syncRegion);
    $("regionalForm").addEventListener("input", invalidate);
    $("regionalForm").addEventListener("change", invalidate);
    $("regionalForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const pair = (kind) => Object.fromEntries(["before", "after", "beforeDate", "afterDate", "depthCm", "method", "sameProtocol"].map((key) => [key, key === "sameProtocol" ? $(`${kind}-${key}`).checked : $(`${kind}-${key}`).value]));
      try {
        const result = compareRegionalStrategies({ catalog, sourceIds: new Set(sources.map((s) => s.id)), power: $("scenarioClimate").checked ? getContext().power : null, input: { mode: "reference-scenario", regionId: $("scenarioRegion").value, lastCrop: $("scenarioLast").value, nextCrop: $("scenarioNext").value, waterSupply: $("scenarioWater").value, allowFallow: $("scenarioFallow").value, forageOutlet: $("scenarioForage").value, nodulation: $("scenarioNodulation").value, diseaseHistory: $("scenarioDisease").value, priorities: [...root.querySelectorAll('[name="scenarioPriority"]:checked')].map((el) => el.value), som: pair("som"), density: pair("density") } });
        $("regionalResults").innerHTML = regionalResultMarkup(result, sources);
        $("regionalStatus").textContent = `${result.scenarios.length} reference cycles evaluated; ${result.scenarios.filter((s) => s.excluded.length).length} conflict with your constraints. All require local review.`;
      } catch (error) { $("regionalResults").textContent = ""; $("regionalStatus").textContent = error.message; }
    });
    syncRegion();
  }
  function unavailable(message) { catalog = null; $("regionalFormHost").textContent = ""; $("regionalResults").textContent = ""; $("regionalLoadState").textContent = `Regional comparison unavailable: ${message}. Use Retry research catalog in Research.`; }
  return { setCatalog, invalidate, unavailable };
}

export function renderResearchAnalytics(catalog, sources, power) {
  const root = document.getElementById("researchAnalytics");
  const priorRegion = document.getElementById("benchmarkRegion")?.value || "all";
  const priorMetric = document.getElementById("benchmarkMetric")?.value || "all";
  const climate = precipitationContext(power);
  root.innerHTML = `<section class="analytical-section"><div class="analysis-heading"><div><p class="section-kicker">01 / Observed evidence</p><h3>Trial benchmarks</h3></div><p>Reported measurements, explicit comparators, documented uncertainty.</p></div><div class="benchmark-filters"><label class="field"><span>Study region</span><select id="benchmarkRegion"><option value="all">All study regions</option>${catalog.regions.map((r) => `<option value="${e(r.id)}">${e(r.name)}</option>`).join("")}</select></label><label class="field"><span>Metric</span><select id="benchmarkMetric"><option value="all">All metrics</option>${[...new Set(catalog.benchmarks.map((b) => b.metric))].map((m) => `<option>${e(m)}</option>`).join("")}</select></label></div><div id="benchmarkResults"></div></section>
    <section class="analytical-section"><div class="analysis-heading"><div><p class="section-kicker">02 / Earth observations</p><h3>What is measured here?</h3></div></div><div class="table-scroll" role="region" aria-label="Earth observation availability" tabindex="0"><table class="benchmark-table"><thead><tr><th>Source</th><th>Current value / status</th><th>Scale and interpretation</th></tr></thead><tbody>
    <tr><th>NASA POWER<small>PRECTOTCORR</small></th><td class="numeric">${power ? `${power.start}–${power.end} · ${power.lat.toFixed(3)}, ${power.lon.toFixed(3)}` : "Load on Dashboard"}<small>Latest-year rainfall departure: ${number(climate.departurePct)}%</small><small>Longest &lt;1 mm/day run: ${number(climate.drySpellDays, 0)} days</small></td><td>Gridded meteorology; approx. 0.5° × 0.625°. ${e(climate.missing || climate.label)} ${sourceLinks(["nasa-power-daily"], sources)}</td></tr>
    <tr><th>SMAP SPL3SMP_E v6</th><td>Not connected</td><td>Daily 9 km grid posting; surface moisture. Requires Earthdata access and quality flags. ${sourceLinks(["nasa-smap-enhanced-v6"], sources)}</td></tr>
    <tr><th>MODIS MOD13Q1 v061</th><td>Not connected</td><td>250 m / 16-day NDVI composite. Cloud/quality screening required; cannot infer yield or diagnose disease. ${sourceLinks(["nasa-mod13q1-v061"], sources)}</td></tr></tbody></table></div></section>`;
  const region = document.getElementById("benchmarkRegion"), metric = document.getElementById("benchmarkMetric");
  region.value = priorRegion; metric.value = priorMetric;
  const draw = () => { document.getElementById("benchmarkResults").innerHTML = benchmarkMarkup(catalog, sources, region.value, metric.value); };
  region.addEventListener("change", draw); metric.addEventListener("change", draw); draw();
}
