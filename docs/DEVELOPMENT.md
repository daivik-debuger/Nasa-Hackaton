# Development setup

## Local prerequisites

- Node.js 22 or newer (`.nvmrc` pins the recommended major version).
- npm, included with Node. There are no third-party runtime or development dependencies.
- Internet access for live NASA POWER, NASA GPM IMERG, and USDA SSURGO requests.

From the repository root:

```sh
npm ci
npm run verify
npm start
```

Open <http://localhost:8000>. `file://` and a generic static server cannot run the soil and IMERG endpoints. Use `PORT=8001 npm start` if port 8000 is busy.

## Checks

- `npm run check` checks every JavaScript file in `src/`, `scripts/`, and `tests/`, verifies local asset/import paths, validates scientific data links, and checks required project files.
- `npm test` runs deterministic Node tests using saved, labeled fixtures. It does not need the NASA or USDA services.
- `npm run verify` runs both checks and tests. CI uses this exact command on pull requests and pushes to `main`, `develop`, the pilot, and the named team branch patterns.

For a UI or server change, also test the full form-to-strategy journey in a browser. Check 320, 375, 390, 430, and desktop widths, keyboard access, loading/failure states, and console output. Record any unverified live-service or physical-device behavior in `docs/STATUS.md`.

## Contributions

Use the branch roles and PR flow in [BRANCHING.md](BRANCHING.md). Keep changes focused. Use `<area>: <specific outcome>` for commit subjects and add a `Devlog:` trailer when users or students can see the change. The pull-request template contains the relevant review checklist. Do not mark a scientific crop or rule approved without the named review required by `docs/SCIENTIFIC_SAFETY.md`.

This project is plain npm/Node, not the pnpm/Convex monorepo described in some generic review instructions. Its local preview runs on port 8000, not 3000; do not claim unrelated monorepo checks were run.

Use `docs/RELEASE_CHECKLIST.md` before publishing a demo. `docs/ARCHITECTURE.md` records code boundaries, `docs/PRIVACY.md` records data movement, and `SECURITY.md` gives vulnerability-reporting guidance.
