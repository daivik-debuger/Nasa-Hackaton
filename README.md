# FieldShift — mobile-ready farm rotation explorer

FieldShift is an early, installable web-app prototype for exploring how NASA climate observations can inform crop-rotation questions. It works on mobile and desktop browsers and can be added to a phone's home screen as a Progressive Web App (PWA). It deliberately does **not** generate agronomic prescriptions or invent soil/crop facts.

## Project guide

- [`AGENTS.md`](AGENTS.md): focused instructions for coding agents and contributors.
- [`docs/STATUS.md`](docs/STATUS.md): what is confirmed, missing, or unverified.
- [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md): implementation phases and acceptance gates.
- [`docs/SCIENTIFIC_SAFETY.md`](docs/SCIENTIFIC_SAFETY.md): allowed, review-required, and prohibited claims.
- [`docs/TEAM_RESEARCH_TASKS.md`](docs/TEAM_RESEARCH_TASKS.md): the three-person research plan.
- [`docs/COMPETITION_SCORECARD.md`](docs/COMPETITION_SCORECARD.md): evidence-based submission readiness checklist.

For a full dependency-free verification, run `npm run verify`. `npm run check` validates syntax, required project files, crop schema shape, and every crop source ID; `npm test` runs the unit tests.

## Run and install

Serve these files from HTTPS or localhost (required for browser PWA features and NASA API requests). For local testing:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. Internet access is needed to load live NASA POWER data. On Android, use the browser menu and choose **Install app** or **Add to Home screen**. On iPhone/iPad, open the HTTPS site in Safari, tap **Share**, then **Add to Home Screen**. A hosted HTTPS deployment is needed for installation outside localhost; the prototype is not yet published.

The page sends the requested coordinates and date range to NASA POWER only when the user taps **Load NASA climate data**. Farmer-entered notes remain in the page and are not uploaded or saved. The service worker caches the app shell for repeat/offline opening; live climate requests still require internet.

## What is in this baseline

- Responsive field setup, location, date range, and farm-priority screens.
- A live NASA POWER Daily API request for temperature, corrected precipitation, and incoming sunlight. The view summarizes mean air temperature, summed daily precipitation, hot-day count, and a monthly climate chart.
- Farmer-provided crop history, optional soil texture/pH notes, and priorities.
- PWA manifest, icon, service worker, and offline-cached app shell.
- Warnings about grid scale and about the fact that remote sensing does not reveal exact field pH, nutrients, or yield.
- Rotation prompts for exploration only. There is no yield, drought-benefit, or soil-health scoring model.

## Testing foundation

- Climate validation, NASA response summarization, and request code live in testable modules under `src/`.
- Node's built-in test runner covers invalid coordinates, invalid year ranges, NASA fill values, empty climate data, HTTP failures, and network failures.
- Crop records are checked for the required evidence shape and unknown source IDs.
- A real, saved seven-day NASA POWER response is stored under `tests/fixtures/` with retrieval metadata. It is historical test data, not a forecast or field measurement.
- GitHub Actions runs `npm run check` and `npm test` for pull requests and pushes to `main`.

## Data inventory and boundaries

| Need | Source / approach | What it can support | Important limitation |
|---|---|---|---|
| Recent daily temperature, rainfall, solar radiation | [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) | Regional climate context at a requested point | Gridded estimates are not a field weather station; local rainfall may differ. This app requests UTC daily data. |
| Soil properties for a U.S. pilot | [USDA NRCS SSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo) | Mapped soil components/properties such as texture, drainage, available water capacity, and soil reaction where available | Components vary within map units and are not an exact field lab sample. No lookup is integrated yet. |
| Soil observations outside the U.S. | [ISRIC SoilGrids docs](https://docs.isric.org/globaldata/soilgrids/index.html) | Modeled global soil properties | Estimates have uncertainty; check current service availability before integrating. Farmer soil tests are preferable for field pH/nutrients. |
| Vegetation greenness / seasonal change (future layer) | [NASA MODIS vegetation indices](https://modis.gsfc.nasa.gov/data/dataprod/mod13.php) | Broad vegetation greenness patterns | Greenness is not crop identity, yield, or a direct soil-health measurement. Not integrated yet. |
| Seasonal climate scenarios (future layer) | [NASA NEX-GDDP-CMIP6](https://www.nccs.nasa.gov/data-collections/nex-gddp-cmip6/) | Long-term scenario comparisons | Scenarios are not next-season forecasts. Not integrated yet. |
| Crop traits and rotation effects | Region-specific extension/research material, farmer and advisor review | Only source- and region-specific facts should enter a future rules layer | No quantitative crop-effect database is bundled. Do not turn generic AI text into agronomic evidence. |

NASA SMAP soil-moisture products are another possible later layer. Select the exact product/version and explain its spatial and temporal scale before integration; satellite soil moisture is not a sensor reading from an individual field.

## Farmer information that helps

Minimum: field location, recent crop history, and priorities. Helpful but optional: recent soil-test report (especially pH and nutrients), texture/drainage knowledge, irrigation access, planting/harvest windows, equipment, field constraints, and locally available crops/markets. Farmers do not need their own weather station or satellite data.

## Next implementation steps

1. Validate coordinates and map boundaries with farmers in a chosen pilot region.
2. Add a verified local soil lookup and display map-unit uncertainty/source date.
3. Build a small reviewed crop-traits catalog with region, citation, and confidence for every claim.
4. Define comparison criteria with farmers and agronomists; display missing values, uncertainty, and tradeoffs instead of an unvalidated “best crop” score.
5. Test on actual iOS and Android devices, slow internet, multiple screen sizes, and local languages.
6. Only add NASA soil-moisture, vegetation-index, and climate-scenario layers after their scale and interpretation are clear in the UI.

## Verification note

The source and tests can be verified with `npm run verify`. The saved NASA fixture was retrieved from the official API, but the complete browser journey and install flow still need verification from an HTTPS deployment. Synthetic missing-value records exist only inside tests and are explicitly labeled as test cases.
