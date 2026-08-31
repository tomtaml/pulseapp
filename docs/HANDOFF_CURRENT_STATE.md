# PULSE Pilot App — Current Technical Handoff

_Last updated: 2026-08-18_

This document is the starting point for a new engineering chat/session with GitHub access. It records the current repository state, what has already been tested, the Cloudflare resources in use, and the next safe technical steps.

## 1. Repository and branches

Repository: `tomtaml/pulseapp`

Stable workshop branch: `prototype-v1.3-utility-clock`

Stable workshop branch reference used by the current v1.4 PR: `fe8d6e0d9a80eaa48646c61751974e698c22710e`

Research/testing branch: `prototype-v1.4-research-pipeline`

Current v1.4 branch HEAD when this handoff was written:

`de0e81b6b0d1f1e3a00dbaf463f0e4044d633dcf`

Draft PR: `#18` — **v1.4: first-demo readiness and secure research pipeline test**

Base: `prototype-v1.3-utility-clock`

Head: `prototype-v1.4-research-pipeline`

The PR is intentionally still draft/open. Do not merge it into the stable workshop branch merely to continue the research-pipeline test.

## 2. What the stable workshop Worker is for

Stable Worker: `pulse-srf-workshop`

Production URL:

`https://pulse-srf-workshop.tom-tamlander.workers.dev/`

Purpose: workshop-ready technical prototype for the first Finnish fleet/utility rehearsal. It remains mock-backend only and must stay isolated from the research test.

Known stable behaviour:

- QR-launched participant sessions.
- shared mock operational registry / utility view.
- fleet state, protected SOC, charging/V2G logic and utility recommendations.
- operator-started shared utility clock.
- charging commands disabled.
- research collection disabled.
- free text disabled.
- SUS only after use; no pre-selected SUS answers.

Do not use the stable workshop Worker for D1 research-pipeline tests.

## 3. Known workshop traffic behaviour

The utility dashboard polls `/api/charging/utility-summary` every 2 seconds while open. Multiple tabs left open generated tens of thousands of cheap Worker requests. Cloudflare observability showed the request rate collapsing immediately when the utility tabs were closed, so this is understood behaviour rather than a runaway backend process.

Later improvement: in a new workshop version, pause polling when the page is hidden and slow/stop polling while the utility clock is idle. Do not introduce that optimisation into the stable branch during the current research-pipeline test unless separately planned and tested.

## 4. Dedicated research-test Worker

Worker: `pulse-srf-research-test`

URL:

`https://pulse-srf-research-test.tom-tamlander.workers.dev/`

Build root in Cloudflare: `/research-test`

Production branch in Cloudflare: `prototype-v1.4-research-pipeline`

Deploy command: `npx wrangler deploy`

Research-test Worker config: `research-test/wrangler.jsonc`

Entry point: `src/research-test-entry.js`

Current research-test build reported by `/api/health`: `1.4.2-test`

Current expected/observed safety state:

```text
ok                               true
collection_enabled               false
charging_backend_mode            mock
research_test_worker             true
research_test_build              1.4.2-test
research_pipeline_mode           synthetic-test-locked
research_db_bound                true
research_storage                 D1
research_collection_locked       true
research_free_text_locked        true
research_test_only               true
synthetic_workshop_code          TEST_PIPELINE
synthetic_pipeline_enabled       false
synthetic_pipeline_ready         false
synthetic_turnstile_configured   false   <-- current blocker
synthetic_rate_limiter_bound     true
operational_registry             not-mounted
```

The research-test Worker must remain separate from the workshop Worker.

## 5. D1 database

D1 database: `pulse-research-test-eu`

Jurisdiction: EU

Binding name: `DB`

Database UUID currently present in repo config:

`8a0525a7-4781-4992-b794-d8695e79f319`

This UUID is binding metadata, not an authentication secret.

### Schema state

The database schema was initialised manually in the Cloudflare D1 Console using the version-controlled SQL represented by:

- `migrations/0001_init.sql`
- `migrations/0002_record_kind.sql`

The `submissions` table exists and includes:

`record_kind TEXT NOT NULL DEFAULT 'research' CHECK (record_kind IN ('research','synthetic_test'))`

Important: because the SQL was applied manually in the dashboard, Wrangler migration history does not automatically know that `0001` and `0002` were already applied. Do not blindly run the same migrations against this database later. Either reconcile migration history or recreate the disposable test database before adopting Wrangler-managed migrations.

## 6. Synthetic D1 test already passed

A single clearly marked non-PII test fixture was written successfully to D1.

Observed row:

```text
id                synthetic-5524ad4dd5b50db5a03f149c44a575cc
record_kind       synthetic_test
variant           fi-fleet
workshop_code     TEST_PIPELINE
participant_group fleet_driver
sus_score         82.5
```

The verification query showed:

```text
total_rows       1
synthetic_rows   1
research_rows    0
```

So the first storage path is proven:

`EU D1 -> schema -> synthetic_test write -> retrieval`

## 7. Negative endpoint test already passed

