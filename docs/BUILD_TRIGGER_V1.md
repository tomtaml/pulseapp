# v1.2 Cloudflare build trigger

Production-branch trigger committed after Cloudflare production branch was set to `prototype-v1.2-shared-sessions`.

Trigger time: 2026-08-14T13:17:00+03:00

Expected deployment checks:
- `/api/health` reports app version `1.0.0`
- `operational_registry` reports `shared-mock`
- `operational_registry_version` reports `1.2.0`
- research collection remains `false`
- charging backend mode remains `mock`
- charging commands remain disabled
- `/api/charging/utility-summary?workshop=TAMPERE-S4` reports `registry_connected: true`
