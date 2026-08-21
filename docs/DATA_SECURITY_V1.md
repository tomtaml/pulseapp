# PULSE Pilot App v1.0 — research data security

## Current deployment posture

The project has two deliberately separate deployment profiles.

### Stable workshop profile

The stable workshop Worker remains separate from the research-test Worker. Research-pipeline validation work must not be used as a reason to alter the stable workshop deployment.

### Dedicated research-test profile

The research-test deployment is deliberately non-collecting for real participant data:

- Worker: `pulse-srf-research-test`
- `COLLECTION_ENABLED=false`
- `FREE_TEXT_ENABLED=false`
- `SYNTHETIC_PIPELINE_ENABLED=false` in repository configuration
- `ENVIRONMENT=preview`
- D1 binding: `pulse-research-test-eu-v2`
- charging backend mode is `mock`
- charging commands are disabled
- operational Durable Object registry is not mounted
- a dedicated synthetic-submit rate-limit binding is configured

The dedicated D1 binding is present so the guarded synthetic pipeline can be validated. The presence of the D1 binding does not enable real research collection.

A single accidental flag change must not enable real collection. The production research Worker therefore uses a fail-closed readiness gate.

## Conditions required before `/api/research/submit` or legacy `/api/submit` can store real research data

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

If any requirement is missing, real research collection remains locked.

## Synthetic validation path

The research-test Worker has a separate synthetic endpoint used only for controlled validation. It requires the exact `TEST_PIPELINE` marker, the test-only environment, the dedicated Turnstile test secret, a D1 binding and the synthetic rate limiter. Synthetic rows are stored with `record_kind='synthetic_test'`.

The synthetic pipeline must be returned to `SYNTHETIC_PIPELINE_ENABLED=false` after each controlled validation exercise. Passing synthetic gates is not approval for real participant collection.

## Data minimisation

The application database does not intentionally store IP address, browser user-agent, precise GPS/location, name, email, phone, employer, VIN, registration plate, raw charger/EVSE ID or raw operational session ID.

The database payload is assembled from an explicit research-field allow-list. It is not a dump of browser state or backend telemetry.

Free text is disabled. Server-side free text additionally requires both `FREE_TEXT_ENABLED=true` and `RESEARCH_FREE_TEXT_APPROVED=true`. Do not enable it without an approved PII-handling and qualitative-data process.

## Separation from operational charging data

Do not store raw partner/backend payloads in the research D1 database.

If later analysis needs to join technical and SSH evidence, create a pseudonymous linkage reference server-side. Raw technical session identifiers remain in the operational system; the research dataset receives only the approved pseudonymous reference and derived variables needed for the research question.

## Analysis export

Analysis export is operator-side only. `scripts/export_analysis.py` queries D1 through Wrangler using an explicit analysis allow-list and writes local CSV plus metadata files under the gitignored `exports/` directory.

The export deliberately excludes raw `payload_json`, submission UUIDs, exact submission timestamps, free text and known PII/operational identifier fields. The default export includes only `record_kind='research'`; synthetic rows require an explicit `--record-kind synthetic_test` option. No public HTTP export endpoint is provided.

See `docs/ANALYSIS_EXPORT_V1.md` for the export specification and validation criteria.

## Turnstile

Use a production Turnstile widget separate from test/staging. Keep the production secret only in Cloudflare Worker secrets. Restrict the widget hostnames and validate Siteverify `hostname` and `action` on every real submission.

The test site key is acceptable only for the guarded synthetic validation path while real collection remains locked. v1.0 explicitly prevents that test site key from satisfying the production collection gate.

## D1 before live collection

The validated research-test database `pulse-research-test-eu-v2` was created with EU jurisdiction and its schema was established through reviewed migrations. This validation database does not by itself constitute approval for live collection.

Before enabling live collection:

- verify the intended live D1 database reports jurisdiction `eu`;
- apply reviewed migrations and verify migration history;
- document retention/deletion periods and authorised access;
- verify Cloudflare account access follows least privilege;
- back up/export only under the approved HY project data-management process;
- review whether platform/observability logs need additional minimisation or retention settings.

## Abuse and availability protection

The production research-submit design includes a `RESEARCH_RATE_LIMITER` binding. The dedicated synthetic path uses a separate `SYNTHETIC_RATE_LIMITER`. This avoids persisting or using IP addresses as research identifiers while providing a first layer against endpoint flooding. Turnstile validation remains a separate control.

Before live collection, review the production limit against the expected workshop concurrency and monitor failed Turnstile validation. Do not use application research rows as an abuse log.

## Future charging backend connector

The browser must call only same-origin `/api/charging/*` endpoints. Upstream API credentials must remain server-side in Worker secrets.

Start field integration read-only. Live control commands require a separate security review and pilot authentication layer; a public anonymous QR session must never have command authority.

## Pre-live security test

Verify all of the following before changing `COLLECTION_ENABLED`:

- collection remains false with any one production prerequisite removed;
- test Turnstile keys cannot be used in the production collecting deployment;
- cross-origin POST is rejected;
- oversized and malformed requests are rejected;
- invalid role/variant/range values are rejected;
- no PII/operational identifiers appear in D1 rows;
- repeated/expired production Turnstile tokens fail;
- rate limit returns 429 under controlled load testing;
- CSP and security headers remain present;
- `/api/health` reports the correct app version and collection status;
- charging command endpoint remains disabled;
- analysis export excludes raw payloads, exact timestamps, UUIDs, free text and synthetic rows by default.
