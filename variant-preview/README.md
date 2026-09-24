# Target-group variant preview Worker

This Worker is isolated from the existing shared Tampere research-test Worker.

It is deliberately storage-free:

- no D1 database binding;
- no research rate-limiter binding;
- no Turnstile secret;
- `COLLECTION_ENABLED=false`;
- `RESEARCH_INSTRUMENT_MODE=instrument-preview`;
- free text and real charging commands disabled.

The default URL shows the complete instrument for WP1, site and ethics review.
Adding `demo=1` downgrades the same build to the shorter participant demonstration.

## Deploy

From the repository root on the feature branch:

```bash
npx wrangler deploy --config variant-preview/wrangler.jsonc
```

This creates or updates only `pulse-srf-variant-preview`. It does not deploy
`pulse-srf-research-test`.

## Verify before sharing

```bash
PREVIEW_WORKER="https://pulse-srf-variant-preview.tom-tamlander.workers.dev"

curl -s "$PREVIEW_WORKER/api/health" | jq .
curl -s "$PREVIEW_WORKER/api/config" | jq .
```

Expected configuration:

```text
collection_enabled: false
instrument_mode: instrument-preview
free_text_enabled: false
charging_backend_mode: mock
charging_commands_enabled: false
```

## Review and demonstration URLs

Full instrument preview:

```text
https://pulse-srf-variant-preview.tom-tamlander.workers.dev/?variant=fi-fleet&workshop=WP1-PREVIEW&lang=en
```

Reduced no-survey demonstration:

```text
https://pulse-srf-variant-preview.tom-tamlander.workers.dev/?variant=fi-fleet&workshop=WP1-DEMO&lang=en&demo=1
```

Neither URL can store or submit participant research data under this configuration.
