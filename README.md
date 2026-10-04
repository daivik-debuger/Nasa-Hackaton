# FieldShift — central Iowa pilot

FieldShift is a mobile-first crop-rotation **exploration** app. It combines NASA POWER climate history, NASA GPM IMERG precipitation context, USDA SSURGO mapped soils, a small cited crop catalog, farmer history, and farmer priorities. It produces three inspectable patterns, not a ranked or approved agronomic recommendation.

## Run

Node 22 or newer; no npm dependencies or build step.

```sh
npm ci
npm run verify
npm start
```

Open <http://localhost:8000>. A generic static file server will display the page but **cannot provide mapped soil or IMERG data**, because `/api/soil` and `/api/imerg` require the included small Node server. NASA POWER is requested directly by the browser. USDA SSURGO and NASA IMERG are requested by the local server; all require internet. Set `PORT` to choose another port. Deployment needs a Node-capable host and HTTPS for phone installation.

## What the pilot includes

- Central Iowa research pilot; synthetic example coordinate near Ames. The app checks a pilot bounding box, which is not a field-suitability boundary.
- Eight source-linked crop records under `data/crops/`; crop families, seasons, temperature/water/soil considerations, pH where supported, root-depth uncertainty, benefits, risks, confidence, and limitations.
- Seven evidence records and five transparent rules under `data/`. Every rule is `research-only`, `humanApproved: false` until a named agronomist reviews it. No numeric yield, profit, water-saving, or soil-health score is asserted.
- USDA Soil Data Access lookup showing map unit, possible components, component percentages, drainage, texture by depth, horizon available water capacity, map-unit 0–100 cm available water storage, flooding frequency, missing values, and uncertainty. It is **not a lab soil test**; field pH and nutrients are not inferred.
- POWER daily temperature and rainfall history; IMERG half-hourly precipitation rates are integrated for the rainiest April–September day in the selected end year and summed to an estimated daily amount when all 48 samples are available. The UI displays the matched POWER amount and differences between products, but does not treat either as an exact field measurement.
- Three exploratory patterns—lowest change, climate/cover, and soil/diversity—each with a “Why this strategy?” panel showing inputs, NASA and soil data, triggered rules, evidence links, missing inputs, confidence, benefits, risks, and local checks.

The catalog is deliberately small. Many crop-specific pH ranges, root-depth categories, and soil suitability thresholds remain `null` because they have not been sufficiently verified for this pilot. These gaps must not be silently filled by AI.

## Important limits

The region was selected for this implementation because [USDA NASS](https://www.nass.usda.gov/Quick_Stats/Ag_Overview/stateOverview.php?state=Iowa) records Iowa corn, soybean, alfalfa hay, and oats; [Iowa State Extension](https://naturalresources.extension.iastate.edu/encyclopedia/cover-crop-resources) documents locally used rotation/cover windows; and [USDA NRCS](https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo) provides mapped soil context. The earlier proposed three-region comparison was not completed. State-level crop acreage does not establish suitability for an individual field.

No human reviewer, farmer interview, physical-device test, HTTPS installation test, production security review, or economic feasibility study has been completed. The live NASA and USDA services can fail or change. When they fail, missing sources remain visible and the app does not invent replacements. Farmer notes stay in the current browser page; coordinates are transmitted to the requested data services when **Load climate + soil data** is pressed. The Node server does not intentionally store requests.

## Files and checks

| Area | Files |
|---|---|
| Pilot and sources | `data/regions/central-iowa.json`, `data/sources.json` |
| Crops and evidence | `data/crops/*.json`, `data/evidence.json`, `data/rotation-rules.json` |
| Remote data | `src/api/*`, `server.js` |
| Indicators and comparison | `src/engine/*` |
| Interface and validation | `src/ui/*`, `src/validation/*`, `src/main.js` |
| Safety and decisions | `docs/SCIENTIFIC_SAFETY.md`, `docs/DECISIONS.md`, `docs/STATUS.md` |

`npm run verify` runs syntax, file/source-ID/data validation, and Node unit tests. Saved NASA POWER fixture data is under `tests/fixtures/`; tests do not depend on live services. GitHub Actions runs the same command. Browser and live-service verification are recorded in `docs/STATUS.md`.

Contributor setup and review checks are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). The repository uses npm and port 8000; pnpm/Convex/port-3000 instructions from another project do not apply here.

Before sharing a hosted demo, use [the release checklist](docs/RELEASE_CHECKLIST.md) and review [the privacy/data-flow inventory](docs/PRIVACY.md). This folder is connected to the `central-iowa-pilot` branch; CI must still verify any new commit on GitHub.
