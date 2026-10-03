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
