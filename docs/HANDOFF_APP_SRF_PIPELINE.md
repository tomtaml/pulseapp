# PULSE Pilot App — Part B / Three-Country / Societal Readiness Pipeline Handoff

_Last updated: 2026-08-18_

This document explains what the PULSE Pilot App is supposed to become over the project, how its maturity should mirror the phases in Part B, how country- and target-group-specific flows should differ, and how app evidence should contribute to the Societal Readiness Framework (SRF), Behavioural Twin (BT), Double Twin and project decisions.

It is intentionally broader than the current code. It separates **Part B commitments** from **working implementation decisions/proposals** so future development does not accidentally turn design hypotheses into contractual claims.

## 1. Core purpose of the app

The app is not simply a questionnaire and not simply a charger control UI.

Its project role is to become a staged **user-facing proxy and evidence instrument** for wireless bidirectional charging:

1. explain what the system is doing in terms users can understand;
2. let users make or understand relevant choices (charging, V2G/V2H, reserve, tariff/RES, consent, override where appropriate);
3. expose the social and operational trade-offs of the service;
4. capture usability, comprehension, trust, control, accessibility and acceptance evidence;
5. link user-facing evidence with technical session events as the project moves from simulation to real demonstrations;
6. feed validated behavioural evidence into requirements, SRF Gate Cards, the Behavioural Twin and ultimately the Double Twin.

Part B explicitly describes a sandbox Dummy CPO / PULSE Pilot App, QR-launched and without live payments, used for guided docking, consent/session authorisation, tariff/RES variation, SUS/micro-surveys and telemetry. In later demonstrations its app events are joined with OCPP/ISO 15118 session logs for socio-technical KPI computation.

## 2. Source basis from Part B

Use the current Part B PDF in the project files as the contractual source of truth. Particularly relevant sections are:

- Part B pp. 12–16: project phases and the three demonstrations.
- Part B p. 13: Phase 3 — real-world demonstration across Trikala, Espoo/Tampere and Oxfordshire.
- Part B pp. 14–16: Finland, Greece and UK demonstration designs and app roles.
- Part B pp. 31–32: WP1 T1.1 co-design, T1.2 co-development and T1.3 co-assessment.
- Part B p. 21: expected societal impact and underserved-group framing.

The WP1 literature review in the conversation/project files is a supporting methodological source for operationalising the SRF. It recommends treating SR as continuous, separating socio-technical indicators from engineering KPIs, and treating HMI, contracts, dashboards, transparency and risk communication as readiness infrastructure.

## 3. Mirror the four Part B phases

### Phase 1 — Inclusive co-creation and societal framing (WP1)

Part B intent:

- establish SRF v1;
- use COM-B and TAM to structure behavioural evidence;
- hold local/co-design workshops;
- use a sandbox app with no payments/personal data for simulated wireless charging experience;
- gather SUS plus short trust/comprehension checks;
- create baseline Inclusivity & Accessibility and User Trust & Safety evidence;
- conduct a three-country survey and two DCEs;
- produce synthetic archetypes and a BT seed package.

App role in this phase:

**Concept demonstrator + structured measurement instrument.**

The app should make the service understandable before it is technically complete. It should test language, concepts, task sequence, role boundaries and perceived control. It should not pretend to be a live CPO, payment or charging command product.

Current PULSE prototype work belongs mainly here: a technically credible sandbox with mock backend, shared utility state, guided charging/V2G flow and post-use SUS/trust measures.

### Phase 2 — Technology co-design and controlled validation (WP2 + WP3)

Part B intent:

- integrate and validate wireless charging hardware, positioning/FLOD, HMI and grid/market services in controlled environments;
- establish the Energy System Twin (EST) and technical interfaces;
- mature the system before public deployment.

App role in this phase:

**Technical prototype using the same user/session model that can later connect to real services.**

The app should progressively replace mock signals with validated interfaces while preserving the user-facing concepts already tested in Phase 1. Examples:

- mock alignment -> real positioning/alignment status;
- mock power/SOC -> real charger/vehicle/session telemetry;
- mock tariff/RES signal -> controlled grid/market signal;
- mock V2G permission -> backend-recognised authorisation state;
- mock utility view -> real/controlled aggregation telemetry.

The user-facing app should not be rewritten around vendor-specific backends; adapters should map backend data into a stable PULSE session/event schema.

### Phase 3 — Real-world demonstrations (WP4)

Part B intent:

