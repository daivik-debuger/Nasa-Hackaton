# Regional reference engine

## Implemented contract

The Plan workbench compares published cycles in three manually selected study systems. It does not geolocate validated recommendations. The original Iowa field workflow remains in a labeled disclosure.

Input: reference-scenario mode, region ID, last crop, optional required next crop, water adequacy, fallow permission, forage access, nodulation, disease history, priorities and optional paired laboratory samples. The optional POWER record comes from the selected map point, which may differ from the study location.

Output: documented cycles anchored after the last crop; constraint conflicts; scoped rule IDs, benefits, risks, missing inputs and source IDs; observed paired soil differences; complete-year precipitation context. No scores, fertilizer credits, predicted soil changes or yield estimates are produced. Priority selection highlights considerations rather than imposing unvalidated weights.

Data contract: data/agronomy.schema.json documents structural fields. src/agronomy-validation.js checks catalog structure and semantic references during npm run check and at runtime. tests/regional-engine.test.mjs checks region isolation, constraints, missing values, matched soil samples, calendar completeness and escaped source rendering.

## Evidence extraction

| Source ID | Locator | Allowed use / limitation |
| --- | --- | --- |
| umn-small-grain-rotations | Tables 5–6 and nitrogen/disease discussion | Minnesota/North Dakota example cycles; not state-wide suitability |
| ks-cover-trial-2020 | Abstract and Results; DOI 10.4148/2378-5977.7930 | Brownell trial, not all Kansas; observed yield comparator and qualitative soil context |
| sd-tillage-trial-2001 | Abstract, 1999 bulk-density comparison | Tillage treatment difference, not a rotation effect or temporal trend |
| pnw-carbon-2025 | Results, Table 2, methods and study site | Use Results carbon rates; abstract differs. Unequal archival periods and modeled measurements limit cross-treatment inference |
| osu-pea-management | Nodulation and disease management | Green-pea guidance; do not assume identical fertilizer credits for other pulse systems |

Direct URLs and titles resolve through data/sources.json; benchmark rows retain source locators, soil depth, period, design, sample size where extracted, confidence and limitations. SOM and SOC are distinct. No empirical SOM delta was extracted; the gap is explicit instead of filled with an estimate. Annual carbon rates are not interchangeable with treatment differences.

## NASA availability

POWER PRECTOTCORR supplies complete-calendar-year totals, a descriptive latest-year departure from available earlier complete years, and the longest below-1-mm/day run. Missing days interrupt runs and invalidate a complete-year indicator. These are not climate normals, forecasts or drought classifications.

SMAP SPL3SMP_E v6 and MODIS MOD13Q1 v061 are documented source candidates, **not connected**. Earthdata authorization, quality screening and spatial/temporal interpretation must be implemented before changing that status. Existing IMERG remains separate and retains its full-day completeness gate.

## Release boundary

All six rules are research-only and humanApproved is false. A source citation is not human approval. Obtain named agronomic review, locally representative evidence and field validation before activating rankings or prescriptions. Synthetic weather test series validate calculations only; they do not prove live service reliability.
