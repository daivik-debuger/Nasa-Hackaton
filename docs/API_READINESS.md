# API integration readiness

Audited 2026-10-03 against the public demonstration point `42.035, -93.55`. This is a bounded integration checklist, not a claim that external services will stay available. No API key is configured or used by these tested public endpoints. Do not add a private key to browser code or Git; if a provider later requires one, add a server-side secret and update the privacy/deployment review first.

| Layer | Current request and response contract | Failure and scientific boundary | Current audit result |
| --- | --- | --- | --- |
| [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) | Browser requests `T2M`, `T2M_MAX`, `PRECTOTCORR`, `AG`, JSON, UTC, full calendar years. Input coordinates/years are validated; a 20-second timeout is set. POWER documents UTC versus local-solar time and a 0.5° global grid. | Missing/fill values are excluded, not zeroed. An HTTP, network, timeout, malformed-JSON, or missing-variable response must not yield climate metrics. Browser-to-NASA access still needs HTTPS/CORS testing from Render. | Live 2025 request returned the three expected variables and their units. |
| [USDA NRCS Soil Data Access](https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx) / [SSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo) | Same-origin `GET /api/soil` accepts validated coordinates inside the Central Iowa demo gate. Server sends bounded SQL through a POST to USDA `post.rest` and parses map unit, components, horizons, drainage, flooding, and 0–100 cm available water storage. | No U.S.-wide or global soil claim. Map components are possibilities, not a laboratory result. Timeout, HTTP, malformed JSON, empty map unit, and truncation remain visible. | Live query returned map unit L107 and four possible components. |
| [NASA GPM IMERG image service](https://gis.earthdata.nasa.gov/portal/rest/services/GESDISC/GPM_3IMERGHH/ImageServer?f=pjson) / [NASA rate-unit FAQ](https://gpm.nasa.gov/resources/faq/how-intensity-precipitation-distributed-within-given-data-value-imerg) | Same-origin `GET /api/imerg` validates global coordinates and `YYYYMMDD`. Server requests three eight-hour windows, deduplicates overlapping boundary samples, keeps only the selected UTC day and `precipitation` variable, and converts each mm/hr half-hour rate to mm. A day total requires **all 48** valid slots. | HTTP, timeout, malformed JSON, wrong variable, conflicting duplicate, or incomplete day produces no total. The exact run is not verified; this is not a gauge or forecast. The live service metadata currently advertises data only through 2025-09-30 23:30 UTC, even though the app can request later dates. | **Not ready for a dependable full-day indicator.** The 2025-05-20 Iowa query returned 47 in-day slots; the raw response included a next-day boundary sample. Earlier code mistakenly counted it. Another live attempt timed out. |

## Release checks

1. Run `npm ci` and `npm run verify` without network. Unit tests must pass, including invalid input, failed requests, static-file exposure, missing values, and 47/48 IMERG rejection.
2. Run `npm run api:smoke` with network. It uses only the public demo point, makes one request per provider, and exits nonzero if any fails. External failures are expected to be intermittent; record the date and exact result, never force a green result by fabricating data.
3. On the public Render HTTPS URL, verify `/health`, the PWA/catalog files, NASA POWER browser request, `/api/soil`, and `/api/imerg`. The health route proves the process is up, **not** that upstream APIs are healthy.
4. Before presenting IMERG as a complete daily indicator, verify the service's exact variable, run, units, temporal extent, and 48-slot coverage at several regions/dates. If that cannot be established, leave IMERG missing and choose a more dependable second NASA product; do not silently interpolate a missing half-hour.
5. Recheck provider policies and operational limits before wider public traffic. The demo has no cache/rate-limit strategy for upstream requests and no persistent farmer database.

## Hosting inputs

- Required runtime: Node 22+; `HOST=0.0.0.0` on Render and platform-supplied `PORT`.
- Required outbound network: HTTPS to `power.larc.nasa.gov`, `sdmdataaccess.nrcs.usda.gov`, and `gis.earthdata.nasa.gov`.
- Required secret/API key: none for the currently tested public endpoints. Authentication, quotas, and availability may change; do not assume unrestricted production use.
- Privacy: the browser sends requested coordinates to NASA POWER; the app server forwards them to USDA and NASA IMERG. Host and upstream logs may retain them even though FieldShift does not persist them in its own database.
