# Decision log

## 2026-10-03 — Product boundary

**Decision:** FieldShift is an exploration and comparison tool, not an agronomic prescription engine.

**Reason:** The available NASA and mapped-soil data provide regional context and cannot establish exact field outcomes without local evidence and ground truth.

## 2026-10-03 — Delivery format

**Decision:** Use a mobile-first PWA for the MVP.

**Reason:** One codebase can be demonstrated on mobile and desktop and installed from an HTTPS site without app-store review. Native packaging can follow if validated needs require it.

## 2026-10-03 — Pilot region

**Status:** Superseded by the central Iowa pilot decision below. Des Moines coordinates were a demonstration point only.

## 2026-10-03 — Recommendation approach

**Decision:** Prefer transparent, evidence-linked deterministic comparison rules for the MVP. AI may explain verified outputs but cannot invent agronomic facts or secretly determine rankings.

**Reason:** Explainability and scientific validity are central judging risks.

## 2026-10-03 — Central Iowa pilot selected

**Decision:** Limit the first evidence catalog and comparison flow to central Iowa. The app gate covers a practical central-Iowa bounding box and is not a soil-survey or agronomic boundary. The synthetic demo point is near Ames, not a verified field.

**Reason:** USDA NASS documents corn, soybean, alfalfa hay, and oats in Iowa; Iowa State Extension documents the corn–soybean baseline, locally used cover crops, and timing/termination issues; USDA NRCS provides mapped SSURGO soil context. These sources support a credible first test. The team has not completed the earlier proposed three-region comparison, so this is an implementation pilot, not proof it is the objectively best region.

**Human review:** No named agronomist has approved the crop records or rules. They remain research-only and cannot drive a ranked recommendation.

## 2026-10-03 — No persistent farmer database in the pilot

**Decision:** Keep evidence records in version-controlled JSON and farmer inputs in the current browser page. Request remote observations only when the user asks for them. Do not add accounts or persistent field storage for the pilot.

**Reason:** The comparison journey does not require saved fields, while persistence would introduce privacy, security, retention, and deletion obligations. Revisit this decision only when a validated user need and an explicit data policy exist.

## 2026-10-03 — Worldwide product requirement clarified

**Decision:** FieldShift is intended for farmers worldwide. Central Iowa remains the first implemented demonstration and evidence catalog, not a permanent product limit. The current location gate and U.S. soil integration are implementation gaps to remove with location-aware coverage and provider selection.

**Reason:** The challenge and user goal concern farmers around the world. Earlier project language treated a pilot as if it were the final scope. Global access must not be confused with globally valid soil/crop/rotation advice; each layer needs explicit geographic applicability and honest unsupported states.

## 2026-10-03 — Global observation path with regional evidence gates

**Decision:** Accept global coordinates for historical NASA POWER context and attempt IMERG where data are returned. Keep SSURGO and rotation patterns limited to the Iowa demonstration; show unsupported soil/crop coverage elsewhere. Use a whole-calendar-year wettest valid POWER day for the IMERG cross-check instead of assuming every location has an April–September growing season.

**Reason:** This moves toward worldwide use without transferring Iowa agronomy to other regions. The IMERG comparison is historical context only and may fail independently of POWER. [ISRIC's current documentation](https://docs.isric.org/globaldata/soilgrids/index.html) says its beta SoilGrids REST API is paused, so a quick global soil integration would be unreliable.

## 2026-10-03 — IMERG daily completeness gate

**Decision:** A matched-day IMERG rainfall total is shown only when all 48 half-hour UTC slots for that day are present, valid, and nonconflicting. A next-day boundary sample is not a substitute for a missing in-day value.

**Reason:** A live audit of the Iowa demonstration day returned only 47 valid in-day slots while including the next midnight. Earlier code treated the 48 raw unique timestamps as a complete day and produced a misleading total. The case study now retracts that figure. IMERG remains an attempted second dataset, but its daily indicator is withheld until the public service or a different validated access route supplies complete data.

## 2026-10-04 — Team integration branches

**Decision:** Keep `main` for reviewed releases, start `develop` from the latest pilot commit, and give the project lead and three research workstreams separate topic branches. New work enters `develop` through PRs; a later reviewed PR can bring the integrated result to `main`.

**Reason:** The pilot is ahead of `main`, while research and app work can proceed independently. A shared integration branch gives the team a clear base without silently promoting unreviewed science or changing the release branch.

## 2026-10-04 — Validate deployable code and review metadata

**Decision:** Require structural and provenance checks for each crop record, including valid dated human review before a record can be marked reviewed or approved. Keep the implementation dependency-free for this small, fixed schema. In CI, build and smoke-test the same Docker image intended for Render as well as running Node checks.

**Reason:** A passing unit suite alone cannot catch malformed evidence metadata or packaging errors. These gates improve codebase reliability without implying that research-only agronomy or live external datasets have been scientifically validated.

## 2026-10-04 — Demonstrate global NASA coverage without exporting Iowa agronomy

**Decision:** Keep NASA POWER requests coordinate-based worldwide, add public example points across six continents and a repeatable live POWER smoke check, and continue withholding Iowa soil and crop strategies outside the pilot region. Treat IMERG as independently optional until complete-day samples are dependable.

**Reason:** An Iowa default location obscured the already-global observation path. Example points and live checks make that path testable and visible while preserving the scientific boundary between global gridded climate context and region-specific agronomic evidence.

## 2026-10-08 — Expose the research and preserve its review boundary

**Decision:** Show the complete registered source, claim, and crop-trait catalog in an in-app research library with citations, applicability, limitations, and review status. Add USDA ERS cover-crop persistence and Iowa State cover-crop economics worksheets as context-only evidence. Do not turn either into a rotation rule, numerical benefit, or ranking.

**Reason:** Users and reviewers need to inspect the basis for the pilot, including negative and economic considerations. Neither source proves a field-specific outcome, and no named agronomist has approved the current rules. The library remains Central Iowa-specific even when global NASA observations are available.

## 2026-10-08 — Make worldwide field exploration functional without exporting Iowa rules

**Decision:** Start with no region preselected. Let users at valid locations outside the Iowa evidence pack enter free-text crop notes and review their own NASA climate and soil-test notes as a non-prescriptive field snapshot. Keep Iowa crop traits, mapped SSURGO lookup, and three rotation patterns gated to their documented region. Treat each live data source as independently available or unavailable, and withhold malformed soil or incomplete IMERG results.

**Reason:** Worldwide is the product goal, so a disabled comparison button should not prevent a farmer elsewhere from using supported global climate data. But a working button cannot imply that Iowa agronomy is valid worldwide. The field snapshot is useful while additional regional soil, crop, season, and rule catalogs are researched and reviewed.

## 2026-10-08 — Make location selection map-first

**Decision:** Use a locally served, pinned Leaflet map library with OpenStreetMap raster tiles for click/drag pin selection. Keep public example locations and a collapsed exact-coordinate form as keyboard, precision, and map-failure alternatives. Do not cache map tiles in the app's offline shell.

**Reason:** A map is easier than typing latitude and longitude for exploratory use worldwide. The small fixed dependency and local assets avoid a proprietary map API key, while the [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/) requires attribution, normal browser caching, and a browser referrer. The map exposes the viewed area to the tile provider before the farmer loads observations, so the interface and privacy inventory disclose that tradeoff. Map selection changes location input only; it does not expand regional soil or rotation evidence.
