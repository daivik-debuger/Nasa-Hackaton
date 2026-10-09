# FieldShift — worldwide goal, central Iowa demonstration

FieldShift is being built as a worldwide, mobile-first crop-rotation **exploration** app. The current build accepts global coordinates for NASA POWER climate context and attempts a NASA GPM IMERG precipitation cross-check. USDA SSURGO mapped soils and the cited crop/rotation catalog are still limited to the Central Iowa demonstration. It produces three inspectable Iowa patterns, not a ranked or approved agronomic recommendation. It does **not** yet provide worldwide crop or soil comparisons.

## Run

Node 22 or newer. `npm ci` installs the pinned Leaflet map library; there is no build step.

```sh
npm ci
npm run verify
npm start
```

Open <http://localhost:8000>. Use the satellite map to drop or drag a pin, switch to street view, choose a public example, or expand **Exact coordinates** for precise entry and keyboard fallback. The map library is served locally, but Esri or OpenStreetMap tiles require internet; the app does not download them for offline use. A generic static file server will display the page but **cannot provide mapped soil or IMERG data**, because `/api/soil` and `/api/imerg` require the included small Node server. NASA POWER is requested directly by the browser. USDA SSURGO and NASA IMERG are requested by the local server; all require internet. Set `PORT` to choose another port. Deployment needs a Node-capable host and HTTPS for phone installation.

The opening farm overview uses decorative generated agricultural photography and a coverage ring computed from valid NASA POWER days; it does not show a field-health score. The separate **Crops** section provides searchable Central Iowa crop research with evidence links, limitations, and an explicit boundary for locations outside the pilot. Image generation prompts and provenance are recorded in [docs/ASSET_PROMPTS.md](docs/ASSET_PROMPTS.md).

## What the pilot includes

- Central Iowa is the first research/demo catalog, not the intended worldwide product boundary. Global locations can request climate context; only the Iowa area enables mapped SSURGO soil and exploratory rotation patterns. No location is preselected; the public Ames-area example is not a verified field.
- Eight source-linked crop records under `data/crops/`; crop families, seasons, temperature/water/soil considerations, pH where supported, root-depth uncertainty, benefits, risks, confidence, and limitations.
- Eleven evidence records and five transparent rules under `data/`. Every rule is `research-only`, `humanApproved: false` until a named agronomist reviews it. No numeric yield, profit, water-saving, or soil-health score is asserted.
- USDA Soil Data Access lookup showing map unit, possible components, component percentages, drainage, texture by depth, horizon available water capacity, map-unit 0–100 cm available water storage, flooding frequency, missing values, and uncertainty. It is **not a lab soil test**; field pH and nutrients are not inferred.
- POWER daily temperature and rainfall history; IMERG half-hourly precipitation rates are sampled for the wettest valid POWER day in the selected end year. A matched daily amount is shown **only if all 48 in-day half-hour slots are valid**. The current public service returned 47 for the Iowa case-study day, so the IMERG total is withheld rather than guessed. IMERG failures remain visible and do not erase usable POWER context.
- Three exploratory patterns—lowest change, climate/cover, and soil/diversity—each with a “Why this strategy?” panel showing inputs, NASA and soil data, triggered rules, evidence links, missing inputs, confidence, benefits, risks, and local checks.

The catalog is deliberately small. Many crop-specific pH ranges, root-depth categories, and soil suitability thresholds remain `null` because they have not been sufficiently verified for this pilot. These gaps must not be silently filled by AI.

## Important limits

The region was selected for this implementation because [USDA NASS](https://www.nass.usda.gov/Quick_Stats/Ag_Overview/stateOverview.php?state=Iowa) records Iowa corn, soybean, alfalfa hay, and oats; [Iowa State Extension](https://naturalresources.extension.iastate.edu/encyclopedia/cover-crop-resources) documents locally used rotation/cover windows; and [USDA NRCS](https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo) provides mapped soil context. The earlier proposed three-region comparison was not completed. State-level crop acreage does not establish suitability for an individual field.

The worldwide expansion architecture and honest coverage states are defined in [docs/GLOBAL_COVERAGE.md](docs/GLOBAL_COVERAGE.md). The present app has a global location/climate path but is not a worldwide soil or crop-rotation tool yet. ISRIC currently says the SoilGrids beta REST API is paused, so no global soil lookup is claimed.

No human reviewer, farmer interview, physical-device test, HTTPS installation test, production security review, or economic feasibility study has been completed. The live NASA and USDA services can fail or change. When they fail, missing sources remain visible and the app does not invent replacements. Farmer notes stay in the current browser page. Opening or moving the map requests tiles for the visible area from Esri (satellite) or OpenStreetMap (streets), before **Load available data** is pressed; selected coordinates are transmitted to the requested NASA and soil services only when data is loaded. The Node server does not intentionally store requests. See [the privacy inventory](docs/PRIVACY.md).

## Files and checks

| Area | Files |
|---|---|
| Pilot and sources | `data/regions/central-iowa.json`, `data/sources.json` |
| Crops and evidence | `data/crops/*.json`, `data/evidence.json`, `data/rotation-rules.json` |
| Remote data | `src/api/*`, `server.js` |
| Indicators and comparison | `src/engine/*` |
| Interface and validation | `src/ui/*`, `src/validation/*`, `src/main.js` |
| Safety and decisions | `docs/SCIENTIFIC_SAFETY.md`, `docs/DECISIONS.md`, `docs/STATUS.md` |

`npm run verify` runs syntax, file/source-ID/data validation, and Node unit tests. Saved NASA POWER fixture data is under `tests/fixtures/`; tests do not depend on live services. GitHub Actions runs the same command. `npm run api:smoke` separately checks live services with a public demo point and currently fails the IMERG completeness gate. See [API readiness](docs/API_READINESS.md) and `docs/STATUS.md` before claiming a live three-source demo.

Contributor setup and review checks are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md); [the branch guide](docs/BRANCHING.md) assigns the lead and three research workstreams. The repository uses npm and port 8000; pnpm/Convex/port-3000 instructions from another project do not apply here.

Before sharing a hosted demo, use [the release checklist](docs/RELEASE_CHECKLIST.md), [deployment guide](docs/DEPLOYMENT.md), and [privacy/data-flow inventory](docs/PRIVACY.md). The [case study](docs/CASE_STUDY.md), [architecture figure](docs/architecture.svg), and [pitch draft](docs/PITCH_SCRIPT.md) are preparation materials, not a completed deployed submission or recorded video.
