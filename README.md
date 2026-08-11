# PULSE SRF Workshop App

Mobile-first, QR-openable research prototype for PULSE Societal Readiness Framework workshops.

Version **0.2** separates the operational fleet case from citizen/accessibility review while keeping the interface comparable enough to test whether the same PULSE Pilot App concepts are understandable across groups.

## Study variants

| Variant | Purpose | Example route |
|---|---|---|
| Finland fleet | Wireless charging + V2G for fleet drivers, dispatchers and fleet managers | `?variant=fi-fleet&workshop=TAMPERE-S4` |
| Finland citizen/accessibility | Same fictional delivery-van interface reviewed by citizens, road users and accessibility/vulnerable-group participants | `?variant=fi-citizen&workshop=TAMPERE-S4` |
| UK V2H alternative | Wireless charging + V2H for the Oxfordshire-oriented case | `?variant=uk-v2h&workshop=OXFORD-S4` |

Add `&demo=1` for a walkthrough that **never submits research data**, even if collection is enabled on the deployment.

## v0.2 workshop flow

1. Research-prototype notice and acknowledgement
2. Broad participant perspective
3. Wireless-charging alignment task, including snow/ice in Finland
4. Battery need, minimum departure reserve and departure time
5. Plan/reliability/renewable-signal comprehension
6. V2G or V2H offer with mobility protection and explicit confirmation
7. Charging-failure / emergency-departure scenario
8. Comprehension check
9. Full 10-item SUS after hands-on use
10. Trust, accessibility/independent understanding, wireless acceptance and V2G/V2H participation

The citizen/accessibility variant uses **fictional fleet values** so citizens and vulnerable-group participants can evaluate comprehension and usability without being treated as fleet operational decision-makers.

## SRF traceability

The intended evidence chain is:

```text
Workshop activity
  → structured app signal
  → SRF Activity Map
  → Issue Response Log
  → Transparency Log / design response
  → DCE attribute or SRF indicator
  → Behavioural Twin input
```

Wireless-charging acceptance and V2G/V2H participation are measured separately. SUS is also kept separate from trust and comprehension.

## Privacy-by-design defaults

- Research collection is **off by default** (`COLLECTION_ENABLED=false`).
- Free text is **off by default** (`FREE_TEXT_ENABLED=false`).
- No name, email, phone, precise address, employer, vehicle ID or GPS is requested.
- The Worker strips common accidental PII field names before persistence.
- Request bodies are capped at 20 KB.
- There is no public data-export endpoint.
- Turnstile can be required and is validated server-side.
- The database can be created using the approved Cloudflare D1 jurisdiction.

See `docs/ETHICS_DEPLOYMENT_CHECKLIST.md` before enabling collection.

## SUS wording

The standard English 10-item SUS wording is included. The Finnish version in v0.2 is explicitly a **working PULSE translation for cognitive testing** and should be reviewed/back-translated and documented before formal cross-language SUS comparisons.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Open for example:

```text
http://localhost:8787/?variant=fi-fleet&workshop=TAMPERE-S4&demo=1
http://localhost:8787/?variant=fi-citizen&workshop=TAMPERE-S4&demo=1
http://localhost:8787/?variant=uk-v2h&workshop=OXFORD-S4&demo=1
```

## Cloudflare deployment outline

Create the D1 database using the jurisdiction approved for the study, then put its database ID into `wrangler.jsonc`.

Example for an EU-jurisdiction database:

```bash
npx wrangler d1 create pulse-srf-workshop --jurisdiction=eu
npx wrangler d1 migrations apply pulse-srf-workshop --remote
```

Set the production Turnstile secret without committing it:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Set the public site key, expected hostname and environment variables in the Worker configuration/deployment settings. Keep `COLLECTION_ENABLED=false` through the dry run and approvals.

Deploy:

```bash
npm run deploy
```

## QR generation

Install the small Python dependency:

```bash
python3 -m pip install -r requirements.txt
```

Then:

```bash
python3 scripts/make_qr.py https://your-final-domain.example TAMPERE-S4
```

QR codes are generated separately for the three study variants.

## Research documentation

- `docs/ETHICS_DEPLOYMENT_CHECKLIST.md` — go/no-go checklist before live collection
- `docs/DATA_DICTIONARY.md` — stored fields, exclusions and SRF traceability

## Current status

`prototype-v0.2` is a development branch. It is suitable for interface review and dry workshop testing with collection disabled. Production data collection should only be enabled after the UH ethics/data-protection and deployment checks are complete.

## License

MIT for code. Research instruments, translations and final study wording remain subject to project governance and research approval.
