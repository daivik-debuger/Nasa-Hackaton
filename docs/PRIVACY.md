# Pilot privacy and data-flow inventory

## Current behavior

| Data | Where it goes | Intended storage |
|---|---|---|
| Map viewport, browser network metadata, and site origin | The satellite view requests visible-area tiles from Esri World Imagery; the street view requests tiles from OpenStreetMap. Requests occur when the map opens or moves, even before **Load available data**. Either provider can see the approximate viewed area and an origin-only referrer | The app does not intentionally save tile requests or cache tiles in its service worker. Browser HTTP caches and provider logs are outside our control |
| Field coordinates and selected period | Browser request to NASA POWER; browser request to this app's `/api/imerg` when a reference day is available; `/api/soil` only for the Central Iowa demo. The server forwards requested coordinates to NASA GPM IMERG or USDA Soil Data Access as applicable | The app does not intentionally save these requests |
| Crop history, farmer priorities, optional soil notes | Used in the current browser page to compare strategies | No account, database, or intentional persistent storage |
| Public app files, source/crop/evidence JSON | Browser and service-worker app-shell cache | May remain on the device until cache removal |
| Interface fonts | Uses the device's built-in system font stack | No third-party font request |

The app does not currently have authentication, analytics, or a farmer database. API query strings can appear in browser history, reverse-proxy logs, hosting logs, or upstream-service logs; the absence of an app database does **not** guarantee that no service retains coordinates. We have not audited a production host or third-party retention policies.

The map is optional for precise location entry: **Exact coordinates** remains available if the map library or tiles fail. The default satellite view uses [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9), and the street view uses OpenStreetMap, with visible attribution and ordinary browser caching. The app does not export tiles or prefetch them for offline use. The [Esri imagery item](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) says the layer is not intended for offline tile export; [OpenStreetMap's tile-use policy](https://operations.osmfoundation.org/policies/tiles/) requires a valid browser referrer and offers no service-level guarantee. The server uses `Referrer-Policy: strict-origin-when-cross-origin`. A production deployment should review both providers' terms, attribution, and capacity. The imagery basemap is visual context, not a measured crop-health or soil indicator.

## Before collecting or saving farmer data

- Decide whether precise coordinates are necessary, and offer a clear explanation before transmission.
- Choose a retention period, deletion process, and access policy for any saved field data.
- Review provider terms, third-party telemetry, logs, and backup retention.
- Add a privacy notice appropriate to the actual deployment and jurisdiction.
- Do not add accounts, analytics, or a database without updating this inventory and reviewing security.
