# PULSE SRF Workshop App

Mobile-first QR-openable prototype for the PULSE Societal Readiness Framework workshops.

The app is designed for early workshop testing of wireless charging, V2G/V2H comprehension, usability, trust, control, accessibility and acceptance. It is intentionally a **research prototype**, not a production charging app.

## Variants

| Variant | Purpose | URL parameter |
|---|---|---|
| Finland fleet | Wireless charging + V2G for fleet drivers, dispatchers and fleet managers | `?variant=fi-fleet&workshop=TAMPERE-S4` |
| Finland citizen/accessibility | Same fictional delivery-van prototype, adapted for citizens and vulnerable groups | `?variant=fi-citizen&workshop=TAMPERE-S4` |
| UK V2H alternative | Wireless charging + V2H framing for the British case | `?variant=uk-v2h&workshop=OXFORD-S4` |

## Research logic

The prototype supports the SRF traceability pipeline:

```text
Workshop use → comprehension / SUS / trust / acceptance signals → SRF register → DCE attributes → Behavioural Twin inputs
```

It collects structured, anonymous workshop responses only after explicit consent.

## Privacy-by-design principles

- No names, emails, phone numbers, exact addresses, employer names, vehicle IDs or GPS are requested.
- No IP address is stored by the application code.
- Collection is disabled unless `COLLECTION_ENABLED=true`.
- The API rejects common accidental PII fields.
- Comments are capped and preceded by a no-PII reminder.
- Server-side Turnstile verification is supported.
- D1 database can be created in the EU jurisdiction.

## Quick start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:8787/?variant=fi-fleet&workshop=TAMPERE-S4
http://localhost:8787/?variant=fi-citizen&workshop=TAMPERE-S4
http://localhost:8787/?variant=uk-v2h&workshop=OXFORD-S4
```

## Cloudflare setup

Create an EU D1 database:

```bash
npx wrangler d1 create pulse_srf_workshop --jurisdiction=eu
```

Add the returned database id to `wrangler.jsonc`.

Run migration:

```bash
npx wrangler d1 migrations apply pulse_srf_workshop --remote
```

Set secrets:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Optional public Turnstile site key goes in `public/app.js` or can be injected during deployment.

Deploy:

```bash
npm run deploy
```

## QR generation

After deployment, generate QR codes:

```bash
python scripts/make_qr.py https://your-worker-url.workers.dev
```

This creates QR links for:

- `fi-fleet` Tampere fleet workshop
- `fi-citizen` Tampere citizen/accessibility workshop
- `uk-v2h` Oxfordshire V2H workshop

## Ethics checklist before live use

Before using this in workshops:

1. Insert approved consent wording.
2. Insert approved SUS wording.
3. Confirm whether optional free text is allowed.
4. Confirm retention and deletion period.
5. Confirm D1 jurisdiction and Cloudflare account ownership.
6. Confirm Turnstile configuration.
7. Confirm export process and access control.
8. Test QR links on iOS and Android.

See `docs/ETHICS_DEPLOYMENT_CHECKLIST.md`.

## Data dictionary

See `docs/DATA_DICTIONARY.md`.

## License

MIT for code. Research instruments and final wording should be reviewed under project governance before reuse.
