# Project status

Last updated: 2026-10-09

## Confirmed

- FieldShift is a responsive PWA pilot with a small Node server for soil and IMERG access.
- Users can drop or drag a map pin, choose a public example, or enter exact coordinates, plus a climate-history period, crop history, optional soil notes, and priorities.
- The app requests daily NASA POWER mean/max temperature and corrected precipitation.
- The interface displays transparent scale/capability warnings and does not prefill fabricated climate values.
- The app shell has a manifest, icon, and service worker.
- A real seven-day NASA POWER API response for the demonstration point is saved with retrieval metadata for deterministic tests.
- Node built-in unit tests cover field-query validation, NASA missing values, request failures, crop record structure, source-ID integrity, and map-point normalization.
- GitHub Actions configuration runs source/data checks and unit tests.
- Development setup pins Node 22, a lockfile with Leaflet 1.9.4, a complete JavaScript syntax scan, and one `npm run verify` path shared by local work and CI.
- Local setup also checks app-shell/import paths and includes privacy, architecture, security, issue, and release-review guidance. The map-picker change is on `feature/map-pin-picker`, based on `feature/functional-global-qa`; `develop` and `main` remain separate.
- Central Iowa is the bounded implementation pilot; the example point near Ames is synthetic, not a verified field.
- Worldwide use is the product requirement. Global historical climate context is now available to request; regional soil and crop evidence are not yet worldwide.
- The current build accepts global coordinates for NASA POWER context, while gating SSURGO and crop strategies to the Central Iowa evidence catalog. A public point near Brasília returned 2025 POWER values in browser testing; IMERG was unavailable for that request and was shown as missing.
- Eight source-linked crop records, eleven evidence records, five research-only rules, and 26 registered sources validate against the source registry. The in-app research library displays those records, applicability, limitations, review status, and source links. Two new context-only claims cover U.S. cover-crop persistence and Iowa economic-planning worksheets; neither changes a rotation rule. A source-location audit in `RESEARCH_EVIDENCE_AUDIT.md` documents what selected claims do and do not support.
- NASA POWER and USDA SSURGO returned the expected live response shapes at the public Iowa demonstration point. IMERG returned live samples but **not a complete day**: only 47 of 48 valid in-day half-hour slots were present on 2025-05-20, with an extra next-day boundary timestamp. The former 58.02 mm day-total claim has been retracted in `CASE_STUDY.md`.
- The IMERG parser now rejects incomplete or conflicting days rather than turning a partial sample into a daily total. A reproducible `npm run api:smoke` command and `API_READINESS.md` document the gate.
- The 2026-10-03 live `npm run api:smoke` result was POWER pass, SSURGO pass, IMERG fail (47/48 valid UTC slots). The command intentionally exited nonzero; the integration is not declared fully ready.
- The browser journey displayed POWER, SSURGO, three Iowa strategy cards, and a “Why this strategy?” explanation. IMERG may show unavailable and must not be described as reliable daily context until completeness is validated.
- At the public demo point, changing the market priority updated the card's visible question; no crop sequence is shown when last-season crop is missing.
- The engine now shows priority-specific questions without claiming predicted effects or a score. Unit tests also cover global coverage gating and server API behavior without external calls.
- A source-linked public-location technical case study, architecture diagram, draft pitch script, Docker packaging, Render Blueprint, deployment guide, and physical-device QA protocol exist; none is proof of deployment, recording, or device testing.
- Browser layout showed no horizontal overflow at 320, 375, 390, 430, and 1024 px. No app-origin browser console errors were observed; one browser-extension message was unrelated to the app.
- The updated UI again showed no horizontal overflow at 320, 375, 390, 430, and 1024 px with three cards displayed. Browser console contained no app-origin error during this journey.
- Team branch roles and PR targets are documented in `BRANCHING.md`; CI is configured for pushes to the integration and topic branch patterns.
- Crop validation now rejects malformed nested records, unknown or duplicate traits/sources, unsupported fields, and invalid human-review dates. The server sends basic anti-sniffing, origin-only cross-site referrer, and anti-framing headers. CI now builds and smoke-tests the Docker deployment image in addition to the Node checks.
- On 2026-10-08, `npm run verify` passed all 42 tests with local HTTP-listener access. Its syntax, asset/import, data, and project checks also passed.
- GitHub Actions [run 37216914697](https://github.com/daivik-debuger/Nasa-Hackaton/actions/runs/37216914697) passed for commit `aff665f`: both the Node verification job (including the HTTP-listener test) and the Docker build/start/health-and-assets smoke job succeeded.
- The location picker now offers six public example points across continents. The opt-in live `npm run api:smoke:global` passed on 2026-10-04: each point returned 366 valid daily temperature and precipitation values for 2024. In the browser, Brasília loaded POWER context and kept Iowa soil/rotation unavailable; IMERG timed out and remained explicitly unavailable. Responsive widths 320, 375, 390, 430, and 1024 px showed no horizontal overflow. No app-origin console warning or error was observed; browser-extension errors were unrelated.
- On 2026-10-08, the research library displayed all eleven evidence claims, eight crops, and 26 registered sources at 320, 375, 390, 430, and 1024 px without horizontal overflow, app-origin console errors, or page exceptions. Keyboard Enter opened the regional-facts disclosure and exposed its HTTPS source links. Choosing Brasília displayed the non-Iowa research boundary. A simulated catalog failure explicitly withheld comparisons and recovered after retry. These checks do not constitute screen-reader, human, or physical-device QA.
- The app now starts without an Iowa location preselected. Users choose any valid world coordinate or a labeled public example. Valid locations outside the Iowa evidence pack can enter local crop notes and use a worldwide field-snapshot action. It reports available NASA POWER history, farmer notes, priorities, and unsupported local evidence without applying Iowa crop rules. Rainfall sums, mean temperature, and hot-day counts disclose their respective valid-day coverage. All selected priorities appear on each Iowa strategy card; changing farm inputs removes stale comparisons. Invalid pH, invalid coordinates, malformed source responses, data retries, and location changes during an in-flight request have explicit states.
- On 2026-10-08, `npm run verify` passed 45 tests with no skips. Scripted browser journeys at 320, 375, 390, 430, and 1024 px covered Iowa strategies, global snapshots, all priority questions, pH and coordinate errors, privacy disclosure, research retry, data Retry/Refresh, offline banner, and stale-request cancellation; no page errors or horizontal overflow occurred. These journeys used clearly labeled synthetic soil and saved NASA fixtures, not live field measurements.
- The opt-in live 2024 NASA POWER smoke check passed at six public city-area points with 366 valid temperature and precipitation days each. A live browser request for Brasília also displayed 366 valid days; its IMERG result was deliberately mocked unavailable for browser isolation. A separate live Iowa check returned POWER and SSURGO map unit L107 with four possible components, while IMERG timed out. None of this establishes worldwide agronomic validity or a dependable IMERG daily total.
- On 2026-10-08, a map-first location picker was added with Leaflet 1.9.4 and OpenStreetMap tiles. `npm run verify` passed 46 tests with no skips. Scripted browser checks at 320, 375, 390, 430, and 1024 px exercised map click, marker drag, public-example sync, center pin, clear pin, exact-coordinate entry, and map-library failure fallback without page errors or horizontal overflow. A keyboard-pan/center-pin flow sent the chosen coordinates to the mocked NASA POWER request; eight map tiles returned HTTP 200, and the server's origin-only referrer policy was present. A screenshot confirmed actual map tiles and attribution at 390 px. The existing Iowa/global data journeys, validation, retry, offline banner, and stale-request cancellation still passed. This is browser automation, not physical-device, screen-reader, live NASA, or full tile-service reliability testing.
- The long-form interface now has a sticky section navigator. On desktop and tablet widths, the map and its field settings share a two-column workspace; phones retain the single-column order. This reduces the location step's height without hiding map status, privacy, precision-entry, or coverage information.
- The interface is now a restrained four-step planning workspace using system fonts, plain data surfaces, and an explicit worldwide-climate versus Central-Iowa-evidence boundary. Climate trends use separate monthly series so a missing rainfall reading cannot remove a valid temperature reading, or vice versa. On 2026-10-09, `npm run verify` passed 47 tests with no skips. Mocked end-to-end browser journeys passed at 320, 375, 390, 430, and 1024 px; additional layout checks passed at 768 and 1366 px with one app header, 44 px primary controls, no horizontal overflow, working anchor/keyboard disclosures, and no page errors. These checks are automated browser QA, not physical-device or human accessibility testing.
- On 2026-10-09, the opt-in live NASA POWER check again returned all 366 temperature and rainfall days for the six 2024 public example points. The combined live API check returned POWER and SSURGO successfully but intentionally failed overall because IMERG supplied only 47 of 48 required half-hour slots; no daily IMERG total was calculated.
- The planning screen now uses a compact two-column farm dashboard with a large attributed Esri satellite basemap on the right at laptop widths and a stacked map on tablets and phones. Users can switch to OpenStreetMap streets; satellite tile failures switch to streets automatically. Real satellite tiles returned successfully in automated browser checks at 320, 390, 768, 1024, 1366, and 1600 px. The selected map point still reaches NASA POWER requests; no visual soil-health scores or plot alerts are invented from imagery.
- The new farm overview follows the supplied dark agricultural-dashboard reference while retaining honest data boundaries: the coverage ring represents valid NASA POWER observation days, the climate card starts with blanks and fills only after loading, and the crop/evidence counts come from the validated pilot catalog. A separate searchable crop section exposes all eight Central Iowa records, limitations, and source links. Decorative photographs are disclosed as such. Automated 320, 390, 768, 1024, and 1366 px preview checks found no horizontal overflow or page exceptions; these used saved NASA fixtures rather than a new live-data check.

## Not yet verified

- End-to-end NASA POWER/IMERG/SSURGO loading on a deployed HTTPS host.
- A dependable complete-day IMERG indicator from the current public image service; its current metadata ends at 2025-09-30 and tested Iowa days lack one half-hour slot.
- Physical keyboard, screen-reader, and touch QA of the updated global-coverage UI; focus styles are implemented but not yet tested on devices.
- Hosted Render health-check behavior. The Docker image was built and smoke-tested in CI, but no public deployment has been checked.
- Installation and offline reopening on real iOS and Android devices.
- Browser compatibility and mobile visual QA on physical devices.
- Public Esri World Imagery and OpenStreetMap tile availability, latency, provider terms, and capacity under a hosted production workload; the app does not cache tiles offline.

## Not yet implemented

- Named agronomist review and approval of crop records and rotation rules. Current records are source-linked but still research-only.
- A three-region comparison to justify central Iowa relative to alternatives.
- A validated global soil provider and more region-scoped crop/rule catalogs. The ISRIC SoilGrids beta REST API is currently paused; WCS/WebDAV alternatives have not been integrated.
- Farmer validation of the interface and economic/operational feasibility of the options.
- Published HTTPS deployment.
- Review and merge of the current integration work into `develop`, then a reviewed release to `main`.
- Final three-minute narrated pitch and backup recording. Only the script exists.

## Current scientific boundary

The three strategy cards are computed exploratory patterns with evidence and uncertainty, **not approved recommendations or rankings**. Unknown pH ranges, root-depth classes, and crop-specific soil thresholds remain null. Mapped soil and satellite data are not exact field measurements.

## Next highest-value decision

Choose and validate a stable global soil access path, then add additional reviewed regional crop/rule packs. In parallel, obtain named agronomist review of the Iowa pack before activating ranking or field-specific claims.
