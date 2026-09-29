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

The facilitator setup route `/v13-setup.html` generates preview links for demo
only, demo plus understanding questions, or the full instrument. Individual
`questions`, `sus` and `scales` switches support shorter workshop paths; these
links cannot submit responses. The FI route `/v13-fleet.html` uses the full RC1 mobile script and stylesheet
stack, including alignment, an animated charging/V2G cycle, override, recovery
and mobile layout. `/v13.html?variant=fi-fleet` redirects to it. GR keeps its
tariff and renewable-surplus choices. UK now uses one home parking and V2H
journey with an obstacle stop, manual override and an energy ledger. See
`docs/V13_WORKSHOP_VIEWS.md`.

These instruments are **drafts for site and ethics review**. The Finnish
fleet page can show the RC1 Finnish working questions, SUS and trust wording for
cognitive testing; these are not approved V1.3 research fields and cannot be
submitted through this route. Greek research questions and scales remain
unapproved and are shown in English even if `lang=el` is requested. The UK route includes
large text, high contrast, native controls and a browser speech option. Check
it with assistive technology and participants before calling it accessible or
field-ready. Scenario, response wording and the two-item service-confidence
score require research sign-off. T0 items are absent pending a matched protocol.
The English draft now explicitly describes early departure and driver override,
which the comprehension questions ask about; site teams must confirm those
promises match their proposed service before translation or field use.

## Collection and data

`/api/v13/config` reports `research-v1.3`. The Finnish RC1-based workshop
page is a preview-only demonstration and does not construct or submit a V1.3
research payload. The focused UK route is also always a storage-free preview,
including when a collection-enabled config is encountered: its former
scenario/recovery choices are no longer elicited, and its instrument must be
reconciled with the submission contract before research collection. The V1.3
submit endpoint is separately
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

The 28 September Oxfordshire preview now offers a driver-controlled parking
recovery after obstacle review or an illustrated guidance fault. Its overnight
V2H scene starts at 50%, charges to 80%, and lets the participant choose a
65–80% morning minimum before running eight checkpoints. The home energy and
illustrative cost ledger respond to that selection and to stopping export.
Replaying returns to the reserve selector so workshop participants can compare
choices. The UK route remains storage-free pending site and instrument review.
The manual path now mirrors Tampere's highlighted forward/right/back arrow pad
with staged visual movement and wrong-direction feedback. When `questions=1`,
Oxfordshire adds draft task items and UK-specific comprehension after the V2H
scene; the manual-arrow item appears only after use. These responses are not
collected or scored and do not alter the shared submission schema.
The Oxfordshire pad now places Forward above and Back below a central vehicle
marker, with Left and Right on the middle row. The Trikala preview now
implements an illustrative single-stop WPT/charging/V2G journey. It includes
bay alignment, a protected next trip, feasibility-aware charging windows,
explicit price and renewable cues, an optional next-day start-delay recovery, a
five-checkpoint animated charge and a V2G plan accepted or declined before starting.
Five optional Trikala task probes by default, a sixth with the fault exercise,
and four case-specific understanding questions
are draft and unscored. The Greek and UK journeys remain preview-only regardless
of a collection-enabled host, since their workshop tasks are outside the current
research submission contract. All prices, energy and compensation are fictional
workshop assumptions pending partner confirmation. The `/v13.html` footer
shows `V1.3 preview 2026-09-29d` to distinguish the deployed assets from the
older preview Worker. A Git pull alone does not update the Worker; redeploy
`variant-preview/wrangler.jsonc` after these changes land. The V1.2 RC1 Worker
and its QR target are unchanged.

The 29 September Trikala round extends the stop to daily parking, adds a
pedestrian crossing that pauses illustrative guided positioning, and provides
the same vertical arrow fallback after rechecking the path. A proposed 22 kW
AC-side bidirectional WPT class is shown as an unverified ceiling, while the
mock uses 10.5 kW effective charging and 3 kW reverse flow. After the chosen
charging window, the car remains parked for a separate V2G period. Two fictional
contract cards trade gross compensation against the permission arrangement;
Charging only remains available. Card selection is a practice choice and does not
enable sharing without accepting the session limits. `docs/V13_TRIKALA_DCE_ROUND1.md`
maps the highest-priority WTP/WTA hypotheses to a later balanced T1.2 DCE and
states why this one app task cannot estimate monetary thresholds. The exact
T1.2 questionnaire is not in this repository, so attribute levels remain to be
reconciled. No data is collected by the preview.

The export period appears as a sixth checkpoint in the same parked-car
session. The offer and explicit permission are chosen before charging. The
clean baseline runs first: the mock charges the car, shows it
parked and waiting without energy transfer, then enters export if enabled and
feasible. Planned export can be canceled before it begins. Reverse car-to-grid flow stays visible
through four accelerated 15-minute checkpoints. The display updates exported
kWh, gross credit and vehicle charge; participants can pause, resume or stop.
Facilitator checkpoint controls appear only in instrument-review views.
The setup page can add `fault=1` to Trikala links for a separate next-day
start-delay reflection after the baseline. It does not revise the first day's
schedule, cost or export ledger.
Charging-only departure and an 80% reserve explain why no export can
occur. Selecting an offer alone never enables V2G. No standing agreement is
created by the preview.

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
