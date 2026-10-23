# Development setup

## Local prerequisites

- Node.js 22 or newer (`.nvmrc` pins the recommended major version).
- npm, included with Node. `npm ci` installs the dependencies pinned in `package-lock.json`.
- Internet access for live NASA POWER, NASA GPM IMERG, and USDA SSURGO requests.

From the repository root:

```sh
npm ci
npm run verify
npm start
```

Open <http://localhost:8000>. `npm start` builds the React assets before serving. `file://` and a generic static server cannot run the soil and IMERG endpoints. Use `PORT=8001 npm start` if port 8000 is busy.

The Farmer/Judge workspaces are `/?workspace=farmer#top` and `/?workspace=judge#research`. Local accounts are available only when the server binds to `127.0.0.1`; account data is saved in the Git-ignored `.local-data/farmers.json` file, or a test-only path set with `FARMER_DATA_PATH`. Do not commit or send this file. Public `HOST=0.0.0.0` runs deliberately disable account API routes until a production data/security design is approved. A server restart signs out all local sessions but preserves saved farm records. Do not use real farmer credentials or private commercial field data in this prototype.

If a local page shows a blank map or stays on “Loading the map…”, check that `npm start` is still running and that `/health` returns `{"status":"ok"}`. Localhost previews deliberately bypass the PWA cache: a stopped server should show a connection failure, not a misleading partial app. HTTPS deployments retain the offline app shell.

## Checks

- `npm run check` checks every JavaScript file in `src/`, `scripts/`, and `tests/`, verifies local asset/import paths, validates scientific data links, and checks required project files.
- `npm test` runs deterministic Node tests using saved, labeled fixtures. It does not need the NASA or USDA services.
- `npm run verify` runs both checks and tests. CI uses this exact command on pull requests and pushes to `main`, `develop`, the pilot, and the named team branch patterns.
- `npm run api:smoke:global` is an opt-in live check of NASA POWER at six public example points across continents. It needs internet access, is not part of deterministic CI, and cannot prove availability at every field or future date.

For a UI or server change, also test the full form-to-strategy journey in a browser. Check 320, 375, 390, 430, and desktop widths, keyboard access, loading/failure states, and console output. Record any unverified live-service or physical-device behavior in `docs/STATUS.md`.

## Contributions

Use the branch roles and PR flow in [BRANCHING.md](BRANCHING.md). Keep changes focused. Use `<area>: <specific outcome>` for commit subjects and add a `Devlog:` trailer when users or students can see the change. The pull-request template contains the relevant review checklist. Do not mark a scientific crop or rule approved without the named review required by `docs/SCIENTIFIC_SAFETY.md`.

This project is plain npm/Node, not the pnpm/Convex monorepo described in some generic review instructions. Its local preview runs on port 8000, not 3000; do not claim unrelated monorepo checks were run.

Use `docs/RELEASE_CHECKLIST.md` before publishing a demo. `docs/ARCHITECTURE.md` records code boundaries, `docs/PRIVACY.md` records data movement, and `SECURITY.md` gives vulnerability-reporting guidance.
