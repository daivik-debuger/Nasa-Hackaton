# Security and data handling

FieldShift is a research prototype, not a production farm-management service. Do not enter secrets, account credentials, or private field notes into bug reports or public issues.

If you discover a security weakness, contact the repository owner privately through GitHub before publishing details. Include reproduction steps, affected version/commit, and the potential impact; omit real farmer information. No response-time or disclosure SLA is promised for this prototype.

Before public deployment, review the host's access logs, coordinate retention, transport security, rate limits, upstream request timeouts, dependency changes, and the service worker's cache behavior. See [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).