- real operational trials in hot Greece, cold Finland and wet UK;
- sandbox Pilot App remains user-facing, still with no live payments;
- joined app + OCPP/ISO 15118 evidence supports technical and societal KPIs;
- at least 80 charging sessions per site are planned in WP4;
- evidence on trust/accessibility/adoption feeds back to WP1 and BT calibration.

App role in this phase:

**Field evidence instrument + operational companion.**

The app must be site-aware and role-aware. It should record enough event information to explain why a session succeeded, failed, was overridden or abandoned, without collecting unnecessary personal data.

### Phase 4 — Impact, replication and policy integration (WP5 + WP6)

Part B intent:

- couple Behavioural Twin and Energy System Twin in the Double Twin;
- evaluate adoption, grid impact, equity, LCA/SCBA, replication and policy pathways;
- translate lessons into roadmaps, policy, standards and the SRF Playbook.

App role in this phase:

**Evidence source and reusable reference architecture.**

The app itself is not the Double Twin. Its value is the harmonised behavioural/event data model, validated instruments, role-specific requirements and cross-country evidence that can populate BT/DT scenarios and replication guidance.

## 4. Current prototype maturity vs target maturity

### Current stable workshop prototype (v1.3)

Appropriate label: **workshop-ready technical prototype / pre-field-pilot architecture**.

It currently demonstrates:

- QR-created mock fleet sessions;
- driver-facing charging/V2G state and protected reserve logic;
- utility/aggregator view with multiple sessions;
- shared mock grid/utility clock;
- mock charging backend;
- commands locked;
- research collection locked;
- SUS after hands-on use.

The current first Finnish workshop should be treated as evidence about **comprehension, credibility, task flow, trust, control and role logic**, not as evidence that a real wireless charger/CPO integration has already been validated.

### Current research branch (v1.4)

Purpose: add a secure research-data architecture without opening real participant collection.

Current state:

- dedicated `pulse-srf-research-test` Worker;
- EU-jurisdiction D1 test database;
- synthetic-only test record type;
- normal research endpoint fail-closed;
- synthetic E2E route present but still locked pending Turnstile test-secret readiness.

This is infrastructure validation, not participant research.

## 5. Three-country app strategy

The project needs a **shared core evidence model with country-specific flows**, not one identical UI for every site.

### Finland — Espoo/Tampere: N1 light-goods deliveries under winter/logistics pressure

Part B explicitly focuses on N1 delivery operations, Nordic winter, alignment, ECSR, grid impact, trust, accessibility and inclusivity. Drivers operate sessions through the sandbox app and the data feed the Double Twin.

#### Primary app actors

- fleet driver;
- dispatcher / operational controller;
- fleet manager / fleet organisation / procurement decision-maker;
- utility/aggregator or technical facilitator view.

#### Separate affected-public flow

Do not force citizens and vulnerable/public-space stakeholders into the fleet-driver flow. A separate Finnish citizen/accessibility flow is preferable for public-space acceptability, safety, accessibility, street use and distribution of benefits/risks.

#### Decision separation to preserve

Fleet organisation level:

- participation/procurement decision;
- expected reliability and cost;
- compensation/service terms;
- fleet availability commitments;
- contract/liability concerns.

Dispatcher/driver episode level:

- can this vehicle charge now?;
- protected SOC / departure constraint;
- whether V2G is permitted now;
- who controls the permission;
- override/stop/departure;
- inconvenience and confidence in recovery.

City/citizen/public-space level:

- accessibility and obstruction;
- perceived safety;
- curb/public-space fairness;
- legitimacy and public benefit;
- distribution of benefits and burdens.

#### Evidence emphasis

- alignment clarity and time/corrections;
- ECSR / effective start;
- protected departure reserve comprehension;
- V2G authorisation and override logic;
- confidence that mobility needs remain protected;
- failure/recovery understanding;
- winter/logistics time pressure;
- compensation/tariff responsiveness;
- wireless and bidirectional acceptance after hands-on use.

### Greece — Trikala: M1 passenger transport + tariff/RES smart charging

Part B explicitly describes local residents using an M1 vehicle in week-long trials. The app presents tariff signals and gamification to encourage off-peak and RES-surplus charging and records consent/usability evidence. Societal indicators include usability, inclusivity, fairness and trust.

#### Primary app actors

- local resident / passenger-car driver;
- EV and non-EV drivers in broader survey/DCE work;
- CPO/eMSP context (PPC);
- municipality/local host (e-TRIK);
- grid actor context (HEDNO).

#### Evidence emphasis

