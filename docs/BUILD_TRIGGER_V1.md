# v1.0 Cloudflare build trigger

Production-branch trigger committed after Cloudflare production branch was set to `prototype-v1.0`.

Trigger time: 2026-08-14T12:24:00+03:00

Expected deployment checks:
- `/api/health` reports app version `1.0.0`
- collection is `false`
- charging backend mode is `mock`
- charging commands remain disabled
