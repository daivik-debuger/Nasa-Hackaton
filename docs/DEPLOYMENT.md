# Deployment preparation

The app needs a Node-capable host: a static host cannot serve `/api/soil` or `/api/imerg`. Render is the selected demo host, but no public deployment has been verified yet.

## Render handoff

The repository-root `render.yaml` defines a Free Docker web service with `/health` as its health check. It deliberately omits `branch`: when the Blueprint and service use the same repository, Render follows the Blueprint's selected branch. For the current pilot, select `central-iowa-pilot` when connecting the GitHub repository; after review and merge, switch the Blueprint to `main`. Do not accidentally deploy the older default-branch code.

1. In the Render dashboard, create a Blueprint from `daivik-debuger/Nasa-Hackaton`, selecting the branch that contains this configuration.
2. Review the service name and confirm the **Free** plan before approving creation. No database or secret is required for this baseline.
3. Wait for deployment and check the assigned HTTPS `onrender.com` URL, then complete the deployment gate below.
4. Record the actual URL and commit in `STATUS.md`; do not mark deployment complete from a successful build alone.

Render's Free web services can spin down after 15 idle minutes, making the next visit slow, and their filesystem is ephemeral. Monthly usage limits apply; an account with a payment method may be billed for excess bandwidth/build minutes. Review [Render's Blueprint reference](https://render.com/docs/blueprint-spec) and [Free-plan terms](https://render.com/docs/free) before creation. There is no application database in this version, so ephemeral storage does not erase farmer records; browser-local state and service-provider logs are separate privacy considerations.

## Requirements

- Node 22+ or a container host capable of the included `Dockerfile`.
- HTTPS in front of the app so phone installation and service workers work.
- Outbound HTTPS access to NASA POWER, NASA GPM IMERG, and USDA Soil Data Access.
- `HOST=0.0.0.0` behind the hosting platform; `PORT` must match its assigned port. Local development defaults to loopback port 8000.
- Health check at `GET /health` (200 with `{ "status": "ok" }`).
- Log/retention review before accepting real farmer coordinates. The app does not intentionally store them, but the host and upstream services may log requests.

## Deployment gate

1. Run `npm ci` and `npm run verify` at the exact commit to deploy.
2. Create the Render Blueprint and verify its HTTPS URL. Do not publish an HTTP-only demo as installable.
3. Verify `/health`, app shell, catalog JSON, `/api/soil`, and `/api/imerg` from the public URL.
4. Test a global point outside Iowa: POWER context may load, while mapped soil and rotation comparisons must say unsupported rather than using Iowa evidence.
5. Test network failure, retry, mobile install, offline shell, and a clean browser profile.
6. Record the URL, deployed commit, test date, and failures in `STATUS.md` and `RELEASE_CHECKLIST.md`.

The `Dockerfile` and `render.yaml` are deployment preparation, not proof that an image has been built or a public service has been tested.
