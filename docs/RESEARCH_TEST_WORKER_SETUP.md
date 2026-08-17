# PULSE research-test Worker setup

Purpose: create an isolated Worker for synthetic research-pipeline testing without changing the stable `pulse-srf-workshop` Worker or its production branch.

## Resources

- Worker name: `pulse-srf-research-test`
- Git branch: `prototype-v1.4-research-pipeline`
- Wrangler config: `wrangler.research-test.jsonc`
- Entry point: `src/research-test-entry.js`
- D1 binding: `DB`
- D1 database: `pulse-research-test-eu`
- Collection: locked (`COLLECTION_ENABLED=false`)
- Free text: locked (`FREE_TEXT_ENABLED=false`)
- Operational registry: not mounted in this Worker

## Cloudflare Workers Builds

Create a new Worker/application by importing `tomtaml/pulseapp`.

Use these settings:

- Worker/project name: `pulse-srf-research-test`
- Production branch: `prototype-v1.4-research-pipeline`
- Root directory: `/`
- Build command: none
- Deploy command: `npm run deploy:research-test`
- Non-production deploy command (if enabled): `npx wrangler versions upload --config wrangler.research-test.jsonc`

Do not change the production branch or build settings of `pulse-srf-workshop`.

## First health check

After the dedicated Worker is deployed, open:

`https://pulse-srf-research-test.<account-subdomain>.workers.dev/api/health`

Expected safety diagnostics:

```json
{
  "ok": true,
  "collection_enabled": false,
  "research_test_worker": true,
  "research_test_build": "1.4.0-test",
  "research_pipeline_mode": "synthetic-test-locked",
  "research_db_bound": true,
  "research_storage": "D1",
  "research_collection_locked": true,
  "research_free_text_locked": true,
  "operational_registry": "not-mounted"
}
```

Stop if `research_db_bound` is false, or if either collection/free-text lock is false.

## D1 schema test

Only after the health check passes:

```bash
npm run db:list:research-test
npm run db:migrate:research-test
npm run db:synthetic:research-test
```

Then verify synthetic rows with Wrangler/D1 console. The first row must be marked `record_kind='synthetic_test'` and use `workshop_code='TEST_PIPELINE'`.

## Safety boundary

This Worker is intentionally not ready for real participant research collection. Do not set `COLLECTION_ENABLED=true` until the separate production-like research test has all of the following reviewed and configured:

- real Turnstile site and secret bound as a Worker secret;
- expected hostname;
- exact allowed origin;
- dedicated rate-limit binding;
- approved consent/research notice;
- final research schema and retention plan;
- HY data-management/ethics approval for the intended collection;
- synthetic-only end-to-end test completed first.
