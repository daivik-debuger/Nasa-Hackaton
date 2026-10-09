# Competition readiness scorecard

Check an item only when a file, test result, screenshot, or source proves it.

## Relevance

- [ ] NASA observations visibly affect the comparison.
- [ ] Soil context visibly affects the comparison or confidence.
- [ ] Crop characteristics and history are used.
- [x] Farmer priorities alter the visible questions and matching research rules (`tests/pilot.test.mjs`, `src/engine/compare-strategies.js`); this is not a validated impact score.
- [ ] Multiple rotation strategies address soil health and adaptation.

## Impact

- [ ] One pilot region is selected with evidence.
- [ ] Published farmer-needs research supports the problem.
- [ ] A reproducible case study demonstrates value.
- [ ] Expansion claims are realistic and conditional.
- [ ] Worldwide product goal is clear, while currently supported data and regional evidence coverage are stated accurately.

## Creativity

- [ ] The product is more than a climate dashboard.
- [ ] The product is more than a generic chatbot.
- [ ] Users can change inputs and see explainable tradeoffs update.

## Validity

- [ ] Every active recommendation rule has an evidence ID.
- [ ] Sources, units, period, scale, confidence, and limitations are visible.
- [ ] Missing data and conflicting evidence are handled honestly.
- [ ] Prohibited claims from `SCIENTIFIC_SAFETY.md` do not appear.
- [ ] At least one qualified reviewer has checked the active rule set.

## Technology and usability

- [ ] Full journey works on real iOS and Android phones.
- [ ] 320, 375, 390, 430, tablet, and desktop widths pass.
- [ ] Loading, failure, retry, empty, and offline-shell states pass.
- [ ] Keyboard, focus, contrast, labels, and chart accessibility pass.
- [ ] Live deployment uses HTTPS and PWA installation works.

## Presentation

- [ ] Three-minute pitch is rehearsed within time.
- [ ] Live demo has a backup recording and screenshots.
- [x] One diagram explains the data-to-strategy flow (`docs/architecture.svg`).
- [ ] Limitations are explained confidently.
- [ ] Likely judge questions have evidence-backed answers.

## Submission integrity

- [ ] Repository is public and instructions reproduce the demo.
- [ ] Every dataset, library, figure, research source, and external asset is cited.
- [ ] No secrets, private field data, or unlicensed assets are committed.
- [ ] Team contributions are accurate.

## Final gate

The project is not “10/10 ready” while any unchecked item could be demonstrated during judging. If an item cannot be completed, state the limitation rather than pretending it passed.
