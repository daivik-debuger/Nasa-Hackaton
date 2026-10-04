# Physical-device and slow-network QA

No physical-device result has been recorded. A team member must fill this in on actual hardware; desktop responsive emulation does not count.

| Device / OS / browser | Tester and date | HTTPS URL and commit | Install | Offline reopen | Slow network | Accessibility | Result / issue |
|---|---|---|---|---|---|---|---|
| iPhone / iOS / Safari | Pending | Pending | Pending | Pending | Pending | Pending | Not tested |
| Android phone / Chrome | Pending | Pending | Pending | Pending | Pending | Pending | Not tested |

## Test procedure

1. Open the deployed HTTPS URL in a fresh browser profile. Confirm the current commit and that the app is not a stale service-worker cache.
2. Test the default Iowa demo, then a public coordinate outside Iowa. The latter must not show Iowa crop strategies or SSURGO as if globally available.
3. Install from the browser's normal PWA flow. Close the browser, launch from the icon, then switch offline and reopen. Confirm the shell and explicit live-data-unavailable state; do not expect cached NASA data.
4. Throttle to a slow connection or use a weak mobile connection. Observe loading, timeout/failure, and retry. No old location's values may be mistaken for the new location.
5. Use screen reader or built-in accessibility tools. Check labels, button names, checkbox focus, chart description, `Why this?` disclosure, error announcements, and 320 px horizontal overflow.
6. Record screenshots or a short screen capture, exact device/software versions, and issues. Do not check a release-gate box until the evidence exists.