The normal research endpoint was tested while `COLLECTION_ENABLED=false`:

`POST /api/research/submit`

Result:

`HTTP 503`

with the fail-closed message that research collection is locked until the approved production configuration is complete.

The D1 row count stayed unchanged (`1 synthetic_test`, `0 research`). This proves that the normal research endpoint remains fail-closed and the rejected request created no row.

## 8. Synthetic-only endpoint added in v1.4.2

Endpoint:

`POST /api/research/synthetic-submit`

The route is intentionally separate from `/api/research/submit`.

It is designed to become ready only when all of these are true:

- `SYNTHETIC_PIPELINE_ENABLED=true`
- `COLLECTION_ENABLED` is NOT true
- `ENVIRONMENT=preview`
- official Cloudflare Turnstile test site key is configured
- `TURNSTILE_TEST_SECRET_KEY` is available at runtime
- D1 `DB` binding exists
- dedicated `SYNTHETIC_RATE_LIMITER` binding exists

It also requires:

- `synthetic_test=true`
- `workshop_code=TEST_PIPELINE`
- same-origin request
- JSON payload size checks
- the same questionnaire-shape validation used for the research model
- server-side Turnstile Siteverify
- PII-key scrubbing
- direct storage as `record_kind='synthetic_test'`

Current dedicated limiter in `research-test/wrangler.jsonc`:

`20 requests / 60 seconds`

Normal research collection remains locked independently.

## 9. Current blocker: Turnstile test secret is not visible to runtime

A Cloudflare secret named `TURNSTILE_TEST_SECRET_KEY` was entered through the dashboard, but `/api/health` still reports:

`synthetic_turnstile_configured=false`

A GitHub/Cloudflare rebuild completed successfully and its deploy log showed D1, rate limiter, assets and normal environment variables, but the running health check still did not see the test secret.

The next safe task is to resolve how this secret is attached/deployed to the actual `pulse-srf-research-test` Worker/version/environment.

Do not enable `SYNTHETIC_PIPELINE_ENABLED` until health reports:

`synthetic_turnstile_configured=true`

### Local CLI status

Attempted:

`npx wrangler@latest secret put TURNSTILE_TEST_SECRET_KEY --name pulse-srf-research-test`

Mac Terminal returned:

`zsh: command not found: npx`

So Node/npm/npx is not currently available on the Mac shell. The user suggested using MacPorts rather than Homebrew. If continuing via CLI, first verify the current MacPorts package names/version for Node/npm rather than assuming an old command.

Never ask the user to paste API tokens, production Turnstile secrets, or deploy-hook secrets into chat.

## 10. Next technical sequence

1. Resolve `TURNSTILE_TEST_SECRET_KEY` deployment to `pulse-srf-research-test`.
2. Recheck `/api/health`; require `synthetic_turnstile_configured=true` while `synthetic_pipeline_enabled=false` and `research_collection_locked=true`.
3. Temporarily set only `SYNTHETIC_PIPELINE_ENABLED=true` on the dedicated test Worker.
4. Recheck health; require `synthetic_pipeline_ready=true` and normal research collection still locked.
5. Send one full team-generated synthetic payload to `/api/research/synthetic-submit` using the official Cloudflare test Turnstile flow.
6. Query D1 and verify the new row is `record_kind='synthetic_test'`, `workshop_code='TEST_PIPELINE'`, and that `research_rows=0`.
7. Run negative tests: wrong workshop code, missing `synthetic_test`, malformed JSON, invalid/missing token, cross-origin request, excessive payload, rate-limit behaviour.
8. Set `SYNTHETIC_PIPELINE_ENABLED=false` again immediately after the E2E test.
9. Only after the synthetic route is proven should the project design a separate production-like research deployment with real Turnstile configuration and governance approval.

## 11. Non-negotiable safety/governance boundary

No real participant collection until University of Helsinki / project governance has documented the required ethics, data-protection and study-readiness approvals.

Keep these locked unless there is an explicitly reviewed change:

```text
COLLECTION_ENABLED=false
FREE_TEXT_ENABLED=false
RESEARCH_FREE_TEXT_APPROVED=false
CHARGING_COMMANDS_ENABLED=false
```

The synthetic path must never become a hidden bypass for the normal research gate.

## 12. Important files in draft PR #18

Current changed files include:

- `docs/FIRST_DEMO_READINESS.md`
- `docs/RESEARCH_PIPELINE_TEST.md`
- `docs/RESEARCH_TEST_WORKER_SETUP.md`
- `migrations/0002_record_kind.sql`
- `scripts/synthetic_research_insert.sql`
- `research-test/package.json`
- `research-test/wrangler.jsonc`
- `src/research-test-entry.js`
- `src/v131-entry.js`
- `wrangler.jsonc`
- `wrangler.research-test.jsonc`

Start a new engineering session by reading this file plus `docs/RESEARCH_TEST_WORKER_SETUP.md`, `research-test/wrangler.jsonc`, and `src/research-test-entry.js` before changing anything.
