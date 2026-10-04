# Project status

Last updated: 2026-10-03

## Confirmed

- FieldShift is a responsive PWA pilot with a small Node server for soil and IMERG access.
- Users can enter coordinates, a climate-history period, crop history, optional soil notes, and priorities.
- The app requests daily NASA POWER mean/max temperature and corrected precipitation.
- The interface displays transparent scale/capability warnings and does not prefill fabricated climate values.
- The app shell has a manifest, icon, and service worker.
- A real seven-day NASA POWER API response for the demonstration point is saved with retrieval metadata for deterministic tests.
- Dependency-free unit tests cover field-query validation, NASA missing values, request failures, crop record structure, and source-ID integrity.
- GitHub Actions configuration runs source/data checks and unit tests.
- Development setup now pins Node 22, has a dependency-free lockfile, a complete JavaScript syntax scan, and one `npm run verify` path shared by local work and CI.
- Local setup also checks app-shell/import paths and includes privacy, architecture, security, issue, and release-review guidance. The folder is connected to the existing `central-iowa-pilot` branch. Remote CI and merge status must be verified separately.
- Central Iowa is the bounded implementation pilot; the example point near Ames is synthetic, not a verified field.
- The user has clarified that worldwide use is the product requirement. The current app is still Iowa-only; scope documents now distinguish this demonstration from the intended global product.
- Eight source-linked crop records, seven evidence records, and five research-only rules validate against the source registry.
- USDA SSURGO Soil Data Access and NASA GPM IMERG API queries returned real data for the synthetic pilot point in local testing.
- The browser journey loaded NASA POWER, IMERG, and SSURGO; it displayed all three strategies and opened a complete “Why this strategy?” explanation.
- Browser layout showed no horizontal overflow at 320, 375, 390, 430, and 1024 px. No app-origin browser console errors were observed; one browser-extension message was unrelated to the app.

## Not yet verified

- End-to-end NASA POWER/IMERG/SSURGO loading on a deployed HTTPS host.
- Installation and offline reopening on real iOS and Android devices.
- Browser compatibility and mobile visual QA on physical devices.

## Not yet implemented

- Named agronomist review and approval of crop records and rotation rules. Current records are source-linked but still research-only.
- A three-region comparison to justify central Iowa relative to alternatives.
- Worldwide location routing, location-appropriate soil providers, region-scoped crop/rule catalogs, coverage states, and cross-region tests.
- Farmer validation of the interface and economic/operational feasibility of the options.
- Published HTTPS deployment.
- Review and merge of the `central-iowa-pilot` branch into `main`; a remote CI result for these setup edits has not yet been verified.
- Backup demo video and final three-minute pitch.

## Current scientific boundary

The three strategy cards are computed exploratory patterns with evidence and uncertainty, **not approved recommendations or rankings**. Unknown pH ranges, root-depth classes, and crop-specific soil thresholds remain null. Mapped soil and satellite data are not exact field measurements.

## Next highest-value decision

Build the global location/coverage flow without applying Iowa evidence elsewhere; in parallel, obtain named agronomist review of the existing Iowa crop/rule pack before activating ranking or field-specific claims.
