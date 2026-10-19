const esc = (value) => String(value ?? "Unknown").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const valueText = (value) => value === null || value === undefined ? "Not established" : typeof value === "object" ? JSON.stringify(value) : String(value);

const EXECUTIVE_TAKEAWAYS = {
  "ev-corn-soy-baseline": "Operational baseline: compares familiar 2-year corn–soybean equipment and herbicide schedules against cover-crop or small-grain additions.",
  "ev-rye-before-soy": "Lowest-risk cover entry point: post-corn winter cereal rye ahead of soybean scavenges residual nitrate and armors spring soil.",
  "ev-oats-before-corn": "Pre-corn fall cover: winter-killed oats after soybean avoid spring termination herbicide and green-bridge corn seedling risk.",
  "ev-diversified-sequence": "Multi-year biological break: oat/alfalfa–alfalfa–corn–soybean diversifies rooting depth, fixes N, and disrupts annual weed cycles.",
  "ev-rye-before-corn-risk": "Critical termination caution: cereal rye ahead of corn requires a 10–14+ day termination buffer to prevent N tie-up and seedling disease.",
  "ev-soil-map-uncertainty": "Soil sampling requirement: USDA SSURGO polygons contain multiple soil components and never replace a laboratory soil test.",
  "ev-precip-context": "Satellite scale boundary: NASA POWER (0.5°) and GPM IMERG (0.1°) provide regional meteorological context, not field rain-gauge totals.",
  "ev-cover-crop-cost": "Budgeting requirement: seed, drilling, and termination costs must be weighed against erosion control or grazing value.",
  "ev-alfalfa-dry-subsoil": "Subsoil moisture tradeoff: deep taprooted perennial alfalfa can deplete deep profile moisture before subsequent corn in dry years.",
  "ev-cover-crop-persistence": "Multi-year persistence context: USDA ERS (2012–2022) shows cover-crop adoption fluctuates with fall harvest weather and economics.",
  "ev-cover-crop-economics-scenarios": "Economic decision worksheet: ISU Ag Decision Maker A1-91 requires farm-specific seed, herbicide, and grazing numbers—no automatic dollar return is inferred."
};

