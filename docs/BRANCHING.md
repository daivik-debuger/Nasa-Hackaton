# Team branches and pull requests

The current working base is the latest verified `central-iowa-pilot` code. `main` is an older release line until the pilot is reviewed and merged. Branch creation does **not** merge or approve the pilot.

| Branch | Purpose | PR target |
| --- | --- | --- |
| `main` | Reviewed release/demo code only | — |
| `develop` | Integration line for the current pilot and team work | `main` after release review |
| `feature/app-integration` | Project lead: API, comparison engine, mobile app integration | `develop` |
| `research/nasa-data` | Researcher 1: NASA dataset and climate-data audit | `develop` |
| `research/rotation-soil` | Researcher 2: crop rotations and soil-health evidence | `develop` |
| `research/farmer-needs` | Researcher 3: region comparison, farmer needs, and competitors | `develop` |

The older `fieldshift-mobile-pwa` and `test-foundation` branches already have their work in `main`; they are historical and should not be reused for new work. `central-iowa-pilot` is the source branch for the new integration base, not a second release branch. Do not delete any branch until its owner confirms it is no longer needed.

## Each person's workflow

1. Start from the assigned branch: `git fetch origin`, then `git switch --track origin/research/nasa-data` (replace with your assigned name). If it already exists locally, use `git switch <branch>`.
2. Make a focused change. Research contributions need source locations, applicability, limitations, and review status; a source link alone is not enough. Never mark a crop/rule human-approved without a named reviewer.
3. Run `npm run verify`. For API changes, also run `npm run api:smoke` and record any live failure; for UI changes, follow the browser/device checks in `docs/DEVELOPMENT.md`.
4. Commit with `<area>: <specific outcome>` and a `Devlog:` trailer for student-visible changes. Push your assigned branch and open a PR **into `develop`**. Use the PR checklist and request a teammate review.
5. The lead resolves conflicts and checks the integrated app on `develop`. Only after a release review should `develop` be proposed for `main`.

To bring newer integration work into a topic branch, fetch and merge `origin/develop` into that branch, then rerun checks. Do not force-push shared branches, directly commit to `main`, or treat a passing CI check as scientific approval. CI runs on pushes to these branches and on pull requests, but GitHub branch-protection rules and required approvals have **not** been configured by this file.
