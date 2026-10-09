# Release and demo gate

Check only after observing the result. A passing local test is not evidence of a deployed or physical-device test.

## Repository and data

- [ ] Work is in a connected Git checkout, reviewed on a feature branch, and merged deliberately.
- [ ] `npm ci` and `npm run verify` pass on the intended commit.
- [ ] GitHub Actions passes on that commit.
- [ ] Data/source IDs validate; crop and rule approval statuses remain accurate.
- [ ] No secrets or private farmer details are committed or included in fixtures.

## Deployed service

- [ ] Node-capable HTTPS host serves the app and both `/api/` routes.
- [ ] Hosting bind address, port, health monitoring, and restart behavior are verified.
- [ ] POWER, IMERG, and SSURGO requests succeed on the deployed host.
- [ ] Invalid coordinates, unavailable sources, timeouts, and missing values are shown honestly.
- [ ] Hosting logs, coordinate exposure, transport security, and third-party requests are reviewed.
- [ ] No production-scoped claims are made from unreviewed research rules.

## User journey

- [ ] Full journey tested at 320, 375, 390, 430, and desktop widths.
- [ ] Keyboard focus, labels, readable charts, contrast, and console checked.
- [ ] Real iOS and Android installation/offline reopening tested, or marked unverified.
- [ ] A reproducible pilot example and a failure-mode demo are prepared.
- [ ] Agronomist and farmer-review limitations are stated in the pitch and app.

## Competition package

- [ ] Public repository, HTTPS demo link, source attribution, and architecture figure are available.
- [ ] Three-minute presentation and backup video are ready.
- [ ] `docs/STATUS.md` and `docs/COMPETITION_SCORECARD.md` reflect observed evidence.
