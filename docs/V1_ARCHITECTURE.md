# PULSE Pilot App v1.0 architecture

## Purpose

v1.0 turns the workshop prototype into an architecture that can survive the path from simulated co-design to integrated and field-pilot use. The same participant-facing app should be able to consume either simulated state or a real PULSE charging backend without changing the meaning of the user-facing states.

## Two isolated planes

### Charging / operational plane

Normalized protocol: `pulse-session-v1`.

Canonical states:

`ARRIVED -> ALIGNING -> READY -> CHARGING -> V2G_AVAILABLE -> V2G_ACTIVE -> RECHARGING -> READY_TO_DEPART -> SESSION_ENDED`

Exceptional states: `PAUSED`, `FAULT`, `OVERRIDDEN`.

Normalized snapshot fields are intentionally minimal: session reference, state, observation time, SoC, protected SoC, power, energy to vehicle, energy to grid, direction, departure-ready flag and generic fault code.

Operational identifiers such as VIN, registration plate, raw charger/EVSE identifiers or precise location do not belong in the research payload.

### SSH / research plane

The research plane stores only approved, purpose-bound variables required for the SRF evidence chain: participant role group, workshop code, task/comprehension outcomes, SUS, trust/control/accessibility/acceptance measures and scenario variables required for interpretation.

The research endpoint must never persist the complete browser state or raw charging-backend response.

## Adapter boundary

`MockChargingAdapter` supplies deterministic workshop state.

`BackendChargingAdapter` uses same-origin `/api/charging/*` endpoints. The browser never receives an upstream charger/backend credential.

A future PULSE connector belongs inside the Worker/backend boundary and maps partner-specific data into `pulse-session-v1` before the browser sees it.

## Field-pilot progression

1. Mock adapter: co-design and dry-run.
2. Sandbox connector: partner test backend / Digital Twin.
3. Read-only field connector: real charger state, no control commands.
4. Authenticated command connector: only after pilot authorisation, role/session authentication, audit logging and safety review.

The public QR workshop deployment must not be capable of controlling a real charger.

## Command safety rule

`CHARGING_COMMANDS_ENABLED=false` is the default. v1.0 contains no live command connector. Even if the flag is changed, the Worker returns `501` until a separately reviewed authenticated connector is implemented.

Any future command path must include:

- short-lived pilot-session authentication;
- explicit role/permission checks;
- server-side upstream credentials stored as Worker secrets;
- idempotency key for every command;
- command allow-list (`start`, `stop`, `override`, etc. as approved);
- precondition checks against protected SoC / mobility guarantee;
- audit event with a pseudonymous session reference;
- safe timeout/failure behaviour and no automatic retry of non-idempotent commands.

## SRF traceability

For each SR issue maintain:

`Issue -> requirement -> app/state feature -> indicator -> pilot evidence -> corrective action -> next gate`.

Example: uncertainty about departure SoC -> persistent protected-reserve state -> comprehension + override measure + actual session outcome -> design correction if threshold is not met.
