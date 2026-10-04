# FieldShift project plan

## Product objective

Build a worldwide location-aware tool: let a farmer enter a field location, recent crop history, optional soil-test information, and priorities; combine available Earth-observation and mapped-soil context with locally applicable crop evidence; then compare transparent rotation strategies only where their regional evidence is valid. Show useful data and explicit coverage gaps elsewhere rather than applying Iowa rules worldwide.

## Phase 1: Global-ready architecture and first validated region

Acceptance gate:

- Global location and coverage-state model defined; central Iowa remains the first demonstration catalog, not the product boundary.
- First demonstration region selected from a documented comparison.
- NASA dataset inventory completed with versions, variables, scale, limitations, and access method.
- Minimum viable crop list approved for that region.
- Crop/rotation evidence matrix completed and reviewed.
- Safe and prohibited claims documented.

## Phase 2: Layered data foundation

Acceptance gate:

- NASA POWER integration verified with saved test cases.
- Second NASA dataset selected because it changes a decision indicator.
- Mapped-soil source selected and its uncertainty exposed.
- Soil-source selection is location-aware; a U.S.-only source is never presented as worldwide coverage.
- Crop records validate against the schema and link to sources.
- Data failure and missing-value behavior defined.
- A location outside reviewed rotation catalogs can still show supported data layers, but cannot receive Iowa-based strategies.

## Phase 3: Explainable comparison engine

Acceptance gate:

- Generates three distinct strategy types: lowest-change, climate-resilience, and soil/diversity exploration.
- Every effect traces to an evidence ID.
- Farmer priorities visibly alter comparisons.
- Missing inputs reduce confidence instead of being guessed.
- Output includes advantages, disadvantages, uncertainty, and local-review questions.
- No guaranteed yield or universal “best crop” language.

## Phase 4: Mobile product

Acceptance gate:

- Complete journey works at 320 px and on actual iOS/Android devices.
- Accessible labels, focus, contrast, and tap targets.
- Readable charts and evidence panels.
- Loading, error, retry, offline-shell, and empty states.
- Privacy explanation and local-data behavior are accurate.

## Phase 5: Competition package

Acceptance gate:

- One real-location case study with reproducible data and no private information.
- Three-minute pitch and backup recording.
- Architecture/data-flow figure.
- Complete source attribution.
- Public repository and HTTPS demo.
- `COMPETITION_SCORECARD.md` has evidence for every completed box.

## Scope control

Worldwide use is the product requirement, not a stretch goal. Expand by explicit dataset coverage and reviewed regional crop/rule packs; do not equate a globally reachable website with globally valid recommendations. Defer accounts, social features, hardware, a generic chatbot, and predictive yield until the core comparison journey passes Phases 1–4.
