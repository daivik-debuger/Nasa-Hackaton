# FieldShift — Field workspace design system

## Current visual direction

This supersedes the serif/paper/left-rail design rejected in user feedback. A dark green horizontal navigation bar anchors a bright, wide work surface. Space Grotesk supplies a more distinctive technical sans-serif hierarchy; IBM Plex Mono is reserved for measured values and compact metadata. The scientific engines and coverage boundaries are unchanged by this visual pass.

The Dashboard and four-view shell retain semantic HTML, native controls and `workspace.css`. The global Plan, crop matrix and trial panels are React components in `src/react/global-workspace.jsx`; `src/react/field.css` is built through Tailwind PostCSS. Fonts are local, not requested from a remote service.

## Tokens

| Role | Value |
| --- | --- |
| Ink | #172b24 |
| Secondary text | #3c4e46 |
| Canvas | #f3f6f4 |
| Surface | #f7f8f6 |
| Recessed surface | #e9efeb |
| Accent / focus | #184c38 |
| Navigation | #132d23 |
| Navigation selected / crop artwork ground | #244736 |
| Navigation text | #f5faf6 |
| Divider / control border | #cbd7cf / #6b7e72 |
| Warning text / ground | #683d16 / #f5ebd9 |
| Field-lab dark / light signal | #172c24 / #c5dda0 |
| Critical | #762e24 |

Spacing: 4, 8, 12, 16, 24, 32, 48px. Boundaries: 1px rules, 2px controls and 4px surfaces. No panel shadows or decorative gradients. The circular completeness indicator encodes data, not an invented farm-health score.

## Typography

- Headings: locally served Space Grotesk semibold; 32–78px page titles, 24–34px section headings, tight but legible tracking.
- Body: Space Grotesk regular, 15–16px with 1.55 line height.
- Controls: Space Grotesk semibold, 14–16px.
- Values and provenance: IBM Plex Mono regular, tabular numbers. Metadata is 10–12px; larger values retain their measurement units.
- Font faces declare their actual static weights. Newsreader remains a licensed repository asset but is no longer used by the interface.

## Layout

- All views: full-width sticky navigation; centered workspace with a 1600px maximum and 24–48px desktop gutters.
- Dashboard: asymmetric map / completeness overview, then location controls and POWER history. No crop library on the dashboard.
- Crops: split green introduction with a labeled wheat illustration. Discovery and regional evidence retain separate tabs. Search, scope and sources remain visible. Crop profiles use crisp bordered surfaces.
- Plan: dark field-lab command header, numbered input stages, a live completeness/provenance readout, and a visually distinct result. Global crop inputs never imply suitability. The regional workbench and original Iowa controls remain in separate labeled disclosures.
- Research: scope summary, limitations, white analytical sections with filterable benchmark tables, then source disclosures. Wide tables scroll inside named keyboard-focusable regions.
- Mobile: stacked content below 640px, 16px gutters, two-row navigation. No side drawer or icon-only navigation. Crop artwork compresses to 160px; controls remain labeled.

## Interaction and accessibility

Hover, active, disabled and focus-visible states are defined. Keyboard focus is green on light surfaces and light on dark surfaces. Global-workspace controls are at least 48–56px; older controls are being audited separately. Motion uses 150ms transitions and respects reduced motion. Forced-color mode preserves control boundaries.

Automated tests verify 7:1 authored text-palette contrast on supported light surfaces and both dark navigation grounds, plus 3:1 control/focus contrast. This is not certification of full WCAG AAA conformance. Physical-device, screen-reader and comprehensive external-map accessibility audits remain outstanding.

## Verification — 2026-10-16 refresh

All four views passed overflow checks at 320, 375, 390, 430, 768 and 1366px. Desktop Dashboard, Research and Crops were visually inspected. Map street-view switching, crop mode switching, Oats filtering, regional comparison submission and benchmark filtering were exercised. Browser logs contained only unrelated extension message-port errors.

The full test suite passed 80 tests with zero skipped. This visual refresh did not revalidate live NASA endpoints, physical-device installation or agronomic accuracy. See REGIONAL_ENGINE.md for scientific limitations.
