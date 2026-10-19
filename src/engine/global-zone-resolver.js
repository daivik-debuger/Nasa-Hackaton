const MACRO_ZONES = Object.freeze({
  "temperate-row-cereal": {
    id: "temperate-row-cereal",
    name: "Temperate Corn–Soy–Cereal Belt",
    koppen: "Dfa / Dfb / Cfb (Humid Continental & Maritime Temperate)",
    faoAez: "Temperate Sub-Humid to Humid (LGP 150–240 days)",
    analogs: "US Midwest, Central & Eastern Europe, Ukraine, Argentine Pampas",
    constraints: "Frost-bounded autumn cover windows, spring seedbed wetness, nitrate leaching, annual weed resistance.",
    schemaPattern: "Warm-Season Row Crop → Overwintering/Winter-Killed Cover → Legume Cash Crop → Small-Grain / Forage Phase"
  },
  "semi-arid-dryland": {
    id: "semi-arid-dryland",
    name: "Semi-Arid & Dryland Water-Limited Belt",
    koppen: "BSk / BSh / Csa / Csb (Steppe & Mediterranean Dry-Summer)",
    faoAez: "Sub-Tropics & Temperate Semi-Arid (LGP 75–149 days)",
    analogs: "US High Plains, Mediterranean Basin, Australian Wheatbelt, West African Sahel",
    constraints: "Soil moisture conservation, fallow evaporation vs. cover transpiration, wind erosion, terminal heat stress.",
    schemaPattern: "Winter Cereal → Standing Stubble + Shallow Pulse (Pea/Lentil/Chickpea) → Drought-Tolerant C4 Cereal / Oilseed"
  },
  "tropical-multicrop": {
    id: "tropical-multicrop",
    name: "Tropical & Subtropical Multi-Cropping System",
    koppen: "Aw / Am / Cwa (Tropical Savanna & Humid Subtropical)",
    faoAez: "Tropics Warm Sub-Humid to Humid (LGP 180–300+ days)",
    analogs: "Brazilian Cerrado (Safra/Safrinha), Sub-Saharan Africa, Southeast Asia Uplands",
    constraints: "Rapid organic residue decomposition, low-CEC weathered soils (Oxisols/Ultisols), year-round nematode pressure.",
    schemaPattern: "Main-Wet-Season Legume (Soybean/Groundnut) → Second-Season Cereal + Tropical Forage Intercrop (Maize + Brachiaria/Crotalaria)"
  },
  "irrigated-monsoon": {
    id: "irrigated-monsoon",
    name: "Irrigated Alluvial & Monsoon Multi-Crop System",
    koppen: "Cwa / Aw / BWh-Irrigated (Monsoon & Alluvial Valleys)",
    faoAez: "Sub-Tropics / Tropics Irrigated & Floodplain Alluvial",
    analogs: "Indo-Gangetic Plain (Kharif/Rabi), Nile Delta, Mekong & Yangtze Basins",
    constraints: "Groundwater depletion, puddled-soil plowpan compaction, short turnaround window between harvests, salinity.",
    schemaPattern: "Monsoon/Warm Grain (Rice/Maize/Cotton) → Short-Window Green Manure / Pulse → Cool-Season Cereal/Legume/Oilseed (Wheat/Chickpea/Mustard)"
  }
});

