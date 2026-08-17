# Secure research-data pipeline test — EU-jurisdiction D1

## Scope

This plan tests the research submission pipeline without enabling real participant research collection.

Terminology: use **EU-jurisdiction research datastore** rather than “EU-certified dataspace”. Cloudflare D1 supports an `eu` jurisdiction that restricts where the database runs and stores data. Cloudflare documents encryption at rest/in transit and organisation-level compliance certifications separately.

The first test must use only synthetic records created by the research team. Do not invite external participants into the collecting environment until the University of Helsinki ethics/data-protection route and participant information/consent are approved.

## Existing fail-closed controls

The Worker already requires all of the following before the public research submit endpoint can store a row:

- `COLLECTION_ENABLED=true`
- `ENVIRONMENT=production`
- a D1 binding named `DB`
- `RESEARCH_RATE_LIMITER`
- a non-test Turnstile site key
- `TURNSTILE_SECRET_KEY` as a Worker secret
- explicit `TURNSTILE_EXPECTED_HOSTNAME`
- explicit `RESEARCH_ALLOWED_ORIGIN`
- matching request origin
- server-side Turnstile Siteverify success
- expected Turnstile action and hostname
- strict role/variant/range validation

Free text additionally requires both `FREE_TEXT_ENABLED=true` and `RESEARCH_FREE_TEXT_APPROVED=true`. Keep both false in the first pipeline test.

## Phase 1 — create the EU-jurisdiction test database

Create a new database. Do **not** reuse a database whose jurisdiction was not set at creation.

```bash
npx wrangler@latest d1 create pulse-research-test-eu --jurisdiction=eu
```

Save the returned database UUID in the institutional project deployment record. Do not paste Cloudflare API tokens or secrets into GitHub issues, commits or chat.

Verify in the Cloudflare dashboard/API that the database reports jurisdiction `eu` before proceeding.

## Phase 2 — bind only the research-test deployment

Do not immediately add the test DB binding to the stable workshop deployment.

Create a research-test deployment/branch configuration with a binding like:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "pulse-research-test-eu",
    "database_id": "<UUID_FROM_CLOUDFLARE>"
  }
]
```

Keep the ordinary workshop build at `COLLECTION_ENABLED=false`.

For the first database/storage test, the research-test environment can also keep public collection disabled. The DB can be populated directly with clearly marked synthetic records using Wrangler.

## Phase 3 — apply reviewed migrations

From the repository root:

```bash
npx wrangler d1 migrations apply pulse-research-test-eu --remote
```

Apply `0001_init.sql` and the synthetic-record marker migration before inserting any test row.

## Phase 4 — insert a synthetic test row directly

Use the provided `scripts/synthetic_research_insert.sql` file:

```bash
npx wrangler d1 execute pulse-research-test-eu --remote --file=./scripts/synthetic_research_insert.sql
```

This validates:

- EU D1 can be reached;
- migrations are valid;
- the research schema can store the intended structured data;
- the row is unmistakably marked `synthetic_test`.

This phase does **not** test Turnstile or the public submission endpoint.

## Phase 5 — verify the stored row and minimisation

Query only the fields needed for the test:

```bash
npx wrangler d1 execute pulse-research-test-eu --remote --command="SELECT id, submitted_at, record_kind, app_version, variant, workshop_code, participant_group, sus_score FROM submissions ORDER BY submitted_at DESC LIMIT 10;"
```

Verify:

- `record_kind = synthetic_test`;
- no name, email, phone, employer, VIN, registration plate, precise location, IP address, browser user-agent, charger/EVSE ID or raw operational session identifier appears in the row;
- `payload_json` contains only the approved synthetic research fields;
- free text is absent.

Delete the synthetic row after the storage test if it is not needed for audit evidence.

## Phase 6 — application endpoint test with Turnstile

Only after the EU DB test passes, create a separate **research-test hostname/deployment**.

For an end-to-end test of `/api/research/submit`:

1. configure a dedicated Turnstile widget for the test hostname;
2. store its secret with `wrangler secret put TURNSTILE_SECRET_KEY` / Cloudflare dashboard secrets;
3. set `TURNSTILE_EXPECTED_HOSTNAME` to exactly the test hostname;
4. set `RESEARCH_ALLOWED_ORIGIN` to exactly the HTTPS origin;
5. keep `FREE_TEXT_ENABLED=false` and `RESEARCH_FREE_TEXT_APPROVED=false`;
6. use only team-generated synthetic answers;
7. enable collection only for the controlled test window;
8. disable collection immediately after the test.

Do not change the stable workshop deployment to collecting mode for this step.

### Why not bypass Turnstile in production code?

The public submission endpoint should continue to require server-side Siteverify. A test-only bypass would weaken the property we actually need to validate. Cloudflare provides dedicated Turnstile testing keys for non-production testing, but the current production readiness gate intentionally rejects the test site key. If automated endpoint testing is needed later, add an isolated test environment rather than weakening the production gate.

## Phase 7 — negative security tests

Run these against the research-test hostname only:

- collection disabled -> submission returns locked/503;
- DB binding missing -> collection remains locked;
- Turnstile secret missing -> collection remains locked;
- wrong origin -> 403;
- malformed JSON -> 400;
- oversized request -> 413;
- invalid role/variant/range -> 400;
- missing/invalid/expired/replayed Turnstile token -> 403;
- controlled rate-limit test -> 429;
- test/free-text flags remain false;
- charging command endpoint remains disabled.

Do not perform abusive load testing against a public shared environment.

## Phase 8 — controlled app-session test

After all negative tests pass, use 1 then 3 team-operated QR sessions and complete the participant flow with synthetic answers.

Check that:

- each successful submit returns a random submission UUID;
- operational mock-session identifiers are not stored in D1;
- the stored participant group, workshop code and variant match the test run;
- SUS/comprehension/acceptance derived values are correct;
- utility/charging operational data and research-response data remain logically separated;
- no raw charging backend payload is written into `payload_json`.

## Phase 9 — cleanup and evidence

After the test:

- set `COLLECTION_ENABLED=false` again;
- export only the small verification result required for the project audit trail;
- delete synthetic rows or retain them only under an explicitly documented test retention rule;
- record D1 jurisdiction, migration version, Worker commit, hostname and test date;
- do not place DB UUIDs, API tokens, Turnstile secrets or participant data in public documentation.

## Gate before real participant collection

Do not use the collecting environment with external participants until all are confirmed:

- UH ethics/data-protection route documented;
- participant information/consent approved for the actual activity;
- controller/processor and Cloudflare contractual route confirmed;
- EU-jurisdiction D1 verified;
- retention/deletion and authorised access documented;
- production Turnstile hostname/action validation tested;
- research schema frozen and data dictionary reviewed;
- recruitment/contact lists remain separate;
- mobile/accessibility dry run completed;
- secure export/deletion procedure tested;
- responsible researcher gives explicit go decision.