- comprehension of dynamic price/tariff signals;
- comprehension of RES share/environmental signal;
- willingness to shift charging time;
- perceived fairness of incentives;
- control vs automation preferences;
- trust in CPO/grid actor;
- willingness to participate in V2G under guarantees;
- hot-weather reliability perception;
- everyday-trip and parking fit.

#### Planned language

Greek (`el`) and English should be supported in the mature app.

**Current backend gap:** the current v1.4 synthetic validator supports only `fi` and `en`, and there is no Greece-specific research variant yet. This must be designed before Greek field use. Do not silently reuse `fi-citizen` as the Greece schema.

### United Kingdom — Oxfordshire: accessibility-first on-street V2H/V2G

Part B explicitly centres disabled drivers, carers and Motability participants using an accessible Peugeot e-Traveller and an accessible sandbox app. Required accessibility features named in Part B include voice assist, large text and screen-reader compatibility. The trial compares wireless charging with a fallback conductive gully and links to HEMS/V2H functionality.

#### Primary app actors

- disabled driver;
- carer/support person where relevant;
- Motability participant;
- household/HEMS user context;
- local authority/site operator context.

#### Evidence emphasis

- unaided task completion;
- assistive-technology compatibility;
- physical/cognitive effort avoided by wireless charging;
- clarity of alignment/system state;
- confidence and control over V2H/V2G;
- override and departure assurance;
- comparison with conductive fallback;
- public-space accessibility and dignity;
- household load/tariff understanding;
- trust, perceived safety and reliability in wet conditions.

The UK flow should be accessibility-first by design, not a normal flow with accessibility added later.

## 6. Vulnerability and inclusion strategy

### Explicit in Part B

Part B requires diverse participation and explicitly names/uses:

- low-income households;
- older adults;
- people with disabilities / mobility-limited users;
- rural/accessibility representation;
- underrepresented gender quotas;
- multiple age groups;
- disabled Motability users in the UK demonstration.

The T1.2 sampling strategy oversamples low-income households, older adults and people with disabilities. Co-design workshops use diversity quotas including underrepresented gender, multiple age groups and accessibility/rural participation.

### Working implementation extensions

Additional groups discussed for PULSE implementation include cognitive disability, digital vulnerability, gender-related vulnerability, youth, students, single-parent households, migrants and cyclists/road users.

These can be useful **study-design segments or affected-stakeholder categories**, but not all are explicitly named in Part B. Before collecting any sensitive category directly in the app, confirm necessity, ethics basis, data minimisation and whether the information can instead come from recruitment/study assignment.

The app should not become a demographic questionnaire by default.

## 7. Survey and DCE pipeline

Part B T1.2 commits to a three-country behavioural survey (~1,600 baseline + ~800 follow-ups) and two DCEs:

1. a technology-focused DCE covering attributes such as dwell time, tariffs, RES shares and incentives;
2. a transport-behaviour DCE covering trip, parking and charging decisions.

COM-B constructs are used as mediators, and outputs support equity/adoption segmentation and at least five validated synthetic archetypes.

### Working analytical design

A useful implementation interpretation is:

- **DCE 1: programme/contract choice** — participation, compensation, reserve guarantee, control model, service reliability, tariff/RES rules;
- **DCE 2: charging-episode choice** — charge now/wait, V2G now/decline, departure time, inconvenience, price/RES signal, available reserve.

This DCE1/DCE2 naming is a working design proposal, not verbatim Part B text. Keep it traceable to the two contractual DCE purposes above.

Suggested modelling progression:

- multinomial logit baseline;
- mixed logit for preference heterogeneity;
- latent-class segmentation;
- ICLV only if the data and measurement model justify the added complexity.

Translate statistically supported preference thresholds into user/system requirements rather than leaving the DCE as a standalone publication exercise.

## 8. App evidence -> Behavioural Twin -> Double Twin

The intended pipeline is:

```text
co-design workshops + survey/DCE
        -> requirements + synthetic archetypes
        -> BT seed (archetypes, coefficients, app-event schema)
        -> controlled app/session evidence
        -> real pilot app telemetry + SUS/micro-surveys + diaries
        -> joined OCPP/ISO 15118 session evidence
        -> BT recalibration by segment/site
        -> SRF Gate Cards / ARL / equity indicators
        -> BT <-> EST coupling in Double Twin
        -> replication, SCBA/LCA, policy and standards
```

Part B explicitly calls for a BT seed package including archetypes, coefficients, app-event schema and BT↔EST data-exchange protocols, then iterative recalibration with pilot telemetry and diaries.