export function resolveGlobalZone({ lat, lon, elevationM = 250, precipRegime = "auto", irrigation = "rainfed" } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }
  const absLat = Math.abs(lat);
  const elev = Number.isFinite(Number(elevationM)) ? Number(elevationM) : 250;

  let zoneKey = "temperate-row-cereal";
  if (irrigation === "full-irrigated" || precipRegime === "monsoon-bimodal") {
    zoneKey = "irrigated-monsoon";
  } else if (precipRegime === "arid-semi-arid" || precipRegime === "mediterranean-winter") {
    zoneKey = "semi-arid-dryland";
  } else if (precipRegime === "tropical-wet-dry") {
    zoneKey = "tropical-multicrop";
  } else if (precipRegime === "auto") {
    // Coordinate-based FAO AEZ / Köppen heuristic when regime is auto
    if (absLat <= 24 && elev < 1900) {
      zoneKey = (lon >= 68 && lon <= 92 && lat >= 8 && lat <= 32) ? "irrigated-monsoon" : "tropical-multicrop";
    } else if ((absLat >= 28 && absLat <= 42 && lon >= -10 && lon <= 40) || (lon >= 114 && lon <= 150 && lat <= -24) || (lon >= -105 && lon <= -98 && lat >= 32 && lat <= 45)) {
      zoneKey = "semi-arid-dryland";
    } else {
      zoneKey = "temperate-row-cereal";
    }
  }

  const lapsePenalty = (elev / 1000) * 6.5;
  const thermalBand = absLat < 18 && lapsePenalty < 8
    ? "Tropical Frost-Free (USDA 11–13 equiv. / FAO Tropics Warm)"
    : absLat < 32 && lapsePenalty < 10
    ? "Subtropical / Warm Temperate (USDA 8–10 equiv.)"
    : absLat < 47
    ? "Temperate Continental / Maritime (USDA 5–7 equiv.)"
    : "Cool Temperate / Boreal Margin (USDA 2–4 equiv.)";

  return {
    ...MACRO_ZONES[zoneKey],
    elevationM: elev,
    irrigation,
    precipRegime,
    thermalBand
  };
}

