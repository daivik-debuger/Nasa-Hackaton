# Decision log

## 2026-10-03 — Product boundary

**Decision:** FieldShift is an exploration and comparison tool, not an agronomic prescription engine.

**Reason:** The available NASA and mapped-soil data provide regional context and cannot establish exact field outcomes without local evidence and ground truth.

## 2026-10-03 — Delivery format

**Decision:** Use a mobile-first PWA for the MVP.

**Reason:** One codebase can be demonstrated on mobile and desktop and installed from an HTTPS site without app-store review. Native packaging can follow if validated needs require it.

## 2026-10-03 — Pilot region

**Status:** Superseded by the central Iowa pilot decision below. Des Moines coordinates were a demonstration point only.

## 2026-10-03 — Recommendation approach

**Decision:** Prefer transparent, evidence-linked deterministic comparison rules for the MVP. AI may explain verified outputs but cannot invent agronomic facts or secretly determine rankings.

**Reason:** Explainability and scientific validity are central judging risks.

## 2026-10-03 — Central Iowa pilot selected

**Decision:** Limit the first evidence catalog and comparison flow to central Iowa. The app gate covers a practical central-Iowa bounding box and is not a soil-survey or agronomic boundary. The synthetic demo point is near Ames, not a verified field.

**Reason:** USDA NASS documents corn, soybean, alfalfa hay, and oats in Iowa; Iowa State Extension documents the corn–soybean baseline, locally used cover crops, and timing/termination issues; USDA NRCS provides mapped SSURGO soil context. These sources support a credible first test. The team has not completed the earlier proposed three-region comparison, so this is an implementation pilot, not proof it is the objectively best region.

**Human review:** No named agronomist has approved the crop records or rules. They remain research-only and cannot drive a ranked recommendation.

## 2026-10-03 — No persistent farmer database in the pilot

**Decision:** Keep evidence records in version-controlled JSON and farmer inputs in the current browser page. Request remote observations only when the user asks for them. Do not add accounts or persistent field storage for the pilot.

**Reason:** The comparison journey does not require saved fields, while persistence would introduce privacy, security, retention, and deletion obligations. Revisit this decision only when a validated user need and an explicit data policy exist.

## 2026-10-03 — Worldwide product requirement clarified

**Decision:** FieldShift is intended for farmers worldwide. Central Iowa remains the first implemented demonstration and evidence catalog, not a permanent product limit. The current location gate and U.S. soil integration are implementation gaps to remove with location-aware coverage and provider selection.

**Reason:** The challenge and user goal concern farmers around the world. Earlier project language treated a pilot as if it were the final scope. Global access must not be confused with globally valid soil/crop/rotation advice; each layer needs explicit geographic applicability and honest unsupported states.

## 2026-10-03 — Global observation path with regional evidence gates

**Decision:** Accept global coordinates for historical NASA POWER context and attempt IMERG where data are returned. Keep SSURGO and rotation patterns limited to the Iowa demonstration; show unsupported soil/crop coverage elsewhere. Use a whole-calendar-year wettest valid POWER day for the IMERG cross-check instead of assuming every location has an April–September growing season.

**Reason:** This moves toward worldwide use without transferring Iowa agronomy to other regions. The IMERG comparison is historical context only and may fail independently of POWER. [ISRIC's current documentation](https://docs.isric.org/globaldata/soilgrids/index.html) says its beta SoilGrids REST API is paused, so a quick global soil integration would be unreliable.
