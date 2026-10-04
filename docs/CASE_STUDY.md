# Reproducible public-location demonstration — near Ames, Iowa

**Status:** Technical case study of a real geographic point, not a verified farm field or farmer outcome. The coordinate (42.035, −93.55) is a public demonstration point. No private field information or interview is claimed.

## Inputs and retrieval

- Point: latitude `42.035`, longitude `-93.55`.
- Historical period: 2025-01-01 through 2025-12-31, UTC.
- Farmer history and priorities: not observed; any app selections for a demo are hypothetical.
- Retrieved 2026-10-03 (America/New_York) from [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/), [NASA GPM IMERG image service](https://gis.earthdata.nasa.gov/portal/rest/services/GESDISC/GPM_3IMERGHH/ImageServer), and [USDA Soil Data Access](https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx). These are gridded/mapped products, not field measurements.

## Observed output at retrieval

| Layer | Result | Important limit |
|---|---|---|
| POWER daily mean air temperature | 10.27 °C across 365 valid days | Coarse grid, not field air temperature |
| POWER 2025 precipitation total | 914.10 mm | Historical period total, not future water supply |
| POWER days with maximum ≥30 °C | 31 days | Not a crop heat-stress model |
| POWER wettest valid 2025 day | 2025-05-20, 54.64 mm | Used only to select an IMERG cross-check day |
| IMERG precipitation on that UTC day | 58.02 mm estimated from 48 half-hour samples | Different 0.1° grid and method; not a gauge |
| SSURGO intersecting map unit | L107, Webster clay loam, Bemis moraine, 0–2% slopes | A map unit can contain several soil components |
| SSURGO possible components | Webster 90%, Nicollet 5%, Okoboji 3%, Canisteo 2% | Percentages describe mapped components, not exact field sampling |
| SSURGO mapped available water storage, 0–100 cm | 18.15 cm | Mapped estimate; no field pH or nutrients inferred |

## Reproduce

1. Run `npm ci`, `npm run verify`, and `npm start` from the repository root.
2. Open `http://localhost:8000`, enter the point above, select start/end year 2025, and choose **Load available data**.
3. Compare the displayed POWER/IMERG/SSURGO values and source links. Live providers may revise or temporarily fail; record the retrieval date and any difference. The saved seven-day NASA response under `tests/fixtures/` is only a parser fixture, **not** this full-year case-study response.
4. If demonstrating strategies, label crop history and priorities as hypothetical, open each evidence panel, and show that the rules are research-only. Do not claim yield, profit, water savings, or field suitability.

This is not yet a farmer-validated impact study. Agronomist review, an actual farm workflow, and economic feasibility evidence remain pending.