// 24 Global Archetype Species supplementing the 8 Verified Central Iowa Pilot Crops (Total = 32 Crops)
// Strictly adheres to data/AGENTS.md: unverified numeric field values remain null ("Not established").
export const GLOBAL_ARCHETYPE_CROPS = Object.freeze([
  { id: "grain-sorghum", commonName: "Grain sorghum (milo)", scientificName: "Sorghum bicolor", cropFamily: "Poaceae", group: "cereal", zones: ["semi-arid-dryland", "tropical-multicrop", "temperate-row-cereal"], roles: ["cash-grain"], nDynamics: "Moderate N consumer; high C:N stalk residue", rootArchitecture: "Dense fibrous drought-tolerant root system", pestBreak: "Non-host for corn rootworm and soybean cyst nematode (SCN)", waterIndex: "Low-to-Medium relative water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "pearl-millet", commonName: "Pearl millet", scientificName: "Pennisetum glaucum", cropFamily: "Poaceae", group: "cereal", zones: ["semi-arid-dryland", "tropical-multicrop"], roles: ["cash-grain", "cover", "forage"], nDynamics: "Scavenges subsoil nitrate in coarse/low-fertility profiles", rootArchitecture: "Rapidly penetrating deep fibrous roots", pestBreak: "Suppresses root-lesion nematodes (Pratylenchus spp.)", waterIndex: "Very Low relative water requirement (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "spring-barley", commonName: "Barley (spring / winter)", scientificName: "Hordeum vulgare", cropFamily: "Poaceae", group: "cereal", zones: ["semi-arid-dryland", "temperate-row-cereal", "irrigated-monsoon"], roles: ["cash-grain", "cover"], nDynamics: "Moderate N uptake; early harvest opens widest fall cover window", rootArchitecture: "Fibrous root mass with high salinity tolerance", pestBreak: "Early maturity disrupts late-season annual grass weed seed set", waterIndex: "Low-to-Medium water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "triticale", commonName: "Winter triticale", scientificName: "× Triticosecale", cropFamily: "Poaceae", group: "cereal", zones: ["temperate-row-cereal", "semi-arid-dryland"], roles: ["forage", "cover", "cash-grain"], nDynamics: "High fall/spring nitrate scavenging", rootArchitecture: "Vigorous deep overwintering fibrous root system", pestBreak: "Ground cover and winter annual weed suppression before double-crop", waterIndex: "Medium relative water demand (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "paddy-upland-rice", commonName: "Rice (lowland / upland)", scientificName: "Oryza sativa", cropFamily: "Poaceae", group: "cereal", zones: ["irrigated-monsoon", "tropical-multicrop"], roles: ["cash-grain"], nDynamics: "High N demand; benefits from pre-monsoon legume green manure", rootArchitecture: "Shallow aerenchymatous roots in puddled soils; deeper in direct-seeded systems", pestBreak: "Flooding suppresses upland nematodes; rotating to Rabi pulse breaks stemborer", waterIndex: "High in flooded paddy; moderate in Direct-Seeded Rice (DSR)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "buckwheat", commonName: "Buckwheat", scientificName: "Fagopyrum esculentum", cropFamily: "Polygonaceae", group: "cereal", zones: ["temperate-row-cereal", "irrigated-monsoon"], roles: ["cover", "cash-grain"], nDynamics: "Non-fixer; root exudates solubilize soil calcium-bound phosphorus", rootArchitecture: "Shallow, finely branched fibrous topsoil conditioning roots", pestBreak: "45-day rapid canopy smothers summer weeds; supports beneficial insects", waterIndex: "Low-to-Medium water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "teff", commonName: "Teff", scientificName: "Eragrostis tef", cropFamily: "Poaceae", group: "cereal", zones: ["semi-arid-dryland", "tropical-multicrop"], roles: ["forage", "cash-grain"], nDynamics: "Low N requirement; scavenges surface N in short summer windows", rootArchitecture: "Shallow, dense fibrous roots", pestBreak: "Non-host for major row-crop cyst nematodes", waterIndex: "Low water requirement (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "sorghum-sudangrass", commonName: "Sorghum-sudangrass", scientificName: "Sorghum bicolor × sudanense", cropFamily: "Poaceae", group: "forage", zones: ["temperate-row-cereal", "semi-arid-dryland", "tropical-multicrop"], roles: ["cover", "forage"], nDynamics: "High N scavenging; builds high-biomass organic matter", rootArchitecture: "Deep, aggressive fibrous root mass (enhanced by mowing)", pestBreak: "Dhurrin exudates suppress Meloidogyne root-knot nematodes when incorporated", waterIndex: "Low-to-Medium water use per unit biomass (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "crimson-clover", commonName: "Crimson clover", scientificName: "Trifolium incarnatum", cropFamily: "Fabaceae", group: "legume", zones: ["temperate-row-cereal", "semi-arid-dryland"], roles: ["cover", "forage"], nDynamics: "Symbiotic N2 fixation (kg N/ha field-dependent; null without biomass test)", rootArchitecture: "Shallow-to-medium taproot with dense fibrous laterals", pestBreak: "Early spring bloom supports beneficial predatory insects", waterIndex: "Medium relative water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "hairy-vetch", commonName: "Hairy vetch", scientificName: "Vicia villosa", cropFamily: "Fabaceae", group: "legume", zones: ["temperate-row-cereal", "semi-arid-dryland"], roles: ["cover"], nDynamics: "High spring biological N2 fixation ahead of warm-season cereals", rootArchitecture: "Shallow branching taproot", pestBreak: "Broadleaf cover diversity; caution for hard-seed persistence in winter wheat", waterIndex: "Medium relative water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "field-pea", commonName: "Field / winter pea", scientificName: "Pisum sativum", cropFamily: "Fabaceae", group: "legume", zones: ["semi-arid-dryland", "temperate-row-cereal"], roles: ["cash-grain", "cover"], nDynamics: "Symbiotic N2 fixation with lower water draw than perennial legumes", rootArchitecture: "Shallow-to-moderate taproot (preserves deep subsoil moisture)", pestBreak: "Replaces bare fallow in dryland wheat; requires 3–4 yr gap for Aphanomyces", waterIndex: "Low-to-Medium seasonal water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "chickpea", commonName: "Chickpea (garbanzo)", scientificName: "Cicer arietinum", cropFamily: "Fabaceae", group: "legume", zones: ["semi-arid-dryland", "irrigated-monsoon"], roles: ["cash-grain"], nDynamics: "Biological N2 fixation under dryland or receding monsoon (Rabi) moisture", rootArchitecture: "Deep taproot extracting receding profile water", pestBreak: "Breaks cereal take-all and crown rot in dryland wheat and post-rice systems", waterIndex: "Low seasonal water requirement; intolerant of waterlogging", sourceIds: ["usda-cover-crop-chart"] },
  { id: "lentil", commonName: "Lentil", scientificName: "Lens culinaris", cropFamily: "Fabaceae", group: "legume", zones: ["semi-arid-dryland", "irrigated-monsoon"], roles: ["cash-grain", "cover"], nDynamics: "Symbiotic N2 fixation with minimal water footprint", rootArchitecture: "Slender, shallow taproot", pestBreak: "Broadleaf break crop in semi-arid cereal belts and Rabi rotations", waterIndex: "Low water consumption (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "cowpea", commonName: "Cowpea", scientificName: "Vigna unguiculata", cropFamily: "Fabaceae", group: "legume", zones: ["semi-arid-dryland", "tropical-multicrop"], roles: ["cash-grain", "cover", "forage"], nDynamics: "Heat-tolerant N2 fixation in acidic or sandy low-fertility soils", rootArchitecture: "Deep taproot with strong mycorrhizal association", pestBreak: "Key sorghum/millet rotation partner in Sahel, Cerrado, and Southern Plains", waterIndex: "Low relative water requirement (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "sunn-hemp", commonName: "Sunn hemp", scientificName: "Crotalaria juncea", cropFamily: "Fabaceae", group: "legume", zones: ["tropical-multicrop", "semi-arid-dryland", "irrigated-monsoon"], roles: ["cover", "forage"], nDynamics: "Rapid 60-day warm-season biological N2 fixation", rootArchitecture: "Deep, vigorous taproot", pestBreak: "Suppresses root-knot (Meloidogyne) and reniform nematodes in tropical rotations", waterIndex: "Low-to-Medium water demand (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "pigeon-pea", commonName: "Pigeon pea (guandu)", scientificName: "Cajanus cajan", cropFamily: "Fabaceae", group: "legume", zones: ["tropical-multicrop", "irrigated-monsoon", "semi-arid-dryland"], roles: ["cash-grain", "cover", "forage"], nDynamics: "Fixes N2 and root exudates mobilize Fe/Al-bound phosphorus in Oxisols", rootArchitecture: "Woody deep taproot ('biological plow' for compacted subsoils)", pestBreak: "Diversifies maize, cotton, and upland rice systems", waterIndex: "Low water requirement once established; deep drought extraction", sourceIds: ["usda-cover-crop-chart"] },
  { id: "faba-bean", commonName: "Faba / broad bean", scientificName: "Vicia faba", cropFamily: "Fabaceae", group: "legume", zones: ["temperate-row-cereal", "semi-arid-dryland", "irrigated-monsoon"], roles: ["cash-grain", "cover"], nDynamics: "High biological N2 fixation potential in cool-temperate & Mediterranean zones", rootArchitecture: "Stout taproot tolerating heavier clay soils than pea/lentil", pestBreak: "Non-host for cereal cyst nematodes; breaks wheat take-all", waterIndex: "Medium-to-High water demand relative to chickpea/lentil", sourceIds: ["usda-cover-crop-chart"] },
  { id: "mungbean", commonName: "Mungbean (green gram)", scientificName: "Vigna radiata", cropFamily: "Fabaceae", group: "legume", zones: ["irrigated-monsoon", "tropical-multicrop", "semi-arid-dryland"], roles: ["cash-grain", "cover"], nDynamics: "Short 60–75 day N2-fixing pulse between wheat harvest and monsoon rice", rootArchitecture: "Medium taproot", pestBreak: "Breaks continuous cereal-cereal (rice-wheat) pest and weed cycles", waterIndex: "Low seasonal water requirement", sourceIds: ["usda-cover-crop-chart"] },
  { id: "canola-rapeseed", commonName: "Canola / oilseed rape", scientificName: "Brassica napus", cropFamily: "Brassicaceae", group: "brassica", zones: ["temperate-row-cereal", "semi-arid-dryland"], roles: ["cash-grain", "cover"], nDynamics: "High N and Sulfur uptake; scavenges subsoil nitrate", rootArchitecture: "Deep taproot penetrating moderate traffic pans", pestBreak: "Suppresses Gaeumannomyces graminis (take-all fungus) in wheat rotations", waterIndex: "Medium seasonal water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "brown-mustard", commonName: "Brown / oriental mustard", scientificName: "Brassica juncea", cropFamily: "Brassicaceae", group: "brassica", zones: ["semi-arid-dryland", "irrigated-monsoon", "temperate-row-cereal"], roles: ["cash-grain", "cover"], nDynamics: "Rapid N and S scavenging", rootArchitecture: "Taproot with dense fine lateral distribution", pestBreak: "High glucosinolate biofumigant suppression of soilborne fungi & nematodes", waterIndex: "Low-to-Medium water use; more heat/drought tolerant than canola", sourceIds: ["usda-cover-crop-chart"] },
  { id: "forage-turnip", commonName: "Forage / purple top turnip", scientificName: "Brassica rapa", cropFamily: "Brassicaceae", group: "brassica", zones: ["temperate-row-cereal", "semi-arid-dryland"], roles: ["cover", "forage"], nDynamics: "Scavenges autumn nitrate; low C:N grazing foliage", rootArchitecture: "Bulbous crown with medium taproot", pestBreak: "Integrates autumn livestock grazing into annual crop sequences", waterIndex: "Medium fall water use (USDA Chart v4.0)", sourceIds: ["usda-cover-crop-chart"] },
  { id: "sunflower", commonName: "Sunflower", scientificName: "Helianthus annuus", cropFamily: "Asteraceae", group: "oilseed", zones: ["semi-arid-dryland", "temperate-row-cereal"], roles: ["cash-grain", "cover"], nDynamics: "Scavenges deep leached nitrate below cereal/soybean rooting zones", rootArchitecture: "Very deep taproot", pestBreak: "Adds Asteraceae family; shares Sclerotinia (white mold) host status with soybean/canola", waterIndex: "Medium total use; deep subsoil moisture extraction", sourceIds: ["usda-cover-crop-chart"] },
  { id: "winter-camelina", commonName: "Winter camelina", scientificName: "Camelina sativa", cropFamily: "Brassicaceae", group: "oilseed", zones: ["temperate-row-cereal", "semi-arid-dryland"], roles: ["cash-grain", "cover"], nDynamics: "Overwintering nitrate scavenger with lower C:N tie-up than cereal rye", rootArchitecture: "Fine, branched taproot", pestBreak: "Non-host for Soybean Cyst Nematode; fits relay-cropping in northern zones", waterIndex: "Low seasonal water requirement", sourceIds: ["usda-cover-crop-chart"] },
  { id: "brachiaria-ruzi", commonName: "Brachiaria (Congo signalgrass)", scientificName: "Urochloa ruziziensis", cropFamily: "Poaceae", group: "forage", zones: ["tropical-multicrop"], roles: ["cover", "forage"], nDynamics: "Deep nutrient cycling and biological nitrification inhibition (BNI)", rootArchitecture: "Massive deep fibrous root system rebuilding Oxisol aggregation", pestBreak: "High-C:N surface mulch shields tropical soil from >40°C baking and suppresses weeds", waterIndex: "Medium-High while growing; mulch reduces dry-season soil evaporation", sourceIds: ["usda-cover-crop-chart"] }
]);

export function buildGlobalZoneArchetypes(zone, { lastCropNote = "", priorities = [], soilPh = null, somPercent = null, soilTexture = "" } = {}) {
  const priorityMap = {
    water: "Water balance check: Compare seasonal rainfall distribution and subsoil moisture before planting cover or deep-rooted forages.",
    cover: "Soil cover check: Verify whether autumn frost or dry-season onset leaves sufficient moisture to establish ground cover.",
    diversity: "Pest & root diversity check: Alternate C3/C4 grasses (Poaceae) with taprooted legumes (Fabaceae) and brassicas/oilseeds.",
    market: "Operational & market check: Confirm local seed supply, drill/planter compatibility, and grain/forage market outlets."
  };
  const questions = priorities.map((p) => priorityMap[p]).filter(Boolean);
  const missing = [
    `Validated regional crop and rule pack for ${zone.name} (Central Iowa rules are withheld outside Iowa)`,
    soilPh === null && "Laboratory soil pH (not inferred from satellites)",
    !somPercent && "Laboratory Soil Organic Matter % (not inferred from satellites)",
    !soilTexture && "Laboratory soil texture class",
    "Local agronomist review and cultivar maturity check"
  ].filter(Boolean);

  const byZone = {
    "temperate-row-cereal": [
      {
        badge: "ARCHETYPE A · TEMPERATE BASELINE",
        title: "Annual Cereal–Legume/Oilseed Alternation",
        sequence: [lastCropNote ? `Prior: ${lastCropNote}` : "Warm/Cool Cereal", "Broadleaf Legume or Oilseed (Soybean / Field Pea / Canola)", "Winter or Spring Cereal"],
        benefit: "Alternates Poaceae with Fabaceae/Brassicaceae to interrupt cereal rootworm and take-all fungal carryover.",
        risk: "Leaves fallow winter soil exposed to nitrate leaching and sheet erosion if no overwintering cover is included."
      },
      {
        badge: "ARCHETYPE B · OVERWINTERING SCAVENGER",
        title: "Post-Harvest Cover & Nitrate Scavenger Window",
        sequence: ["Main Cash Cereal", "Overwintering Cover (Cereal Rye / Winter Camelina / Crimson Clover)", "Broadleaf Cash Crop"],
        benefit: "Maintains living root armor through dormant season and scavenges mobile residual nitrate.",
        risk: "Spring termination timing must be calibrated to local spring rainfall to avoid seedbed drying or N tie-up."
      },
      {
        badge: "ARCHETYPE C · MULTI-FAMILY BREAK",
        title: "Small-Grain + Perennial/Biennial Forage Phase",
        sequence: ["Small Grain (Wheat / Oats / Barley)", "Frost-Seeded Clover or Alfalfa Forage Break", "High-N Demand Row Crop"],
        benefit: "Combines fibrous and deep-taproot architectures while supplying biological N2 fixation.",
        risk: "Requires livestock or commercial forage outlet and subsoil moisture monitoring before returning to grain."
      }
    ],
    "semi-arid-dryland": [
      {
        badge: "ARCHETYPE A · FALLOW REPLACEMENT",
        title: "Standing Stubble + Shallow-Rooted Pulse Rotation",
        sequence: [lastCropNote ? `Prior: ${lastCropNote}` : "Winter Wheat / Barley", "Shallow-Rooted Pulse (Field Pea / Lentil)", "Drought-Tolerant Cereal (Wheat / Sorghum)"],
        benefit: "Replaces evaporative bare fallow with an N-fixing pulse that extracts less deep moisture than perennial legumes.",
        risk: "Low post-harvest pulse residue requires no-till standing cereal stubble to prevent wind erosion."
      },
      {
        badge: "ARCHETYPE B · C4 WATER-LIMITED",
        title: "High-Residue C4 Cereal–Dryland Pulse Sequence",
        sequence: ["Grain Sorghum / Pearl Millet", "Chickpea / Cowpea", "Winter Cereal or Oilseed"],
        benefit: "High-C:N C4 stalks trap precipitation and reduce soil surface evaporation under high evaporative demand.",
        risk: "Deep-rooted broadleaf crops (Sunflower / Alfalfa) can deplete deep profile water ahead of dryland wheat."
      },
      {
        badge: "ARCHETYPE C · MOISTURE-TRIGGERED COVER",
        title: "Opportunistic Flex-Cover Window",
        sequence: ["Cereal Harvest", "Conditional Short-Window Cover (Oats / Pea / Mustard — early termination)", "Cash Grain"],
        benefit: "Adds biological root exudates and grazing value in above-average moisture years.",
        risk: "Dryland safety rule: must terminate cover early if soil moisture probes or seasonal rainfall fall below threshold."
      }
    ],
    "tropical-multicrop": [
      {
        badge: "ARCHETYPE A · SAFRA / SAFRINHA SEQUENTIAL",
        title: "Main-Wet Legume → Second-Season C4 Cereal",
        sequence: [lastCropNote ? `Prior: ${lastCropNote}` : "Main Wet: Soybean / Cowpea", "Second Season: Maize or Grain Sorghum", "Dry-Season Residue Management"],
        benefit: "Utilizes long tropical wet season for two cash harvests per year.",
        risk: "Rapid microbial decomposition in warm tropics leaves Oxisols bare in the dry season without high-C:N grass mulch."
      },
      {
        badge: "ARCHETYPE B · CONSÓRCIO INTERCROP",
        title: "Second-Season Maize + Tropical Forage Grass Mulch",
        sequence: ["Wet Season: Soybean", "Second Season: Maize intercropped with Urochloa (Brachiaria) ruziziensis", "Dry Season: High-Biomass Straw Armor"],
        benefit: "Builds persistent surface mulch over low-CEC tropical soils, buffers >40°C soil temperatures, and cycles deep nutrients.",
        risk: "Requires timely herbicide desiccation before planting the next wet-season cash crop."
      },
      {
        badge: "ARCHETYPE C · NEMATICIDAL BREAK",
        title: "Nematode-Suppressive Legume & Woody Taproot Break",
        sequence: ["Soybean / Cotton", "Sunn Hemp (Crotalaria juncea) + Pigeon Pea Break", "Maize + Forage Grass"],
        benefit: "Suppresses Meloidogyne (root-knot) and reniform nematodes while penetrating compacted tropical subsoils.",
        risk: "Trades a second cash grain window for biological pest suppression and soil organic matter recovery."
      }
    ],
    "irrigated-monsoon": [
      {
        badge: "ARCHETYPE A · RICE–WHEAT DIVERSIFICATION",
        title: "Monsoon Cereal → Cool-Season Pulse/Oilseed Substitute",
        sequence: [lastCropNote ? `Prior: ${lastCropNote}` : "Kharif (Monsoon): Rice / Maize", "Rabi (Winter): Chickpea, Lentil, or Brown Mustard", "Zaid (Spring): Short-Duration Mungbean"],
        benefit: "Reduces winter groundwater extraction compared to continuous irrigated wheat and breaks grass-weed resistance.",
        risk: "Puddled rice plowpans require careful seedbed management to prevent waterlogging in Rabi pulses."
      },
      {
        badge: "ARCHETYPE B · PRE-MONSOON GREEN MANURE",
        title: "Short-Window Legume Green Manure Incorporation",
        sequence: ["Rabi Harvest", "45–60 Day Pre-Monsoon Sunn Hemp / Cowpea / Mungbean", "Monsoon Cash Cereal"],
        benefit: "Supplies labile biological N and improves aggregate stability prior to monsoon cereal establishment.",
        risk: "Requires reliable pre-monsoon irrigation or early showers for timely establishment."
      },
      {
        badge: "ARCHETYPE C · ALLUVIAL FORAGE BREAK",
        title: "Multi-Cut Winter Forage Legume Integration",
        sequence: ["Warm Season: Maize / Cotton / Rice", "Cool Season: Multi-Cut Berseem Clover (Trifolium alexandrinum)", "Following Year: High-N Cash Crop"],
        benefit: "Repeated winter forage cuttings exhaust annual weed seedbanks while fixing biological nitrogen.",
        risk: "Requires local livestock forage demand and salinity-aware irrigation scheduling."
      }
    ]
  };

  return (byZone[zone.id] || byZone["temperate-row-cereal"]).map((item) => ({
    ...item,
    zoneName: zone.name,
    koppen: zone.koppen,
    faoAez: zone.faoAez,
    questions,
    missing
  }));
}
