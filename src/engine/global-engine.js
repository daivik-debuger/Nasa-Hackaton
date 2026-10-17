// Location-independent assessment. No country boxes, latitude-to-crop rules or guessed raster values.
export const KOPPEN_CODES = ['Af','Am','Aw','BWh','BWk','BSh','BSk','Csa','Csb','Csc','Cwa','Cwb','Cwc','Cfa','Cfb','Cfc','Dsa','Dsb','Dsc','Dsd','Dwa','Dwb','Dwc','Dwd','Dfa','Dfb','Dfc','Dfd','ET','EF'];
export const SOIL_TEXTURES = ['sand','loamy sand','sandy loam','loam','silt loam','silt','sandy clay loam','clay loam','silty clay loam','sandy clay','silty clay','clay'];
const missing = (v) => v === '' || v === null || v === undefined;
function numeric(value, name, min, max, required = false) {
  if (missing(value)) { if (required) throw new Error(`${name} is required.`); return null; }
  if (typeof value === 'boolean' || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`${name} must be between ${min} and ${max}.`);
  return Number(value);
}
export function resolveGlobalZone(input) {
  const lat = numeric(input.latitude, 'Latitude', -90, 90, true);
  const lon = numeric(input.longitude, 'Longitude', -180, 180, true);
  const elevationM = numeric(input.elevationM, 'Elevation in metres', -500, 9000);
  const koppen = input.koppen || null;
  if (koppen !== null && !KOPPEN_CODES.includes(koppen)) throw new Error('Choose a documented Köppen–Geiger class or leave it unknown.');
  if (!['unknown','rainfed','irrigated','supplemental'].includes(input.irrigation)) throw new Error('Choose a water-management system.');
  let lens = 'unresolved';
  if (koppen?.startsWith('B')) lens = 'dryland';
  else if (koppen?.startsWith('A')) lens = 'tropical';
  else if (/^[CD]/.test(koppen || '')) lens = 'temperate';
  else if (koppen?.startsWith('E')) lens = 'cold-limited';
  const lenses = lens === 'unresolved' ? [] : [lens];
  if (['irrigated','supplemental'].includes(input.irrigation)) lenses.push('irrigated');
  return { lat, lon, elevationM, koppen, lenses, classificationStatus: koppen ? 'user-supplied-unverified' : 'unavailable',
    gaez: null, hardiness: null, sourceId: 'beck-koppen-v2',
    limitation: 'Planning lenses are UI groupings, not FAO AEZ classes or suitability. Latitude and elevation are context only; no climate class is inferred from a coordinate. USDA hardiness is not a global rotation model.' };
}
export function waterBudget(input) {
  const etc = numeric(input.seasonEtcMm, 'Season crop evapotranspiration', 0, 10000);
  const effectiveRain = numeric(input.effectiveRainMm, 'Effective seasonal rainfall', 0, 10000);
  const netIrrigation = numeric(input.netIrrigationMm, 'Net seasonal irrigation', 0, 10000);
  const complete = [etc,effectiveRain,netIrrigation].every((v) => v !== null);
  return { status: complete ? 'scenario-arithmetic' : 'incomplete', etc, effectiveRain, netIrrigation,
    uncoveredEtMm: complete ? Math.max(0, Math.round((etc - effectiveRain - netIrrigation) * 100) / 100) : null,
    sourceId: 'fao-etc-method', limitation: 'Same-season user estimates only; excludes initial soil-water storage, groundwater, leaching and timing. Not an irrigation schedule. Annual POWER rainfall is not effective seasonal rain.' };
}
export function validateGlobalCatalog(catalog, sources) {
  const errors = [];
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.crops)) return ['Invalid global crop catalog.'];
  const ids = new Set();
  for (const c of catalog.crops) {
    if (!c || typeof c.id !== 'string' || ids.has(c.id) || !c.name || !c.group) { errors.push('Missing/duplicate crop identity.'); continue; }
    ids.add(c.id);
    if (!Array.isArray(c.sourceIds) || !c.sourceIds.length || c.sourceIds.some((id) => !sources.has(id))) errors.push(`Unknown source for ${c.id}.`);
    if (c.humanApproved !== false || !Array.isArray(c.approvedZoneIds) || c.approvedZoneIds.length) errors.push(`${c.id}: no validated global suitability release exists.`);
    for (const field of ['nFixationKgHa','nScavengingKgHa','rootArchitecture','diseaseBreak','phRange']) if (c[field] !== null) errors.push(`${c.id}: ${field} needs a scoped trait schema and review before activation.`);
    if (c.waterMm !== null && (!c.waterMm || ![c.waterMm.min,c.waterMm.max].every(Number.isFinite) || c.waterMm.min < 0 || c.waterMm.min > c.waterMm.max || !sources.has(c.waterMm.sourceId) || c.waterMm.usage !== 'context-only')) errors.push(`${c.id}: invalid water reference.`);
  }
  return errors;
}
export function assessGlobalField(input, catalog) {
  const zone = resolveGlobalZone(input);
  if (input.texture && !SOIL_TEXTURES.includes(input.texture)) throw new Error('Choose a USDA texture class or leave it unknown; FAO classes require a documented crosswalk.');
  const ph = numeric(input.ph, 'Measured pH', 0, 14);
  const som = numeric(input.som, 'Measured SOM percent', 0, 100);
  const annualRainMm = numeric(input.annualRainMm, 'Annual rainfall', 0, 20000);
  if (!Array.isArray(input.sequence) || !input.sequence.length || input.sequence.length > 6) throw new Error('Choose one to six crop phases.');
  const crops = input.sequence.map((id) => { const crop = catalog.crops.find((c) => c.id === id); if (!crop) throw new Error('Unknown crop in sequence.'); return crop; });
  const checks = [];
  if (crops.some((c,i) => i > 0 && c.id === crops[i-1].id)) checks.push({id:'repeat-crop',status:'review',text:'A crop repeats in consecutive phases. Review pathogen, weed and residue carryover locally; a repeat is not proof of failure.'});
  if (crops.some((c) => c.group === 'legume')) checks.push({id:'nitrogen',status:'unknown',text:'Legume present. N fixation, export and subsequent fertilizer credit are not interchangeable; no kg N/ha credit is assigned.'});
  checks.push({id:'disease',status:'unknown',text:'Nematode and fungal host compatibility is unreviewed. Crop-family diversity alone cannot establish a disease break.'});
  checks.push({id:'soil',status:'unknown',text: som === null ? 'SOM is missing; no soil trajectory can be inferred.' : 'One SOM measurement is a baseline, not a trend. Paired comparable samples are needed.'});
  if (zone.lenses.includes('dryland')) checks.push({id:'dryland',status:'review',text:'Dryland planning lens: confirm stored water, planting opportunity and cover-crop termination before adding a phase.'});
  if (zone.lenses.includes('tropical')) checks.push({id:'tropical',status:'review',text:'Tropical planning lens: map wet/dry seasons, cultivar duration, disease hosts and market access before multiple cropping.'});
  if (zone.lenses.includes('temperate')) checks.push({id:'temperate',status:'review',text:'Temperate planning lens: confirm frost-free window, winter survival and harvest-to-sowing intervals.'});
  if (zone.lenses.includes('irrigated')) checks.push({id:'irrigation',status:'review',text:'Irrigation planning lens: verify water allocation, drainage, salinity and actual delivery reliability.'});
  const missingInputs = [['Köppen class',zone.koppen],['Elevation',zone.elevationM],['Soil texture',input.texture || null],['pH',ph],['SOM',som],['Annual rainfall',annualRainMm]].filter(([,v]) => v === null).map(([k]) => k);
  return { zone, soil:{texture:input.texture || null,ph,som}, annualRainMm, crops, checks, water:waterBudget(input), missingInputs,
    status:'local-validation-required', confidence:'limited', recommendedSequence:null, predictedYield:null, dollarImpact:null,
    limitation:'No globally approved crop traits, rotation outcomes or field suitability are inferred. This checks a user-designed sequence and records unresolved evidence.' };
}
