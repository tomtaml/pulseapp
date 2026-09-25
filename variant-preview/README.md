# Target-group variant preview Worker

This Worker is isolated from the existing shared Tampere research-test Worker.

It is deliberately storage-free:

- no D1 database binding;
- no research rate-limiter binding;
- no Turnstile secret;
- `COLLECTION_ENABLED=false`;
- `RESEARCH_INSTRUMENT_MODE=instrument-preview`;
- free text and real charging commands disabled.

The `/v13.html` route shows the complete instrument for WP1, site and ethics
review. Adding `demo=1` downgrades it to the shorter participant demonstration.

## Deploy

From the repository root on the feature branch:

```bash
node scripts/check_preview_isolation.mjs && npx wrangler deploy --config variant-preview/wrangler.jsonc
```

The check stops if the preview target, storage bindings or collection lock change,
or if `research-test/wrangler.jsonc` differs from the public v1.2 baseline.
This command creates or updates only `pulse-srf-variant-preview`.

## Keep the public v1.2 demo running

The existing public demo uses `pulse-srf-research-test` at
`https://pulse-srf-research-test.tom-tamlander.workers.dev/`.
Its source remains on `fix/tampere-english-navigation-sus-2026-09-03`
(commit `caa48d919292ede1353178be5b2797ab55dbae7b`).
Do not deploy `research-test/wrangler.jsonc` from this feature branch; that
command would upload this branch's newer assets to the public demo Worker.
Do not repoint its existing QR code to the preview Worker. The QR target must
be checked from the actual QR image or its encoded URL; the QR generator takes
the target URL as an input, so the repository does not prove what was printed.

## Verify before sharing

```bash
PREVIEW_WORKER="https://pulse-srf-variant-preview.tom-tamlander.workers.dev"

curl -s "$PREVIEW_WORKER/api/health" | jq .
curl -s "$PREVIEW_WORKER/api/config" | jq .
curl -s "$PREVIEW_WORKER/api/v13/config" | jq .
```

Expected configuration:

```text
collection_enabled: false
instrument_mode: instrument-preview
free_text_enabled: false
charging_backend_mode: mock
charging_commands_enabled: false
V1.3 collection_enabled: false
V1.3 research_schema_version: research-v1.3
```

## Review and demonstration URLs

For a clickable site and module selector, open
`https://pulse-srf-variant-preview.tom-tamlander.workers.dev/v13-setup.html`.
The generated links include `view=demo`, `view=questions` or `view=full` and
optional `questions=0|1`, `sus=0|1` and `scales=0|1` switches. For the Finnish
fleet demo only, the setup page can use working RC1 scenario wording with
`lang=fi`; question and scale views remain in English. SUS appears only
for a role that used the interface directly; the facilitator can turn it off.
All these links stay in preview mode with no submission. See
`docs/V13_WORKSHOP_VIEWS.md` for the workshop matrix.

Full instrument preview:

```text
https://pulse-srf-variant-preview.tom-tamlander.workers.dev/v13.html?variant=fi-fleet&workshop=WP1-PREVIEW&lang=en
https://pulse-srf-variant-preview.tom-tamlander.workers.dev/v13.html?variant=gr-prosumer&workshop=WP1-PREVIEW&lang=en
https://pulse-srf-variant-preview.tom-tamlander.workers.dev/v13.html?variant=uk-v2h&workshop=WP1-PREVIEW&lang=en
```

Reduced no-survey demonstration:

```text
https://pulse-srf-variant-preview.tom-tamlander.workers.dev/v13.html?variant=fi-fleet&workshop=WP1-DEMO&lang=en&demo=1
```

These URLs cannot store or submit participant research data under this configuration.
