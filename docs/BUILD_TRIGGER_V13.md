# v1.3 Cloudflare build trigger

Production-branch trigger committed after Cloudflare production branch was set to `prototype-v1.3-utility-clock`.

Trigger time: 2026-08-14T13:44:00+03:00

Expected deployment checks:
- `/api/health` remains healthy and collection remains disabled
- utility dashboard shows the shared workshop clock and 15-minute demand/RES/price scenario
- a new `ops=1` QR session starts the shared clock at 15:30
- driver and utility views advance together through 15:30, 15:45, 16:00, 16:15, 16:30 and 16:45
- charging commands remain disabled