## 9. Societal Readiness Framework: what the app should measure

The app should not try to measure all of SRF by itself. It should provide traceable evidence for the SRF dimensions that actually occur at the human/service interface.

### A. Inclusivity and accessibility

Questions/evidence:

- can the participant complete the task unaided?;
- where is assistance needed?;
- does the interface work with assistive technology?;
- are language, layout and interaction understandable?;
- does wireless charging remove or create barriers?;
- are benefits available across user groups/places?

Part B KPI direction includes ≥70% unaided completion and ≥80% of vulnerable users confirming needs addressed.

### B. Trust and perceived safety

Questions/evidence:

- does the system behave predictably?;
- does the user trust the charging/V2G decision?;
- does the user know who controls the system?;
- is failure recovery credible?;
- is safety/EMF evidence communicated clearly without overstating certainty?

Part B includes a User Trust & Safety Score target and EMF work that must feed public-trust/risk communication.

### C. Comprehension and transparency

Questions/evidence:

- can users explain what is happening to energy flow?;
- do they understand protected SOC/departure guarantees?;
- do they understand tariff/RES signals?;
- can they distinguish charging, V2G/V2H and idle states?;
- do they understand compensation/contract implications at the correct role level?

The literature review specifically treats comprehension, transparency and predictability as readiness infrastructure.

### D. Perceived control, reversibility and autonomy

Questions/evidence:

- who authorises V2G?;
- can the driver/household override?;
- can the participant leave when needed?;
- is the consequence of override clear?;
- does automation preserve meaningful control?

The app should log the difference between *having* an override and *understanding/trusting* it.

### E. Fairness, equity and distribution

Questions/evidence:

- are incentives/compensation perceived as adequate?;
- are charging opportunities accessible across groups and places?;
- who receives the grid/financial benefit?;
- who bears inconvenience, public-space cost or risk?;
- does a policy advantage fleets while disadvantaging citizens or vulnerable users?

This should feed Equity Coverage Ratio and distributional WP5 analysis, not only individual acceptance.

### F. Everyday fit and adoption readiness

Questions/evidence:

- acceptable delay/dwell time;
- route/departure compatibility;
- willingness to participate under defined guarantees;
- minimum acceptable compensation;
- intention to use wireless charging;
- intention to adopt within a plausible time horizon.

These feed BT adoption dynamics and ARL.

### G. Responsiveness of the project

A core SR principle is not just measuring concerns but showing that the project responds to them.

Every major app/SRF finding should be traceable as:

`evidence -> threshold/problem -> owner -> design change/decision -> retest outcome`

Examples:

- tariff comprehension too low -> rewrite signal explanation -> retest;
- disabled users need assistance -> accessibility/HMI change -> retest;
- drivers distrust reserve protection -> change guarantee/state presentation -> retest;
- citizens identify curb-access conflict -> site/design change -> reassess.

## 10. Recommended harmonised event/data model

Keep technical events and research constructs separate but joinable by a pseudonymous/session-safe key.

### Technical/session events

Examples:

- session registered;
- docking started;
- alignment corrections;
- alignment achieved / failed / abandoned;
- charge requested;
- effective charge started;
- state/power/SOC updates;
- V2G available;
- V2G authorised/declined;
- V2G started/stopped;
- override;
- fault/recovery;
- ready to depart;
- session ended.

### User/research events

Examples:

- research notice/consent acknowledgement;
- comprehension items;
- task completion/help needed;
- tariff/RES interpretation;
- trust/control ratings;
- perceived safety/risk communication;
- acceptance/intention;
- SUS after use;
- micro-survey checkpoint.

### Join rule

The app-event schema should support joining to OCPP/ISO 15118 session logs for project KPIs while avoiding storage of direct identifiers such as names, email, vehicle registration, VIN, precise GPS or raw operational identifiers unless separately justified and approved.

## 11. SRF Gate Cards and project checkpoints

Part B is internally inconsistent on the final SRF gate month:

- the Phase 1 narrative refers to gate indicators at M12, M24, M36 and **M42**;
- T1.3 refers to SRF Gate Cards at M12, M24, M36 and **M40**.

Do not silently choose one in software/documentation. Raise this for consortium/governance clarification before hard-coding the final gate calendar.

A practical evidence progression is nevertheless clear:

### Early gate

- co-design coverage/representation;
- concept comprehension;
- baseline SUS/trust;
- role/decision logic;
- first requirements;
- app-event schema and BT seed readiness.

### Site-readiness gate

