const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const labels = {
  growingPeriod: "Growing period",
  temperatureConsiderations: "Temperature",
  waterConsiderations: "Water",
  soilCompatibility: "Soil compatibility",
  phRange: "pH range",
  rootDepthCategory: "Root depth",
  rotationBenefits: "Possible rotation benefit",
  rotationRisks: "Possible rotation risk"
};
const portraitIds = new Set(["alfalfa", "cereal-rye", "corn", "oats", "oilseed-radish", "red-clover", "soybean", "winter-wheat"]);

function valueText(value) {
  if (value === null || value === undefined) return "Not established for this pilot";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function sourceLinks(ids, byId) {
  return [...new Set(ids)].map((id) => {
    const source = byId.get(id);
    if (!source) throw new Error(`Crop source ${id} is missing.`);
    const url = new URL(source.url);
    if (url.protocol !== "https:") throw new Error(`Crop source ${id} has an unsafe URL.`);
    return `<a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a>`;
  }).join(" ");
}

export function cropCardsMarkup(crops, sources, { search = "", role = "all" } = {}) {
  if (!Array.isArray(crops) || !Array.isArray(sources)) throw new Error("Crop catalog is incomplete.");
  const byId = new Map(sources.map((source) => [source.id, source]));
  const query = search.trim().toLocaleLowerCase();
  const filtered = crops.filter((crop) => (role === "all" || crop.roles.includes(role))
    && `${crop.commonName} ${crop.scientificName} ${crop.cropFamily}`.toLocaleLowerCase().includes(query));
  const html = filtered.map((crop) => {
    const period = crop.traits.find((trait) => trait.trait === "growingPeriod");
    const details = crop.traits.map((trait) => `<p><b>${esc(labels[trait.trait] || trait.trait)}:</b> ${esc(valueText(trait.value))}${trait.unit ? ` ${esc(trait.unit)}` : ""}. <span>Limit: ${esc(trait.limitations)}</span><br>${sourceLinks(trait.sourceIds, byId)}</p>`).join("");
    const portrait = portraitIds.has(crop.id) ? `<figure class="crop-portrait"><img src="./assets/crops/${crop.id}.jpg" alt="Illustration of ${esc(crop.commonName)} plant" loading="lazy"><figcaption>Illustration</figcaption></figure>` : "";
    return `<article class="crop-profile">${portrait}<div class="crop-profile-top"><span class="crop-profile-mark" aria-hidden="true">${esc(crop.commonName.charAt(0))}</span><span class="crop-profile-role">${esc(crop.roles.join(" · "))}</span></div><h3>${esc(crop.commonName)}</h3><em>${esc(crop.scientificName)}</em><p class="crop-family">${esc(crop.cropFamily)} family</p><p class="crop-period">${esc(valueText(period?.value))}</p><details><summary>Explore traits and sources</summary><div class="crop-profile-details"><p><b>Applies to:</b> ${esc(crop.applicability)}</p>${details}</div></details><p class="crop-profile-note">${esc(crop.review?.status || "unreviewed")} · Central Iowa pilot</p></article>`;
  }).join("");
  return { count: filtered.length, html: html || '<p class="empty-state">No pilot crop records match this search. Try another term or filter.</p>' };
}

export function renderCropExplorer(catalog, filters = {}) {
  const count = document.getElementById("cropCount");
  const cards = document.getElementById("cropCards");
  if (!catalog?.crops?.length) {
    count.textContent = "Crop catalog unavailable.";
    cards.textContent = "No crop traits can be shown until the source-linked catalog loads.";
    return;
  }
  const result = cropCardsMarkup(catalog.crops, catalog.sources, filters);
  count.textContent = `${result.count} of ${catalog.crops.length} Central Iowa research-only crop records shown.`;
  cards.innerHTML = result.html;
}

export function renderSelectedCropContext({ selectedRegion = null, crops = [], lastCrop = "", globalLastCrop = "" } = {}) {
  const target = document.getElementById("selectedCropContext");
  if (!selectedRegion) {
    const note = globalLastCrop.trim();
    target.textContent = note
      ? `Your crop note: ${note}. No regional crop trait profile is available for this location; the cards below remain Central Iowa research examples.`
      : "Choose a field to see which regional crop evidence applies. The profiles below are Central Iowa research examples.";
    return;
  }
  const crop = crops.find((item) => item.id === lastCrop);
  target.textContent = crop
    ? `Your last crop: ${crop.commonName}. Open its card for sourced traits, limitations, and rotation considerations.`
    : "Select last season's crop in the field section to connect your history to this pilot catalog.";
}
