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

## 2026-10-09 — Use a restrained planning workspace and independent climate series

**Decision:** Organize the interface as four explicit tasks—choose the field, review available data, add local knowledge, and compare supported strategies. Use the operating system font stack and quiet data surfaces instead of decorative marketing artwork. Plot temperature and rainfall in separate monthly panels and aggregate each variable from its own valid readings.

**Reason:** The product needs to look and behave like a trustworthy decision-support tool on phones, tablets, and laptops. A clear task hierarchy keeps source coverage, uncertainty, and next actions visible. Independent aggregation prevents missing values in one NASA POWER variable from silently removing valid observations from another.

## 2026-10-09 — Put an attributed satellite basemap beside the planning controls

**Decision:** Present the location picker as a large right-side satellite map on wide screens and a full-width map before field settings on smaller screens. Use the public [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) tile layer by default, with an OpenStreetMap street-view switch and automatic street-view fallback if satellite tiles fail. Do not cache or export either provider's tiles. Continue accepting global points and keep exact coordinates as a map-independent alternative.

**Reason:** A realistic aerial map makes field selection easier and matches the visual direction requested for the app. The basemap only shows location context; imagery dates and resolution vary, and it cannot justify a field-health score, nutrient reading, or plot alert. Provider attribution and the map-view privacy disclosure stay visible.

## 2026-10-09 — Reference-led farm overview with truthful measures

**Decision:** Use a dark agricultural photograph, olive data cards, a wheat accent, and a lime coverage ring to follow the supplied visual reference. Populate the data cards from actual NASA POWER response coverage and the local evidence catalog; show placeholders before loading. Put the Central Iowa crop profiles in a separate searchable research section with limitations and direct sources. Label generated photographs as decorative, never as farm imagery or a crop diagnosis.

**Reason:** The user asked for a closer visual match and an “all about crops” area. The reference contains financial, soil-health, and productivity numbers that this app cannot establish, so its composition is adapted without copying unsupported claims. The ring measures valid observation days, not farm performance or crop suitability.

## 2026-10-09 — Separate dashboard, planning, crops, and research

**Decision:** Keep the home dashboard focused on location selection, a NASA POWER valid-day coverage circle, historical climate summaries, trends, and the IMERG status. Move farmer inputs and strategy comparison into a Plan view, source-linked crop profiles and illustrative plant portraits into a Crops view, and the full evidence catalog into a Research view. Preserve hash deep links to each subsection and do not imply generated plant artwork is identification evidence.

**Reason:** A single long page made important climate context and field controls compete with the crop library. Focused views make the map and observations immediately legible without discarding the uncertainty and source detail required by the challenge.

## 2026-10-09 — Refine interaction hierarchy without changing scientific meaning

**Decision:** Use one consistent raised-surface, segmented-navigation, button-feedback, disclosure, and selected-input system across Dashboard, Plan, Crops, and Research. Keep the full FieldShift wordmark and all four tabs visible at 320 px by placing navigation on its own mobile row. Renumber the standalone Plan workflow from one to two without changing its input, engine, evidence, or coverage behavior.

**Reason:** The focused views were functional but still felt visually disconnected, and Plan displayed step numbers inherited from the former long page. A shared interaction language makes controls easier to recognize across phone, tablet, and laptop layouts while preserving the source-linked data and regional safety gates.

## 2026-10-11 — Lead with the map on phones

**Decision:** Show the map before the climate overview at phone widths, with a direct link to the period controls. Keep the overview and its valid-day coverage circle on the Dashboard. Preserve Dashboard hash navigation at the actual top of the view and offset section links below the sticky mobile header. Group Plan inputs by crop history and soil information.

**Reason:** The previous phone layout put a tall overview ahead of the first action, while some section links landed under the sticky header. The revised sequence makes place selection and the next action visible earlier without changing the NASA metrics, regional evidence gate, or comparison rules.
## 2026-10-11 — Separate worldwide crop discovery from reviewed regional evidence

FieldShift will expose a live GBIF plant-name lookup using the Catalogue of Life eXtended Release checklist in the Crops view and link to FAO Ecocrop's broader crop library. GBIF taxonomy supports name and family discovery, not agricultural suitability. FAO states that the original Ecocrop database was discontinued around 2015. Neither source feeds rotation rules or field-specific crop advice. Central Iowa's eight research-only records remain a separate regional evidence view. A bounded same-origin server proxy avoids browser cross-origin dependence and validates upstream responses. This is a discovery feature, not a claim of global scientific coverage.

## 2026-10-12 — Separate worldwide research context from regional agronomy

**Decision:** Put global observation products, broad rotation principles, and explicitly scoped non-Iowa studies at the start of Research, followed by the Central Iowa facts, evidence, and crop traits. Add source-linked context records with geographic applicability and limitations; validate that each remains `context-only` and `research-only`. Do not pass any of these records into the comparison engine.

**Reason:** The research page appeared to cover only Iowa even though farmers can inspect NASA climate context worldwide. A global data footprint is not global agronomic validation. Separating the two lets users research other locations without exporting Iowa-specific crop rules or implying a universal recommendation.

## 2026-10-15 — Make worldwide product scope visible across the site

**Decision:** State worldwide location and NASA climate exploration on the Dashboard, show three distinct coverage layers at the top of Research, and add a six-continent peer-reviewed rotation synthesis to the context-only library. Keep Central Iowa mapped soil, crop traits, and strategy comparisons explicitly regional. The new synthesis never feeds the comparison engine.

**Reason:** A visitor should not have to infer the product's worldwide aim from the map alone, but a globally sampled paper cannot approve a crop sequence for an arbitrary field. The source itself reports variation, nonsignificant outcomes, and unfavorable tradeoffs for some comparisons, so the UI must retain those limits rather than promising a universal benefit.

## 2026-10-16 — Replace accumulated UI overrides with an editorial workspace

**Decision:** Load one authored stylesheet after Leaflet, retain native HTML controls and all existing data/coverage interfaces, and organize the UI as a field journal with a persistent desktop rail, asymmetric map/coverage grid, and ruled evidence index. Use local serif/sans/mono stacks, square surfaces, 2px control radii, and a paper/ink/rust palette. Cache the new shell as v18.

**Reason:** A single presentation layer avoids competing legacy overrides and makes responsive behavior and contrast auditable. Palette tests enforce 7:1 authored text contrast without claiming complete AAA conformance. A framework migration would add complexity without helping this visual task. Global observations remain distinct from regional agronomy.

## 2026-10-16 — Regional reference engine and empirical research tables

**Decision:** Add three explicitly selected study-system packs, constraint evaluation and source-linked considerations. Keep all rules unapproved and unranked. Record empirical results with their study design instead of using published numbers as field predictions. Use locally licensed editorial/body/mono fonts and cache the updated shell as v19, superseding the system-only typography choice above.

**Reason:** Crop compatibility, local water constraints and matched laboratory observations can make the comparison functional without pretending that published trial results establish universal suitability. The Oregon paper's conflicting abstract/results rates are flagged rather than silently reconciled; SOM gaps remain null. SMAP/MODIS are not labeled integrated.

## 2026-10-16 — Replace rejected serif interface across all views

**Decision:** Supersede the serif/paper/side-rail presentation with locally served sans-serif headings, a full-width dark green navigation bar, a centered light workspace and crisp white analytical surfaces. Add the labeled wheat illustration to the Crops header and retain every existing control and evidence boundary. Update the shell cache to v20.

**Reason:** User feedback explicitly rejected the prior visual direction, especially the type. A global navigation, palette and typography change makes the revision consistent across Dashboard, Plan, Crops and Research rather than restricting it to the research panel.
