# PULSE Tampere first-demo readiness package

## Purpose

This package freezes the first external-facing Tampere fleet demonstration around the current shared mock charging architecture. It is a workshop rehearsal and usability/SSH prototype, not yet a live charging service.

The first demo should answer four questions:

1. Can participants understand wireless charging, V2G, protected mobility reserve and recharge as distinct operating states?
2. Does the service behave credibly for a delivery fleet when next-route needs, protected SoC and dwell time differ by vehicle?
3. Can several QR sessions participate in one shared utility/aggregator scenario without violating vehicle-level mobility constraints?
4. Are the resulting usability, comprehension, trust, control and responsibility questions meaningful enough to carry forward to the field pilot and SRF evidence chain?

## Current workshop candidate baseline

- charging backend: mock
- charging protocol: `pulse-session-v1`
- operational registry: shared utility clock
- operational registry version: `1.3.11` or later accepted workshop-candidate patch
- utility clock: operator started, server authoritative
- utility slot duration: 15 real seconds per simulated 15 minutes
- full six-slot run: about 90 real seconds
- charging commands: disabled
- research collection: disabled for the dry run
- free text: disabled

Record the exact Git commit and `/api/health` output at the start of each rehearsal.

## Facilitator script

### 1. Welcome and framing — 3 to 5 min

Explain:

- PULSE is testing a wireless bidirectional charging service for an N1 delivery-fleet scenario.
- The values shown are simulated workshop values, not measured Tampere charging data.
- Each QR code creates a synthetic operational vehicle profile with its own SoC, route need, protected reserve and dwell time.
- Mobility and the next delivery always have priority over grid service.
- The utility/aggregator screen and participant phones share the same simulated energy-system clock.
- During a collection-disabled rehearsal, no research responses are stored.

### 2. QR onboarding — 3 to 5 min

Ask each tester to:

1. scan/open a fresh participant session;
2. choose the role that best matches the test perspective;
3. progress to the charging/V2G page before the common energy-system cycle starts;
4. leave the charging/V2G screen visible while the facilitator uses the utility display.

### 3. Shared energy-system cycle — about 2 min including explanation

Start the cycle only from the utility/aggregator view.

Expected workshop narrative:

- 15:30: charging protects the next-route mobility requirement;
- 15:45: additional buffer is built while conditions remain favourable;
- 16:00: eligible vehicles can export V2G during the first peak-support slot;
- 16:15: remaining safe V2G flexibility can be used while the protected reserve remains inviolable;
- 16:30: exported vehicles recharge / rebuild the departure buffer;
- 16:45: vehicles satisfying their individual reserve can be released.

Emphasise that different vehicles may do different things at the same shared clock time.

### 4. Winter malfunction — 5 min

Use the interruption/fault scenario to discuss:

- safe stop of wireless energy transfer;
- retry versus release to route;
- fallback charging;
- dispatcher/support escalation;
- technical provider versus fleet responsibility;
- what must be visible in an SLA/service report.

### 5. Structured debrief — 10 min

Prompt around:

- Was energy direction clear?
- Was protected reserve understandable and credible?
- Did participants understand why some vehicles charged, exported, held or became departure-ready?
- Who should approve an individual V2G activation?
- Was the override/control model acceptable?
- What information would operations require before trusting the service?
- What should happen after repeated winter failures?
- Which assumptions would be unacceptable in a real fleet contract?

For a dry run, use the participant questions only as interface probes. Do not interpret or retain them as research data.

## 1 / 3 / 5-session acceptance protocol

Run the following sequence after any material charging, utility-clock, registry or submission change.

### A. One participant

Pass if all are true:

- fresh QR creates one new session;
- session appears as docking/arrival in utility view;
- participant and utility display the same shared clock;
- 15:30 and 15:45 charging behave plausibly for the assigned SoC/profile;
- 16:00/16:15 V2G occurs only if sufficient margin exists;
- protected reserve is never crossed;
- battery indicator falls during V2G and rises during recharge;
- 16:30 restoration is visually smooth;
- 16:45 release does not force an artificial SoC jump;
- refresh does not duplicate or corrupt the session.

### B. Three participants

Pass if all are true:

- all sessions are listed separately;
- randomized SoC/protected reserve/dwell/route needs differ plausibly;
- one shared clock controls every session;
- individual mobility constraints produce heterogeneous states where appropriate;
- aggregate charging power and V2G export reflect the active sessions;
- a mobility-priority vehicle is not counted as dispatchable V2G flexibility;
- one participant refresh does not disturb the others.

### C. Five participants

Pass if all are true:

- participant and utility pages remain responsive on workshop Wi-Fi/mobile networks;
- no visible utility flicker or wholesale page redraw occurs;
- concurrent state changes do not overwrite another session;
- aggregate power/energy remains internally plausible;
- session list remains readable on the presentation display;
- cycle can finish and a new clean workshop run can be started.

## Reset / cleanup procedure

Before a new rehearsal:

1. allow the current utility run to complete or use the approved mock-registry reset procedure;
2. close old participant tabs where practical;
3. open fresh QR URLs rather than reusing stale session URLs;
4. hard-refresh the utility display after a new build;
5. verify `/api/health` before admitting participants;
6. confirm collection remains disabled unless the explicitly approved research-data test environment is being used.

## Go / no-go checklist for first external workshop

Go only if:

- [ ] `/api/health` matches the intended workshop build;
- [ ] 1/3/5-session test passes;
- [ ] no known blocker prevents progression through the participant flow;
- [ ] protected SoC is enforced throughout the energy cycle;
- [ ] utility clock starts reliably from the operator view;
- [ ] participant and utility states remain synchronized;
- [ ] mobile Safari and Chrome test pass;
- [ ] large text / zoom and contrast controls remain usable;
- [ ] collection state is explicitly known and announced;
- [ ] facilitator has a fallback explanation if the mock registry/network fails;
- [ ] exact build, workshop code and study variant are recorded for SRF traceability.

## SRF evidence capture

For each rehearsal/workshop record:

- app/registry version and Git commit;
- workshop code and flow variant;
- number and broad roles of testers (only where governance permits recording this);
- passed/failed acceptance checks;
- observed issue;
- affected user/stakeholder need;
- requirement implication;
- owner and proposed response;
- whether the issue changes the next field-pilot gate.
