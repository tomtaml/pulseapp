# PULSE research-test Worker setup

Purpose: create an isolated Worker for synthetic research-pipeline testing without changing the stable `pulse-srf-workshop` Worker or its production branch.

## Resources

- Worker name: `pulse-srf-research-test`
- Git branch: `prototype-v1.4-research-pipeline`
- Cloudflare build root: `/research-test`
- Wrangler config in that root: `research-test/wrangler.jsonc`
- Entry point: `src/research-test-entry.js`
- D1 binding: `DB`
- D1 database: `pulse-research-test-eu`
- Collection: locked (`COLLECTION_ENABLED=false`)
- Free text: locked (`FREE_TEXT_ENABLED=false`)
- Synthetic endpoint: `/api/research/synthetic-submit`
- Synthetic workshop code: `TEST_PIPELINE`
- Synthetic route gate: `SYNTHETIC_PIPELINE_ENABLED=false` by default
- Synthetic rate limiter: dedicated `SYNTHETIC_RATE_LIMITER`
- Operational registry: not mounted in this Worker

The separate build root is intentional: the repository root still contains the stable workshop Worker's `wrangler.jsonc`, whose Worker name is `pulse-srf-workshop`. Using `/research-test` prevents the two Workers' deployment configurations from colliding.

## Cloudflare Workers Builds

Create a new Worker/application by importing `tomtaml/pulseapp`.

Use these settings:

- Worker/project name: `pulse-srf-research-test`
- Production branch: `prototype-v1.4-research-pipeline`
- Root directory: `/research-test`
- Build command: none
- Deploy command: `npx wrangler deploy`
- Non-production deploy command (if enabled): `npx wrangler versions upload`

Do not change the production branch or build settings of `pulse-srf-workshop`.

## Health check

After the dedicated Worker is deployed, open:

`https://pulse-srf-research-test.<account-subdomain>.workers.dev/api/health`

For build `1.4.2-test`, the initial locked state should include:

```json
{
  "ok": true,
  "collection_enabled": false,
  "research_test_worker": true,
  "research_test_build": "1.4.2-test",
  "research_pipeline_mode": "synthetic-test-locked",
  "research_db_bound": true,
  "research_storage": "D1",
  "research_collection_locked": true,
  "research_free_text_locked": true,
  "research_test_only": true,
  "synthetic_workshop_code": "TEST_PIPELINE",
  "synthetic_pipeline_enabled": false,
  "synthetic_pipeline_ready": false,
  "synthetic_rate_limiter_bound": true,
  "operational_registry": "not-mounted"
}
```

Stop if `research_db_bound` is false, if `synthetic_rate_limiter_bound` is false, or if either collection/free-text lock is false.

## D1 schema test

The test database must contain the version-controlled `submissions` schema and `record_kind` field before testing the endpoint. Synthetic rows must use `record_kind='synthetic_test'` and `workshop_code='TEST_PIPELINE'`.

If the schema was initialized manually in the Cloudflare D1 console, do not later apply the same Wrangler migrations blindly. Reconcile the migration history or recreate the disposable test database first.

## Synthetic end-to-end mode

The synthetic route is separate from the real research route. `/api/research/submit` continues through the normal fail-closed research gate and must remain unavailable while `COLLECTION_ENABLED=false`.

To prepare a temporary synthetic end-to-end test:

1. Add a Worker **Secret** named `TURNSTILE_TEST_SECRET_KEY` directly in Cloudflare. Use Cloudflare's official always-pass Turnstile test secret. Never put the secret in Git, Wrangler `vars`, screenshots, or chat.
2. Verify `/api/health` reports `synthetic_turnstile_configured=true` while `synthetic_pipeline_enabled=false` and `research_collection_locked=true`.
3. Enable `SYNTHETIC_PIPELINE_ENABLED=true` only for the short test window. Keep `COLLECTION_ENABLED=false`, `FREE_TEXT_ENABLED=false`, and `ENVIRONMENT=preview`.
4. Verify `/api/health` reports `synthetic_pipeline_ready=true`, `research_pipeline_mode='synthetic-test-enabled'`, and `research_collection_locked=true`.
5. POST only team-generated synthetic payloads to `/api/research/synthetic-submit`. The request must be same-origin, must contain `synthetic_test=true` and `workshop_code='TEST_PIPELINE'`, must pass the same questionnaire-shape validation, and must include a Turnstile test token that is validated server-side with Siteverify.
6. Verify the resulting D1 row is `record_kind='synthetic_test'` and that no `record_kind='research'` rows exist.
7. Set `SYNTHETIC_PIPELINE_ENABLED=false` again immediately after the test.

The synthetic endpoint additionally refuses to become ready if normal collection is enabled, the Worker is not in `preview`, the test site key is not configured, the D1 binding is missing, the dedicated rate limiter is missing, or the test-only Turnstile secret is missing.

## Safety boundary

This Worker is intentionally not ready for real participant research collection. Do not set `COLLECTION_ENABLED=true` until the separate production-like research test has all of the following reviewed and configured:

- real Turnstile site and secret bound as a Worker secret;
- expected hostname;
- exact allowed origin;
- dedicated production research rate-limit binding;
- approved consent/research notice;
- final research schema and retention plan;
- HY data-management/ethics approval for the intended collection;
- synthetic-only end-to-end test completed first.
