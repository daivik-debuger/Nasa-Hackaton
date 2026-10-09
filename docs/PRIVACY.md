# Pilot privacy and data-flow inventory

## Current behavior

| Data | Where it goes | Intended storage |
|---|---|---|
| Map viewport, browser network metadata, and site origin | Browser requests visible-area map tiles from OpenStreetMap when the map opens or moves, even before **Load available data**. This can reveal the approximate area being viewed; the browser sends an origin-only referrer on cross-origin requests | The app does not intentionally save tile requests or cache tiles in its service worker. Browser HTTP caches and provider logs are outside our control |
| Field coordinates and selected period | Browser request to NASA POWER; browser request to this app's `/api/imerg` when a reference day is available; `/api/soil` only for the Central Iowa demo. The server forwards requested coordinates to NASA GPM IMERG or USDA Soil Data Access as applicable | The app does not intentionally save these requests |
| Crop history, farmer priorities, optional soil notes | Used in the current browser page to compare strategies | No account, database, or intentional persistent storage |
| Public app files, source/crop/evidence JSON | Browser and service-worker app-shell cache | May remain on the device until cache removal |
| Fonts | Browser requests to Google Fonts | Third-party behavior is outside this prototype's control |

The app does not currently have authentication, analytics, or a farmer database. API query strings can appear in browser history, reverse-proxy logs, hosting logs, or upstream-service logs; the absence of an app database does **not** guarantee that no service retains coordinates. We have not audited a production host or third-party retention policies.

The map is optional for precise location entry: **Exact coordinates** remains available if the map library or tiles fail. The app uses the standard OpenStreetMap raster tile service with attribution and ordinary browser caching, not offline tile prefetching. Its [tile-use policy](https://operations.osmfoundation.org/policies/tiles/) requires a valid referrer for browser use and offers no service-level guarantee. The server therefore uses `Referrer-Policy: strict-origin-when-cross-origin` rather than suppressing the referrer entirely. A production-scale deployment should review tile-provider terms and capacity before relying on this public service.

## Before collecting or saving farmer data

- Decide whether precise coordinates are necessary, and offer a clear explanation before transmission.
- Choose a retention period, deletion process, and access policy for any saved field data.
- Review provider terms, third-party telemetry, logs, and backup retention.
- Add a privacy notice appropriate to the actual deployment and jurisdiction.
- Do not add accounts, analytics, or a database without updating this inventory and reviewing security.
