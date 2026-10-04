# FieldShift agent instructions

These instructions apply to the entire repository. More specific instructions exist in `docs/AGENTS.md` and `data/AGENTS.md`.

## Mission

Build a mobile-first decision-support tool that combines NASA Earth observations, mapped soil context, crop evidence, crop history, and farmer priorities to compare rotation strategies. FieldShift explores options; it does not prescribe a crop or replace an agronomist.

The target is a credible NASA Space Apps demonstration for one evidence-backed pilot region. Do not claim worldwide scientific support until each new region is validated.

## Token-efficient startup

1. Read this file.
2. Read `docs/STATUS.md` and the relevant section of `docs/PROJECT_PLAN.md`.
3. Open only the files needed for the requested task. Use targeted search instead of rereading the entire repository.
4. For scientific/data work, also read `docs/SCIENTIFIC_SAFETY.md` and `data/AGENTS.md`.
5. For documentation/research work, also read `docs/AGENTS.md`.

Do not repeatedly summarize the whole project. State the current task, edit the smallest coherent set of files, verify, and report the result plus any real limitation.

## Current architecture

- Installable PWA with no frontend framework or build step.
- `index.html` and `styles.css`: accessible content and responsive presentation.
- `src/main.js`, `src/ui/`, and `src/validation/`: browser journey and field inputs.
- `src/api/`: browser API clients and server-side remote-service adapters.
- `src/engine/`: indicators, confidence, and explainable strategy comparisons.
- `server.js`: dependency-free Node server for the app and `/api/soil` and `/api/imerg` endpoints.
- `sw.js`, `manifest.webmanifest`, and `icon.svg`: same-origin app-shell caching and install metadata.
- `data/`: evidence schemas, crop records, rules, and source registry; never a dumping ground for uncited facts.
- `docs/`: decisions, research standards, safety, progress, and development workflow.

Keep dependencies minimal. Explain the tradeoff before adding a framework, external package, or new service.

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
- Do not silently change the pilot region, scoring model, dataset, or scientific meaning.
- Record consequential decisions in `docs/DECISIONS.md` and update `docs/STATUS.md` after material work.
- Prefer transparent deterministic rules over a black-box model for the hackathon MVP.
- If live data cannot be verified, say so; do not imply the request succeeded.

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