- accessible flows available;
- data pipeline tested;
- consent notices approved;
- app↔technical session matching validated;
- no unresolved high-severity usability/safety/accessibility barrier.

### Real-pilot gate

- sufficient real sessions;
- alignment/ECSR and user evidence joined;
- trust/accessibility/V2G acceptance measured by site/segment;
- deviations trigger documented corrective action.

### Final readiness/playbook gate

- cross-country synthesis;
- adoption/equity segmentation;
- BT/DT calibrated enough for replication scenarios;
- unresolved concerns explicitly documented;
- requirements and policy/standardisation lessons traceable to evidence.

## 12. Important KPI links

The app should support, not replace, the technical KPI system.

Part B socio-technical targets relevant to app/event design include:

- alignment within 120 s to ≥90% nominal power for ≥95% of arrivals in demonstration targets;
- effective charge start rate (ECSR @3 min);
- ≥70% unaided task completion for vulnerable users in WP4 framing;
- ≥60% acceptance of bidirectional charging under guarantees in pilot evaluation;
- User Trust & Safety evidence including clarity on tariffs/RES;
- Adoption Readiness Level;
- Equity Coverage Ratio;
- ≥95% app↔OCPP session matching in WP4 pre-tests/data quality.

Avoid turning high-level 2030 impact targets into claims about a small workshop sample.

## 13. Governance/data-protection boundary

The current code/testing must remain synthetic-only until the required University of Helsinki / consortium ethics and data-protection approvals are documented.

Part B itself requires REC approval before vulnerable-participant recruitment and before in-app survey/diary/telemetry collection in the real study context.

Design principles:

- data minimisation;
- plain-language notice;
- explicit opt-in where required;
- accessible consent;
- no free text by default unless specifically approved;
- no direct PII in the research payload;
- separate operational identifiers from research identifiers;
- role-appropriate questions only;
- sensitive demographic/health/disability data only where justified and approved;
- synthetic/team-generated data for infrastructure testing.

## 14. Current implementation gaps to carry into the roadmap

1. Greece-specific app/research variant is not yet implemented.
2. Greek language (`el`) is a target but current v1.4 research validator allows only `fi` and `en`.
3. Finnish citizen/accessibility flow should remain separate from the first fleet-driver workshop flow.
4. UK accessibility-first flow needs explicit implementation of voice/large-text/screen-reader requirements and accessibility evidence logging.
5. Real charger/CPO/vehicle/HEMS adapters are future work; current workshop backend is mock.
6. App↔OCPP/ISO 15118 join schema must be finalised before field deployment.
7. EMF/risk-communication evidence needs a user-facing layer once T1.4 results become available; do not invent safety claims before evidence exists.
8. DCE/survey constructs and app telemetry need a shared variable dictionary so the BT does not receive incompatible meanings across instruments.
9. SRF findings need a formal evidence->requirement->change->retest trace, not just a dashboard.

## 15. Recommended next product-development sequence

1. Finish the synthetic research pipeline E2E test without unlocking normal research collection.
2. Freeze the first Finnish fleet workshop version and run the first structured rehearsal/demo using `FIRST_DEMO_READINESS.md`.
3. Convert first-demo findings into a requirements/evidence matrix rather than immediate ad-hoc UI changes.
4. Define the harmonised research/event dictionary shared by FI/GR/UK.
5. Implement the separate Finnish citizen/accessibility flow.
6. Add Greece variant + Greek language and tariff/RES-specific evidence flow.
7. Build the UK accessibility-first V2H flow and test it with accessibility experts before field recruitment.
8. Define the real backend adapter contracts (CPO/OCPP, ISO 15118/session, positioning/FLOD, vehicle/SOC, grid signal, HEMS where relevant).
9. Add approved real-study data collection only after governance gates are met.
10. Feed validated app/survey/pilot evidence into BT calibration and SRF Gate Cards, with explicit corrective-action ownership.

## 16. New-chat instruction

A new ChatGPT engineering/research session with GitHub connection should begin by reading:

- `docs/HANDOFF_CURRENT_STATE.md`
- `docs/HANDOFF_APP_SRF_PIPELINE.md`
- `docs/FIRST_DEMO_READINESS.md`
- `docs/RESEARCH_TEST_WORKER_SETUP.md`
- `research-test/wrangler.jsonc`
- `src/research-test-entry.js`

Then inspect the live branch/PR state before making changes. Treat Part B as the contractual source and clearly label any new methodological or UX proposal as an implementation decision rather than a Part B commitment.
