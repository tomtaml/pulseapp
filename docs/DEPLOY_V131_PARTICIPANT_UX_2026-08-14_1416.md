# v1.3.1 participant UX deployment marker

Purpose: force a fresh Cloudflare production build after the participant simplification and shared-run lifecycle fixes.

Expected participant behavior with `variant=fi-fleet&ops=1`:
- 3/6 shows compact shared-clock decision context only: time, grid intent, battery SoC, protected reserve, buffer, and one vehicle-specific recommendation.
- 4/6 hides the detailed 15-minute demand/RES/price strip from the participant view and keeps only a compact shared-clock status alongside the charging state, SoC, direction and reserve.
- Detailed demand/RES/price visualization remains in `/utility.html`.

Expected run lifecycle:
- the final 16:45 interval completes;
- dashboard reports run complete;
- the next new QR operational registration clears the previous mock sessions/event log and starts a fresh run at 15:30.
