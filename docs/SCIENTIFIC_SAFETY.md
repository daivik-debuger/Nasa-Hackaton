# Scientific safety and claim policy

## Product position

FieldShift is an exploration and decision-support tool. It provides context and comparison, not agronomic, financial, safety, or legal instruction.

## Claim classes

### Allowed when sourced and correctly scoped

- Description of a dataset and its published resolution/coverage.
- Summary statistics calculated directly from valid source values.
- Qualitative rotation considerations supported by region-relevant evidence.
- Transparent comparison of how a documented rule responds to farmer priorities.
- Explicit uncertainty, missing information, and questions for local review.

### Require additional validation

- Numeric crop thresholds applied as recommendation rules.
- Claims about water savings, soil-carbon change, yield stability, or economic benefit.
- Transfer of evidence from a different climate, soil, management system, or crop variety.
- Use of vegetation indices to infer crop condition at a specific field.
- Use of mapped soil components as if they were exact field measurements.

### Prohibited for the MVP

- Guaranteed yield, profit, resilience, water saving, or soil-health outcome.
- Diagnosis of nutrient deficiency, disease, or exact soil chemistry from NASA imagery.
- Claim that NASA observations directly measure the farmer's field at sensor precision.
- Single unexplained “best rotation” output.
- Fabricated or AI-generated citations, interviews, measurements, confidence, or validation.
- Climate projections presented as seasonal weather forecasts.

## Evidence gate for an app rule

A rule may become active only when all are true:

1. The claim is supported by an authoritative or peer-reviewed source.
2. The applicable crop, region, management, climate, and soil conditions are recorded.
3. The effect and important counter-effect are recorded.
4. Conflicting evidence has been reviewed.
5. The UI can state why the rule fired and show its source.
6. Missing inputs cannot make the rule more confident.
7. A named human reviewer approves it with a date.

Until then, label it `research-only` and keep it out of ranking or scoring.

## Required result disclosure

Each strategy must show:

- Inputs used and not available.
- NASA/mapped datasets, period, unit, and scale.
- Rules or evidence IDs involved.
- Benefits and possible harms/tradeoffs.
- Confidence and why it is limited.
- A reminder to check local timing, seed, equipment, pest/disease, market, water, and agronomic constraints.

