# Pilot architecture

## Data flow

1. The browser loads the PWA shell and version-controlled region, crop, evidence, rule, and source JSON.
2. After the user requests data, the browser calls NASA POWER directly for climate history.
3. The browser calls the same-origin Node server for soil and IMERG context. The server validates pilot coordinates, then queries USDA Soil Data Access and NASA GPM IMERG.
4. Browser modules calculate transparent indicators and three exploratory strategy patterns. The rule records remain `research-only` until human approval.
5. The interface displays source links, missing inputs, confidence limits, and local-review questions. No result is written to a database.

## Boundaries

- `data/` is reviewed content, not a place to infer new crop facts from an API response.
- `src/api/` handles acquisition and parsing; `src/engine/` handles deterministic comparison; `src/ui/` handles display.
- `server.js` exists because browser-only calls to the soil and IMERG services are unreliable. It does not provide accounts, persistent storage, or a production security boundary.
- The service worker caches same-origin public app assets; it does not cache the app's `/api/` responses or cross-origin NASA requests.

See `docs/SCIENTIFIC_SAFETY.md` for the claim gate and `docs/PRIVACY.md` for coordinate handling.
