# Pilot privacy and data-flow inventory

## Current behavior

| Data | Where it goes | Intended storage |
|---|---|---|
| Field coordinates and selected period | Browser request to NASA POWER; browser request to this app's `/api/soil` and `/api/imerg`; the app server forwards coordinates to USDA Soil Data Access and NASA GPM IMERG | The app does not intentionally save these requests |
| Crop history, farmer priorities, optional soil notes | Used in the current browser page to compare strategies | No account, database, or intentional persistent storage |
| Public app files, source/crop/evidence JSON | Browser and service-worker app-shell cache | May remain on the device until cache removal |
| Fonts | Browser requests to Google Fonts | Third-party behavior is outside this prototype's control |

The app does not currently have authentication, analytics, or a farmer database. API query strings can appear in browser history, reverse-proxy logs, hosting logs, or upstream-service logs; the absence of an app database does **not** guarantee that no service retains coordinates. We have not audited a production host or third-party retention policies.

## Before collecting or saving farmer data

- Decide whether precise coordinates are necessary, and offer a clear explanation before transmission.
- Choose a retention period, deletion process, and access policy for any saved field data.
- Review provider terms, third-party telemetry, logs, and backup retention.
- Add a privacy notice appropriate to the actual deployment and jurisdiction.
- Do not add accounts, analytics, or a database without updating this inventory and reviewing security.
