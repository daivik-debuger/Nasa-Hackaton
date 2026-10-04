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
- Worldwide use is the product requirement. Global historical climate context is now available to request; regional soil and crop evidence are not yet worldwide.
- The current build accepts global coordinates for NASA POWER context, while gating SSURGO and crop strategies to the Central Iowa evidence catalog. A public point near Brasília returned 2025 POWER values in browser testing; IMERG was unavailable for that request and was shown as missing.
- Eight source-linked crop records, nine evidence records, and five research-only rules validate against the source registry. A source-location audit in `RESEARCH_EVIDENCE_AUDIT.md` documents what selected claims do and do not support.
- NASA POWER and USDA SSURGO returned the expected live response shapes at the public Iowa demonstration point. IMERG returned live samples but **not a complete day**: only 47 of 48 valid in-day half-hour slots were present on 2025-05-20, with an extra next-day boundary timestamp. The former 58.02 mm day-total claim has been retracted in `CASE_STUDY.md`.
- The IMERG parser now rejects incomplete or conflicting days rather than turning a partial sample into a daily total. A reproducible `npm run api:smoke` command and `API_READINESS.md` document the gate.
- The 2026-10-03 live `npm run api:smoke` result was POWER pass, SSURGO pass, IMERG fail (47/48 valid UTC slots). The command intentionally exited nonzero; the integration is not declared fully ready.
- The browser journey displayed POWER, SSURGO, three Iowa strategy cards, and a “Why this strategy?” explanation. IMERG may show unavailable and must not be described as reliable daily context until completeness is validated.
- At the public demo point, changing the market priority updated the card's visible question; no crop sequence is shown when last-season crop is missing.
- The engine now shows priority-specific questions without claiming predicted effects or a score. Unit tests also cover global coverage gating and server API behavior without external calls.
- A source-linked public-location technical case study, architecture diagram, draft pitch script, Docker packaging, Render Blueprint, deployment guide, and physical-device QA protocol exist; none is proof of deployment, recording, or device testing.
- Browser layout showed no horizontal overflow at 320, 375, 390, 430, and 1024 px. No app-origin browser console errors were observed; one browser-extension message was unrelated to the app.
- The updated UI again showed no horizontal overflow at 320, 375, 390, 430, and 1024 px with three cards displayed. Browser console contained no app-origin error during this journey.

## Not yet verified

- End-to-end NASA POWER/IMERG/SSURGO loading on a deployed HTTPS host.
- A dependable complete-day IMERG indicator from the current public image service; its current metadata ends at 2025-09-30 and tested Iowa days lack one half-hour slot.
- Physical keyboard, screen-reader, and touch QA of the updated global-coverage UI; focus styles are implemented but not yet tested on devices.
- Docker image build and hosted health-check behavior.
- Installation and offline reopening on real iOS and Android devices.
- Browser compatibility and mobile visual QA on physical devices.

## Not yet implemented

- Named agronomist review and approval of crop records and rotation rules. Current records are source-linked but still research-only.
- A three-region comparison to justify central Iowa relative to alternatives.
- A validated global soil provider and more region-scoped crop/rule catalogs. The ISRIC SoilGrids beta REST API is currently paused; WCS/WebDAV alternatives have not been integrated.
- Farmer validation of the interface and economic/operational feasibility of the options.
- Published HTTPS deployment.
- Review and merge of the `central-iowa-pilot` branch into `main`; a remote CI result for these setup edits has not yet been verified.
- Final three-minute narrated pitch and backup recording. Only the script exists.

## Current scientific boundary

The three strategy cards are computed exploratory patterns with evidence and uncertainty, **not approved recommendations or rankings**. Unknown pH ranges, root-depth classes, and crop-specific soil thresholds remain null. Mapped soil and satellite data are not exact field measurements.

## Next highest-value decision

Choose and validate a stable global soil access path, then add additional reviewed regional crop/rule packs. In parallel, obtain named agronomist review of the Iowa pack before activating ranking or field-specific claims.
