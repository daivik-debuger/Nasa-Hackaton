# FieldShift project plan

## Product objective

For one pilot region, let a farmer enter a field location, recent crop history, optional soil-test information, and priorities; combine those inputs with NASA and mapped-soil context; then compare three transparent rotation strategies with benefits, risks, missing data, uncertainty, and sources.

## Phase 1: Evidence foundation

Acceptance gate:

- Pilot region selected from a documented comparison.
- NASA dataset inventory completed with versions, variables, scale, limitations, and access method.
- Minimum viable crop list approved for that region.
- Crop/rotation evidence matrix completed and reviewed.
- Safe and prohibited claims documented.

## Phase 2: Data foundation

Acceptance gate:

- NASA POWER integration verified with saved test cases.
- Second NASA dataset selected because it changes a decision indicator.
- Mapped-soil source selected and its uncertainty exposed.
- Crop records validate against the schema and link to sources.
- Data failure and missing-value behavior defined.

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

Do not add global crop coverage, accounts, social features, hardware, a generic chatbot, or predictive yield until the core comparison journey passes Phases 1–4.

