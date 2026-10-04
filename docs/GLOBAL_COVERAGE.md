# Worldwide scope and coverage contract

## Product requirement

FieldShift's intended audience is farmers worldwide. Central Iowa is only the first implemented and researched demonstration. Geographic reach, available data, and agronomic validity are different things; the interface must never blur them.

## Coverage levels for any selected point

1. **Location accepted:** coordinates can be validated and a region identified. This does not imply any dataset is available.
2. **Observation context available:** a dataset has returned values for that place and period, with units, resolution, source, and limitations. Other layers may still be missing.
3. **Soil context available:** a location-appropriate mapped-soil source is available. Its map units or grid cells are not a field soil test.
4. **Rotation evidence available:** crops and rules have documented applicability to that region and management context. Only then may the app compare locally scoped strategies, still subject to human-review status.

The app must show each layer's status independently: `available`, `missing`, `failed`, or `not-yet-supported`. It must not silently swap in an Iowa crop catalog, a U.S.-only soil source, or a generic crop recommendation for another country.

## Required architecture before worldwide claims

- Move the current hard-coded Iowa region/crop/rule loading behind a region registry and location resolver. A point may match a reviewed catalog, a research-only catalog, or no catalog.
- Keep the global coordinate and observation flow separate from soil-provider and rotation-evidence selection.
- Record every dataset's geographic/temporal coverage, resolution, update cadence, access method, missing-value rules, and license/terms before integration.
- Choose soil providers by geography; show source-specific uncertainty and avoid treating mapped values as lab measurements.
- Store crop, planting-season, irrigation, and rotation evidence as region- and management-scoped records. Review transferability rather than copying one region's rules globally.
- Test contrasting climates, hemispheres, cropping calendars, and low-data locations. Include out-of-coverage, failed-service, and missing-soil cases.
- Translate units, dates, seasons, and language deliberately; worldwide use is not just a map that accepts any coordinate.

## Current implementation boundary

The browser currently loads only `central-iowa.json` and the central-Iowa crop/rule manifest. The server also bounds soil and IMERG requests to that pilot area. The present app therefore **does not yet meet the worldwide requirement**. The next engineering milestone is a global location/coverage flow that can show available observation context without implying globally validated crop strategies. Regional catalogs can then expand one by one through the evidence gate in `SCIENTIFIC_SAFETY.md`.
