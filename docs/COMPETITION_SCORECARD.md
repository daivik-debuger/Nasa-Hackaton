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

## Award-theme evidence, not award claims

These themes follow the award descriptions in the team's supplied screenshots and the [published 2025 Space Apps awards page](https://www.spaceappschallenge.org/2025/awards/). Recheck the official 2026 awards and judging guide before submission. A feature alone does not establish eligibility or make an award likely.

### Best Use of Data

- [x] NASA POWER valid-day coverage, units, period, source and grid limitation are readable in the dashboard (`src/ui/overview-view.js`, `src/ui/climate-view.js`).
- [x] A judge can load public Iowa or Brazil 2025 points and see an observation-derived coverage readout without synthetic measurements (`src/ui/judge-demo.js`, `tests/judge-demo.test.mjs`).
- [ ] Show in one reproducible case how NASA context changes a farmer's *question or option comparison*, not just the visualization.
- [ ] Verify the complete NASA POWER and IMERG path on the published HTTPS host.

### Local Impact

- [x] Iowa remains an explicitly bounded soil and research pilot; Brazil shows a coverage gap rather than borrowed Iowa advice (`src/coverage.js`, `src/ui/judge-demo.js`).
- [ ] Obtain consented local farmer or extension feedback on a real planning workflow; record what changed in the design.
- [ ] Validate an actionable local outcome without inventing yield, profit, water savings or adoption numbers.

### Art & Technology

- [x] A custom field-notebook interface puts the live map, observation coverage, source trail and uncertainty in an editorial layout (`terrasown.css`, `judge-demo.css`).
- [ ] Test direct-sunlight readability, keyboard/screen-reader access, and visual clarity with people outside the team.

### Most Inspirational

- [x] The public-example question panel translates climate records into a possible farmer–adviser conversation (`src/ui/public-conversation.js`).
- [ ] Obtain a real, consented farmer story or directly attributable published case. No interview, emotional response or impact outcome has been verified.

### Global Connection

- [x] Public city-area examples can be encoded in bounded links without private field pins, names, soil values or crop notes (`tests/public-conversation.test.mjs`).
- [ ] Publish on HTTPS and verify a public link opens on another person's device; a localhost link is not global connection.
- [ ] Test the conversation flow with people in at least two regions, with consented feedback and language/accessibility review.

### Advancement path

- [ ] Local or Universal Event judges select the team as a Global Nominee.
- [ ] Global judging selects the project as a Finalist.
- [ ] Executive judging selects a winner. These stages are decisions by judges, not app features. The [2025 award page](https://www.spaceappschallenge.org/2025/awards/) explains that sequence; verify the 2026 process before making submission claims.

## Submission integrity

- [ ] Repository is public and instructions reproduce the demo.
- [ ] Every dataset, library, figure, research source, and external asset is cited.
- [ ] No secrets, private field data, or unlicensed assets are committed.
- [ ] Team contributions are accurate.

## Final gate

The project is not “10/10 ready” while any unchecked item could be demonstrated during judging. If an item cannot be completed, state the limitation rather than pretending it passed.
