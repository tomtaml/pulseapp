# PULSE Pilot App v1.0 — research data security

## Current preview posture

The preview is deliberately non-collecting:

- `COLLECTION_ENABLED=false`
- `FREE_TEXT_ENABLED=false`
- `ENVIRONMENT=preview`
- no D1 binding in `wrangler.jsonc`
- charging backend mode is `mock`
- charging commands are disabled
- research submit route has a Cloudflare Workers rate-limit binding

A single accidental flag change must not enable collection. The Worker therefore uses a fail-closed readiness gate.

## Conditions required before `/api/research/submit` or legacy `/api/submit` can store data

All conditions must be true at the same time:

1. `COLLECTION_ENABLED=true`
2. `ENVIRONMENT=production`
3. D1 is bound as `DB`
4. the research rate-limiter binding exists
5. a non-test production `TURNSTILE_SITE_KEY` is configured
6. production `TURNSTILE_SECRET_KEY` exists as a Worker secret
7. `TURNSTILE_EXPECTED_HOSTNAME` is explicitly configured
8. `RESEARCH_ALLOWED_ORIGIN` is explicitly configured
9. request Origin matches the configured origin
10. Turnstile Siteverify succeeds server-side
11. Turnstile `action` is exactly `pulse-workshop-submit`
12. Siteverify hostname matches the configured hostname
13. payload passes strict variant/role/range validation

If any requirement is missing, collection remains locked.

## Data minimisation

The application database does not intentionally store IP address, browser user-agent, precise GPS/location, name, email, phone, employer, VIN, registration plate, raw charger/EVSE ID or raw operational session ID.

The database payload is assembled from an explicit research-field allow-list. It is not a dump of browser state or backend telemetry.

Free text is disabled. Server-side free text additionally requires both `FREE_TEXT_ENABLED=true` and `RESEARCH_FREE_TEXT_APPROVED=true`. Do not enable it without an approved PII-handling and qualitative-data process.

## Separation from operational charging data

Do not store raw partner/backend payloads in the research D1 database.

If later analysis needs to join technical and SSH evidence, create a pseudonymous linkage reference server-side. Raw technical session identifiers remain in the operational system; the research dataset receives only the approved pseudonymous reference and derived variables needed for the research question.

## Turnstile

Use a production Turnstile widget separate from test/staging. Keep the secret only in Cloudflare Worker secrets. Restrict the widget hostnames and validate Siteverify `hostname` and `action` on every submission.

The test site key currently in `wrangler.jsonc` is acceptable only while collection is locked. v1.0 explicitly prevents that test site key from satisfying the production collection gate.

## D1 before live collection

Create the research D1 database with EU jurisdiction at creation time. Do not bind or migrate a non-EU research database as the live store.

Before enabling collection:

- verify the D1 database reports jurisdiction `eu`;
- apply reviewed migrations;
- document retention/deletion periods and authorised access;
- verify Cloudflare account access follows least privilege;
- back up/export only under the approved HY project data-management process;
- review whether platform/observability logs need additional minimisation or retention settings.

## Abuse and availability protection

The v1.0 Worker has a `RESEARCH_RATE_LIMITER` binding set to 60 submit attempts per minute per Cloudflare location for the shared research-submit key. This avoids persisting or using IP addresses as research identifiers while providing a first layer against endpoint flooding. Turnstile validation remains a separate control.

Before live collection, review the limit against the expected workshop concurrency and monitor failed Turnstile validation. Do not use application research rows as an abuse log.

## Future charging backend connector

The browser must call only same-origin `/api/charging/*` endpoints. Upstream API credentials must remain server-side in Worker secrets.

Start field integration read-only. Live control commands require a separate security review and pilot authentication layer; a public anonymous QR session must never have command authority.

## Pre-live security test

Verify all of the following before changing `COLLECTION_ENABLED`:

- collection remains false with any one prerequisite removed;
- test Turnstile keys cannot be used in the production collecting deployment;
- cross-origin POST is rejected;
- oversized and malformed requests are rejected;
- invalid role/variant/range values are rejected;
- no PII/operational identifiers appear in D1 rows;
- repeated/expired Turnstile tokens fail;
- rate limit returns 429 under controlled load testing;
- CSP and security headers remain present;
- `/api/health` reports the correct app version and collection status;
- charging command endpoint remains disabled.
