# V1.3 study variants — implementation status

Feature branch: `feat/research-v13-variant-registry-2026-09-24`.

## Protected public V1.2 RC1

The partner-facing `pulse-srf-research-test` Worker is **not** a V1.3 target.
Its deployed collection and synthetic gates are locked. Do not deploy
`research-test/wrangler.jsonc` from the feature branch or repoint the existing
partner QR code. `scripts/check_preview_isolation.mjs` verifies that its config
matches the frozen V1.2 blob before any variant preview deployment.

## V1.3 preview surface

The new route is `/v13.html?variant=fi-fleet|gr-prosumer|uk-v2h&workshop=PREVIEW&lang=en`.
`&demo=1` removes the survey modules and makes no submission request.
The normal preview renders four comprehension items, SUS for direct users, and
role-specific outcome items without submitting. The five allowed profiles are
`fleet_driver`, `dispatcher`, `fleet_manager`, `passenger_prosumer`, and
`accessible_driver`. The existing root path remains available for comparison.

This instrument is a **draft for site and ethics review**. Finnish and Greek
instrument wording is not approved or rendered; the review route explicitly
uses English even if `lang=fi` or `lang=el` is requested. The UK route includes
large text, high contrast, native controls and a browser speech option. Check
it with assistive technology and participants before calling it accessible or
field-ready. Scenario, response wording and the two-item service-confidence
score require research sign-off. T0 items are absent pending a matched protocol.
The English draft now explicitly describes early departure and driver override,
which the comprehension questions ask about; site teams must confirm those
promises match their proposed service before translation or field use.

## Collection and data

`/api/v13/config` reports `research-v1.3`. The V1.3 submit endpoint is separately
locked by `V13_COLLECTION_ENABLED=true`, production readiness and
`RESEARCH_INSTRUMENT_MODE=research`. The preview config keeps it false and has no
D1 binding. The synthetic endpoint requires the existing test-only Turnstile,
D1, rate limiter and synthetic gates; it is also locked by default.

The shared contract validates variant/profile pairs, category choices, four
controlled comprehension answers, numeric 1–5 responses, SUS only for profiles
that used the interface directly, and exact payload keys. Scores are calculated
server-side; actor trust, fairness and accessibility remain individual items.
`0003_research_v13.sql` creates a separate table, preserving V1.2 data.
The operator-side exporter selects `--schema-version research-v1.3`; no public
export endpoint is added. Apply the migration to an isolated test D1 and verify
synthetic persistence and export before considering collection readiness.
`npm run test:v13:sqlite` exercises the actual migration, submission handler
and exporter query with five synthetic profiles in an in-memory SQLite database
(Node 22+ and Python 3). It also checks that synthetic and research records
stay separate. This local round trip does not replace an isolated D1 test.

On 25 September 2026, `0003_research_v13.sql` was applied to the separate D1
`pulse-research-v13-isolated-20260925` (ID
`c0ce7bc3-7844-47c3-8d23-fe358c536693`). The direct remote D1 probe passed:
one synthetic row, zero research rows and a verified operator export allow-list.
The dedicated `pulse-srf-v13-isolated-test` Worker was then tested through its
HTTP handler with the official Turnstile test keys and a temporary synthetic
gate. `scripts/verify_v13_worker_http.mjs` confirmed one additional synthetic
submission reached isolated D1, zero research rows, and a locked research
submit route. The gate was deleted afterward; `/api/health` again reported
`synthetic_pipeline_ready=false` and `collection_enabled=false`. These results
verify the synthetic Worker-to-D1 path, not live participant collection.

## Verification and next gates

Run `npm run test:v13`, `npm run test:v13:sqlite`, `npm run test:comprehension`,
`node scripts/check_preview_isolation.mjs`, and
`npx wrangler deploy --dry-run --config variant-preview/wrangler.jsonc`.
The tests cover five profiles, mismatched and hidden fields, scoring, persistence
shape and locked endpoints. The isolated D1 and Worker HTTP round trips are
complete. Remaining gates include a browser walkthrough on all three site
routes, site validation of service promises, Finnish and Greek instrument
review, UK assistive-technology and participant checks, and ethics, retention
and production security approval before any live research rollout. The preview
and isolated test Workers remain separate from the public V1.2 Worker.
