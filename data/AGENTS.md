# Data instructions

These instructions apply inside `data/` and supplement the root `AGENTS.md`.

## Evidence gate

No crop property, threshold, rotation effect, or region-specific fact may enter an app-facing data file unless it includes:

- Stable ID and human-readable label.
- Value and unit, where relevant.
- Region and applicability conditions.
- Source ID linked to `sources.json`.
- Confidence and limitation.
- Review status and reviewer/date.

Unknown values must be `null` or omitted according to the schema, never guessed. Do not encode qualitative words as precise numeric scores without a documented mapping.

## Source registry

- `sources.json` records authoritative datasets and research sources.
- `integrationStatus` must be one of `integrated`, `planned`, `research-only`, or `unavailable`.
- A listed source is not automatically an integrated feature.
- Recheck current dataset version, endpoint, and availability before changing an integration to `integrated`.

## Crop data

- Validate crop records against `crop-record.schema.json`.
- Prefer a small reviewed catalog for one pilot region over broad, weak coverage.
- Conflicting sources stay visible in notes; do not average them silently.
- App rules should reference evidence IDs so the interface can show “Why this?” and sources.

## Privacy

Do not commit private farm names, exact private coordinates, personally identifying data, soil-test reports, credentials, API keys, or access tokens. Use clearly labeled synthetic/demo coordinates where necessary.

