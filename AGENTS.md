# FieldShift agent instructions

These instructions apply to the entire repository. More specific instructions exist in `docs/AGENTS.md` and `data/AGENTS.md`.

## Mission

Build a mobile-first decision-support tool that combines NASA Earth observations, mapped soil context, crop evidence, crop history, and farmer priorities to compare rotation strategies. FieldShift explores options; it does not prescribe a crop or replace an agronomist.

The product target is worldwide use. NASA POWER location context is global. Global crop names and water-reference ranges are discovery data, not approved field recommendations. Regional reference scenarios cover Minnesota–Dakotas, western Kansas and Pendleton dryland; legacy mapped-soil integration and detailed crop traits remain Iowa-scoped. Never transfer a study to a map pin automatically.

## Token-efficient startup

1. Read this file.
2. Read `docs/STATUS.md` and the relevant section of `docs/PROJECT_PLAN.md`.
3. Open only the files needed for the requested task. Use targeted search instead of rereading the entire repository.
4. For scientific/data work, also read `docs/SCIENTIFIC_SAFETY.md` and `data/AGENTS.md`.
5. For documentation/research work, also read `docs/AGENTS.md`.

Do not repeatedly summarize the whole project. State the current task, edit the smallest coherent set of files, verify, and report the result plus any real limitation.

## Current architecture

- Installable PWA with a small React/Tailwind build for the global Plan, Crops and Research workspaces. Run `npm run build` before serving static output; `npm start` builds automatically. Never edit generated `dist/` assets.
- `index.html` and `workspace.css`: semantic legacy dashboard, map, location journey and four-view shell. `src/react/global-workspace.jsx` and `src/react/field.css`: the source for the global assessment, crop matrix and dual-level evidence panels. `scripts/build.mjs` emits `dist/global-app.js` and `dist/global-app.css` using esbuild and Tailwind PostCSS.
- `src/engine/global-engine.js` and `data/global-crops.json`: deterministic, evidence-gated global input checks and 34-crop reference matrix. `data/global-layers.json` records connected versus listed-only layers. This engine does not rank crops or generate a globally validated rotation.
- `src/ui/agronomy-view.js`: regional scenario form, explanations, empirical tables and observation availability.
- `src/engine/regional-engine.js`: deterministic constraints, scoped considerations, paired soil differences and POWER precipitation context.
- `src/agronomy-validation.js`: runtime catalog and reference validation.
- `data/agronomy.json` and `data/agronomy.schema.json`: regional cycles, benchmark measurements and rule contract; sources resolve through `data/sources.json`.
- `src/main.js`, `src/ui/`, and `src/validation/`: browser journey and field inputs.
- `src/coverage.js`: per-location availability gate; do not borrow Iowa evidence elsewhere.
- `src/api/`: browser API clients and server-side remote-service adapters.
- `src/engine/`: indicators, confidence, and explainable strategy comparisons.
- `server.js`: dependency-free Node server for the app and `/api/soil` and `/api/imerg` endpoints.
- `sw.js`, `manifest.webmanifest`, and `icon.svg`: same-origin app-shell caching and install metadata.
- `data/`: evidence schemas, crop records, rules, and source registry; never a dumping ground for uncited facts.
- `docs/`: decisions, research standards, safety, progress, and development workflow.

Keep dependencies minimal. Explain the tradeoff before adding a framework, external package, or new service.

## Design system

- Use locally bundled Space Grotesk for headings, body and controls. Use IBM Plex Mono only for measurements, status and metadata. Do not restore the rejected serif heading style. The font is built from the pinned `@fontsource/space-grotesk` package into `dist/`.
- Tokens: ink `#172b24`, canvas `#f3f6f4`, surface `#f7f8f6`, accent `#184c38`, navigation `#132d23`, field-lab dark `#172c24`, caution `#683d16`, critical `#762e24`. See `docs/DESIGN_SYSTEM.md`.
- Use a full-width dark navigation bar, centered 1600px workspace, 4/8/12/16/24/32/48px spacing, 1px rules and 2–4px control/surface radii. No ornamental gradients, pill panels or heavy shadows.
- Crops opens with a split green header and labeled wheat illustration, followed by separate discovery/evidence tabs. Keep all source and regional limitations visible.
- Dashboard holds map and observations; Plan leads with worldwide input assessment, while bounded regional scenarios stay in a labeled disclosure; Crops provides a global reference matrix plus GBIF discovery and scoped regional traits; Research shows trials with reading-level switch and source provenance.
- Keep keyboard-visible focus, 48–56px interactive targets, native control semantics, reduced motion and readable disabled/error states. Wide tables scroll inside labeled regions, not the page.
- Palette contrast tests are not certification of full WCAG AAA compliance.

## Regional engine and research contract