export function researchMarkup({ region, crops, evidence, sources }, { mode = "executive" } = {}) {
  if (!region?.id || !Array.isArray(crops) || !Array.isArray(evidence) || !Array.isArray(sources)) throw new Error("Research catalog is incomplete.");
  const byId = new Map(sources.map((source) => [source.id, source]));
  function links(ids = []) {
    return ids.map((id) => {
      const source = byId.get(id);
      if (!source) throw new Error(`Research source ${id} is missing.`);
      const url = new URL(source.url);
      if (url.protocol !== "https:") throw new Error(`Research source ${id} has an unsafe URL.`);
      return `<a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a>`;
    }).join(" · ") || "No source linked";
  }
  const rotations = region.normalRotations.map((item) => `<li><b>${esc(item.pattern.join(" → "))}</b> — ${esc(item.note)}<p>${links(item.sourceIds)}</p></li>`).join("");
  const risks = region.climateRisks.map((item) => `<li>${esc(item.risk)}<p>${links(item.sourceIds)}</p></li>`).join("");
  const seasons = Object.entries(region.seasons).map(([crop, item]) => `<li><b>${esc(crop)}</b>: plant ${esc(item.plant)}; harvest ${esc(item.harvest)}.<p>${links(item.sourceIds)}</p></li>`).join("");
  const claims = evidence.map((item) => {
    const execSummary = EXECUTIVE_TAKEAWAYS[item.id] ? `<p class="exec-takeaway"><b>Executive Agronomy:</b> ${esc(EXECUTIVE_TAKEAWAYS[item.id])}</p>` : "";
    const deepMeta = `<p class="research-meta mono-num">${esc(item.id)} · ${esc(item.confidence)} confidence · ${esc(item.allowedUse)} · ${esc(item.review?.status || "unreviewed")}</p>`;
    return `<article class="research-item" data-research-mode="${esc(mode)}"><h4>${esc(item.claim)}</h4>${execSummary}${deepMeta}<p><b>Applies to:</b> ${esc(item.applicability)}</p><p><b>Limit:</b> ${esc(item.limitations)}</p><p class="research-links">${links(item.sourceIds)}</p></article>`;
  }).join("");
  const cropCards = crops.map((crop) => `<details class="research-item" open><summary>${esc(crop.commonName)} <span>· ${esc(crop.review?.status || "unreviewed")}</span></summary><div class="research-detail"><p><b>Family:</b> ${esc(crop.cropFamily)} · ${links(crop.cropFamilySourceIds)}</p><p><b>Applicable region:</b> ${esc(crop.regions.join(", "))}</p><p><b>Scope:</b> ${esc(crop.applicability)}</p><ul>${crop.traits.map((trait) => `<li><b>${esc(trait.trait)}:</b> ${esc(valueText(trait.value))}${trait.unit ? ` ${esc(trait.unit)}` : ""}. <span class="research-meta">${esc(trait.confidence)} confidence</span><br><span>Limit: ${esc(trait.limitations)}</span>${trait.conditions ? `<br><span>Conditions: ${esc(trait.conditions)}</span>` : ""}<br>${links(trait.sourceIds)}</li>`).join("")}</ul></div></details>`).join("");
  const references = sources.map((source) => `<article class="research-item"><h4>${esc(source.name)}</h4><p class="research-meta mono-num">${esc(source.id)} · ${esc(source.owner)} · ${esc(source.integrationStatus)} · checked ${esc(source.lastReviewed || "date unknown")}</p><p><b>Use:</b> ${esc(source.intendedUse)}</p><p><b>Limit:</b> ${esc(source.limitations)}</p><p class="research-links">${links([source.id])}</p></article>`).join("");
  return `<details class="research-group" open><summary>Regional facts and seasons <span>· ${esc(region.name)}</span></summary><div class="research-detail"><p>${esc(region.coverage)}</p><p><b>Major crops:</b> ${esc(region.majorCrops.join(", "))}. ${links(region.majorCropSourceIds)}</p><p><b>Additional crops explored:</b> ${esc(region.additionalCropsForExploration.join(", "))}. ${links(region.additionalCropSourceIds)}</p><h4>Documented rotation patterns</h4><ul>${rotations}</ul><h4>Climate risks</h4><ul>${risks}</ul><h4>Broad planting and harvest seasons</h4><ul>${seasons}</ul><p><b>Regional limitation:</b> ${esc(region.limitations)}</p></div></details>
    <details class="research-group" open><summary>Evidence claims <span>· ${evidence.length} records (${mode === "deep" ? "Deep Scientific Trial & Provenance View" : "Executive Agronomy View"})</span></summary><div class="research-grid">${claims}</div></details>
    <details class="research-group"><summary>Crop traits <span>· ${crops.length} regional records</span></summary><div class="research-crops">${cropCards}</div></details>
    <details class="research-group" open><summary>Source registry <span>· ${sources.length} references (NASA POWER, GPM IMERG, SSURGO, SoilGrids, Extension)</span></summary><p class="research-group-note">Integrated, research-only, and unavailable sources are labeled separately. A registered source is not automatically used in the app.</p><div class="research-grid">${references}</div></details>`;
}

export function renderResearch(catalog, options = {}) {
  const mode = options.mode || "executive";
  document.getElementById("researchBody").innerHTML = researchMarkup(catalog, { mode });
  document.getElementById("researchSummary").textContent = `${mode === "deep" ? "Source details" : "Practical overview"} · ${catalog.evidence.length} evidence claims · ${catalog.crops.length} regional crop records · ${catalog.sources.length} registered sources. Research-only until qualified human review.`;
}
