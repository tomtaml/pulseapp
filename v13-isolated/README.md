# V1.3 isolated HTTP pipeline check

This creates a separate Worker, `pulse-srf-v13-isolated-test`, connected only
to the throwaway V1.3 D1 database. Its generated Wrangler config is ignored by
Git. Do not deploy the partner `research-test/wrangler.jsonc` or the public
`variant-preview/wrangler.jsonc` for this check.

The isolated database should already contain `0003_research_v13.sql`. The
earlier direct D1 probe may have left one `synthetic_test` row; the HTTP test
adds one more. It checks the response ID in D1 and requires zero research rows.

## Prepare and deploy locked

From the repository root on a machine authenticated with Wrangler:

```sh
node scripts/configure_v13_isolated_worker.mjs pulse-research-v13-isolated-20260925 c0ce7bc3-7844-47c3-8d23-fe358c536693
npx wrangler deploy --dry-run --config v13-isolated/wrangler.local.jsonc
npx wrangler deploy --config v13-isolated/wrangler.local.jsonc
```

The deploy must name `pulse-srf-v13-isolated-test`, not an existing Worker.
The generated config has `COLLECTION_ENABLED=false`,
`V13_COLLECTION_ENABLED=false`, and no `SYNTHETIC_PIPELINE_ENABLED` binding.
Check `https://pulse-srf-v13-isolated-test.<account-subdomain>.workers.dev/api/health`:
`collection_enabled=false` and `synthetic_pipeline_ready=false`.

## One synthetic HTTP submission

Add the official **always-pass test secret** to this Worker only. Copy its value
from [Cloudflare's Turnstile test-key documentation](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
at the prompt; do not commit it or share it in logs.

```sh
npx wrangler secret put TURNSTILE_TEST_SECRET_KEY --config v13-isolated/wrangler.local.jsonc
npx wrangler secret put SYNTHETIC_PIPELINE_ENABLED --config v13-isolated/wrangler.local.jsonc
```

At the second prompt enter `true`. These commands target the dedicated Worker;
the second temporarily enables only its synthetic endpoint. Confirm its
`/api/health` reports `synthetic_pipeline_ready=true`, while
`collection_enabled=false` and `research_collection_locked=true`.

```sh
node scripts/verify_v13_worker_http.mjs https://pulse-srf-v13-isolated-test.tom-tamlander.workers.dev pulse-research-v13-isolated-20260925 c0ce7bc3-7844-47c3-8d23-fe358c536693
```

The script uses Cloudflare's dummy Turnstile token, verifies the locked
research route, posts one controlled synthetic payload and checks the returned
ID in the isolated D1. It never sends participant data.

**Whether the test passes or fails**, immediately remove the temporary gate:

```sh
npx wrangler secret delete SYNTHETIC_PIPELINE_ENABLED --config v13-isolated/wrangler.local.jsonc
```

Confirm `/api/health` again reports `synthetic_pipeline_ready=false` and
`collection_enabled=false`. The test secret may remain configured while the
synthetic gate is absent. No change is needed on the preview or V1.2 Workers.
