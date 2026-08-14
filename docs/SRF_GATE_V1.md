# PULSE Pilot App v1.0 — SSH / SRF gate progression

The Pilot App is both a technical user-facing prototype and an instrument for repeated societal-readiness assessment. The same constructs should become less hypothetical and more experience-based as the technical system matures.

## Checkpoint A — co-design / mock prototype

Technical evidence:
- deterministic state-machine flow works;
- state labels and transitions are understandable;
- no real charger command authority.

SSH evidence:
- task completion / navigation;
- comprehension of wireless charging and V2G direction;
- perceived control and mobility protection;
- accessibility barriers;
- initial trust and acceptability;
- SUS after genuine hands-on use.

Decision use:
- derive or revise SRF requirements for HMI, control, safety information and inclusion.

## Checkpoint B — integrated sandbox / Digital Twin

Technical evidence:
- API connector maps backend data to `pulse-session-v1` consistently;
- simulated technical faults propagate correctly to the HMI;
- protected SoC / departure-ready logic is consistent across backend and UI.

SSH evidence:
- predictable automation;
- comprehension of system state from live-like data;
- ability to recover from faults;
- override discoverability;
- trust after successful and failed sessions.

Decision use:
- close interface/backend mismatches before field exposure.

## Checkpoint C — read-only field integration

Technical evidence:
- app shows real charger/session state;
- timestamps, SoC, power and energy direction agree with pilot logs;
- no write commands from the public/anonymous app.

SSH evidence:
- unaided task completion;
- actual alignment/charging state comprehension;
- experienced reliability and predictability;
- accessibility under real environmental conditions;
- difference between expected and experienced trust.

Decision use:
- determine whether the system is ready for controlled operational interaction.

## Checkpoint D — authenticated operational field pilot

Prerequisites:
- explicit pilot safety approval;
- role/session authentication;
- reviewed command allow-list;
- backend authorisation and audit trail;
- protected mobility constraints enforced server-side.

Technical evidence:
- start/stop/override execution;
- command acknowledgement and failure handling;
- joined app <-> charging-session evidence.

SSH evidence:
- perceived versus actual control;
- willingness to rely on automation;
- recovery after faults;
- trust retention;
- work-role fit and delay/inconvenience;
- SUS and task metrics under real conditions.

## Checkpoint E — replication / deployment readiness

Evidence should show not only a successful demo but repeatable performance across sessions and relevant user groups.

Track:
- technical reliability and winter performance;
- comprehension and task success trends;
- trust/predictability trends;
- control/override sufficiency;
- accessibility and equity issues closed or explicitly accepted;
- unresolved SRF issues, owner and corrective action;
- readiness of contract, responsibility and risk communication.

## Gate-card rule

Every SR issue should be traceable as:

`issue -> affected actor -> requirement -> technical/app feature -> metric -> evidence -> threshold -> corrective action -> owner -> gate decision`

Do not use SUS or acceptance alone as a gate. Technical and socio-technical evidence remain separate but are reviewed together.