- Global zone lenses require a manually supplied Köppen class or explicitly entered irrigation. Coordinates and elevation are validated, not used as a proxy for GAEZ, Köppen, USDA hardiness or local suitability. GAEZ v5, HWSD v2, Köppen rasters, SMAP and Sentinel-2 are documented but not integrated. NASA POWER is integrated on Dashboard. Never label a listed-only layer as observed.
- Global crop entries must resolve their source IDs, retain `reviewStatus`, keep unreviewed numeric nitrogen, root, disease and pH traits null, and never claim that a FAO approximate crop-water range is a net irrigation requirement. A crop/zone transition needs region-specific applicability, cited conditions, limitations and named human approval before any scoring or ranking.
- The global assessment may calculate only transparent same-season water arithmetic from user-entered ETc, effective rain and irrigation. It emits review questions and missing inputs—not a best crop, yield, dollars or field outcome. Do not equate soil organic carbon with soil organic matter.
- Trial/benchmark data retain site, metric, unit, treatment/comparator, period, depth, design, source locator, confidence and limitations. Unknown p-values, sample sizes, dollar impacts and SOM conversion stay unavailable. The Executive view must not overstate the Scientific view.

- Require explicit reference-scenario mode and region selection. Match cycles to documented crop IDs; never invent a transition when crop history is unsupported.
- Required next crop, fallow permission and forage access determine constraint conflicts. Water supply, nodulation, disease history and comparable soil measurements determine evidence-linked considerations.
- Priorities highlight relevant tradeoffs; they must not become an unvalidated numerical score or ranking.
- Calculate observed SOM differences in percentage points and bulk-density differences in g/cm³ only from dated, same-protocol sample pairs. SOC is not SOM. A paired difference is not a statistically established trend or prediction.
- POWER annual precipitation indicators require every calendar day, including leap days. Missing/invalid values are not zero rainfall; a short baseline is not a climate normal or drought classification.
- Benchmark records retain region, metric, unit, study design, treatment/comparator, depth, period, sample size, source locator, confidence and limitations. Unknown measurements stay null. Keep treatment differences separate from annual rates.
- Resolve every source ID; reject unknown crop phases, duplicate IDs and unsupported rule conditions. Preserve discrepancies between a paper's abstract and results explicitly.
- All current rules remain research-only with humanApproved false and null reviewer/date. Named independent approval requires a separately reviewed release; never silently activate recommendations.
- SMAP and MODIS are documented but not connected. Listing an instrument is not an integration. Never populate their indicators with synthetic values presented as observations.

## Non-negotiable scientific rules

- Never fabricate a measurement, crop trait, citation, farmer interview, test result, accuracy figure, yield, probability, or impact number.
- NASA or mapped soil data must show source, variable, unit, date/period, spatial scale, and important limitations.
- Remote sensing and modeled grids are context, not exact field measurements.
- Do not infer field pH, nutrients, crop identity, yield, or soil health unless an appropriate validated source supports that exact inference.
- Every crop/rotation claim needs a source record, region, applicability conditions, confidence, and limitations.
- Missing data must remain visible. Never silently replace it with a confident default.
- AI may explain verified results in plain language. It may not invent agronomic evidence or provide unexplained recommendations.
- Present multiple strategies and tradeoffs, not a single guaranteed “best” crop.

## Product rules

- The core journey is: location -> NASA context + soil context + farmer inputs -> transparent indicators -> three comparable rotation strategies -> benefits, risks, uncertainty, and sources.
- Preserve mobile usability at 320 px and above.
- Forms need labels, validation, loading, empty, success, and failure states.
- Do not add decorative features ahead of the end-to-end decision journey.
- Do not hide caveats to make the demo sound stronger.
- Keep private field notes in the browser unless the user explicitly approves storage and a privacy design exists.

## Research and source policy

- Prefer official NASA/USDA/FAO/university-extension documentation and peer-reviewed reviews or studies.
- Use current official documentation for dataset versions and APIs.
- Record sources using the format in `docs/RESEARCH_STANDARD.md`.
- Separate direct evidence from team inference.
- Never cite a search-results page, AI answer, unsourced marketing page, or inaccessible quotation as primary evidence.
- Add only claims that pass the evidence gate in `docs/SCIENTIFIC_SAFETY.md`.

## Working style

- Preserve unrelated user changes.
- Make small, reviewable changes.
- Do not silently change geographic coverage, the validated region, scoring model, dataset, or scientific meaning.
- Record consequential decisions in `docs/DECISIONS.md` and update `docs/STATUS.md` after material work.
- Prefer transparent deterministic rules over a black-box model for the hackathon MVP.
- If live data cannot be verified, say so; do not imply the request succeeded.
- Keep the soil/IMERG server scope separate from manually selected reference scenarios. Do not widen location gates as a side effect of adding literature.

## Verification

Run before declaring a change complete:

```sh
npm run verify
```

For UI changes, also verify the relevant journey at 320, 375, 390, 430, and desktop widths. Check keyboard focus, horizontal overflow, readable charts, loading/error states, and browser console output. Live NASA requests and PWA installation require network/HTTPS verification; record what was and was not tested.

## Git conventions

- Work on a feature branch unless the user explicitly requests direct work on `main`.
- Commit format: `<area>: <specific outcome>`.
- Add a `Devlog:` trailer when the change is student-visible.
- Do not mix unrelated work in one commit.
- Never claim a push, deployment, test, or merge succeeded without evidence.

## Completion response

Report only:

- What changed.
- What was verified.
- What remains unverified or blocked.
- The next highest-value step, if relevant.
