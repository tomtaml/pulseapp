# Oxfordshire V1.3 focused home V2H workshop draft

Status: preview for site and participant review, 28 September 2026. The route is storage-free. It illustrates a proposed interaction, not validated parking automation, a verified home energy installation or actual savings.

## Why one journey

The earlier preview put on-street WPT and a separate home V2H example in the same route to expose the UK-W and UK-H hypotheses. For the first Oxfordshire workshops, the app now focuses on the vehicle parked close to the house and the V2H experience. It no longer asks the participant to choose ordinary charging instead of V2H, or sends them through a street-bay and gully story. The WPT-specific street layout, cable handling and public-space effects remain separate facilitation topics pending site details; this focused screen should not be treated as evidence for those claims.

The scene assumes that limited V2H participation was authorised for this illustration. The participant can cancel home support before export or stop it later. In a real service, authorisation, household load protection, tariff basis, vehicle-home compatibility and who provides accessible support need site confirmation. The scenario does not claim that a wireless parking pad itself supplies bidirectional household energy.

## Focused interaction

| Step | Visible participant action and consequence | What the facilitator can probe |
| --- | --- | --- |
| 1. Home context | One role and simulation acknowledgement; house, marked bay and entrance route are introduced. | Whose mobility and household needs must be protected? |
| 2. Check surroundings | Inspect people, objects, bay sides and the walking/rolling entrance route before starting guided parking. | Could the participant understand and complete this task independently? What is missing from the guidance? |
| 3. Controlled manoeuvre | Vehicle moves only in the illustration; Stop manoeuvre is available. A staged object appears and the manoeuvre stops automatically in the simulation. Charging and V2H do not start. | Is the stop reason clear in text, large text, high contrast and spoken status? What would count as safe positioning? |
| 4. Review and recover | Review the obstruction and access route. The illustrated object moves clear, but the participant must confirm the path before resuming. Alternatively choose manual arrow guidance after the review: forward, right, then back with highlighted direction, visible movement and wrong-arrow feedback. A separate staged guidance fault requires a fresh route check before manual movement. Stop, cancel and a support panel remain available; no provider contact or real vehicle action occurs. | Could they stop, recheck, follow arrows, or seek assistance independently? Who would clear a real obstruction? |
| 5. Overnight V2H | Parked vehicle begins at 50%, charges to 80%, then can support the house down to the participant's chosen morning minimum (65%, 70%, 75% or 80%). Eight checkpoints from 18:00 to 07:00 show direction, kWh ledger and assumed cost difference. Pause, step, skip, replay and stop home support remain available. | Can they set a suitable reserve, see the household benefit and trade-off, identify actual energy delivered, understand illustrative value and override export? Which essential home loads need separate protection? |
| 6. Optional questions | Facilitator toggles draft Oxfordshire task items plus UK-specific understanding questions, SUS for the direct user, and shared confidence/trust/outcome scales. The preview does not submit answers. | Compare control, accessible use and service trust without asking about an unseen street-WPT scene; review the [instrument draft](V13_OXFORDSHIRE_INSTRUMENT_DRAFT.md). |

The parking sequence is deterministic: approach → surroundings checked → illustrated movement → obstacle stop → obstacle reviewed → resumed movement → parked. After reviewing the obstacle, the participant may use manual guidance instead: select the arrow pad, follow forward → right → back, then confirm the bay and entrance route are clear. A wrong arrow records visible feedback but does not advance the illustrated vehicle. The guidance-fault branch stays stopped until a new route check. Stop during guided or manual movement requires another review. The UI cannot continue to V2H while moving, stopped or blocked. These transitions are workshop cues, not sensor readings or safety certification. Real use would require a validated vehicle procedure and physical site assessment. Provide an equivalent spoken/printed route when digital interaction is unsuitable.

## Energy arithmetic shown on screen

This is a fixed workshop example, not a meter reading. A 60 kWh usable battery makes the 50% to 80% charging rise equal to 18.0 kWh stored. With the default 70% morning minimum, a 10-point V2H drop takes 6.0 kWh from the car. At an assumed 90% home delivery fraction, 5.4 kWh reaches the house. At assumed prices of 30p/kWh for household import and 15p/kWh for replacement battery energy, the £1.62 avoided import minus £0.90 replacement is a £0.72 illustrative energy cost difference. The 65% minimum allows up to 8.1 kWh to the house; 75% allows 2.7 kWh; 80% allows zero. A stop after the first export keeps the partly depleted state, while a stop before export shows zero V2H energy. Recharge losses, battery wear and fees are excluded.

These values, the selectable morning minimum and the household essential-load rule need review with the site. The overnight import reduction is a plausible V2H benefit in this illustration; backup of agreed essential household loads would require compatible equipment and is a separate workshop question. The app has no operational telemetry, tariff connection or household energy management system.

## Hypotheses and evidence boundaries

| Hypothesis | Probe in this focused route | What remains outside this route |
| --- | --- | --- |
| UK-H1 | Have the participant set a morning minimum and explain the resulting household kWh; ask which household loads need separate protection and who sets each rule. | No verified household backup threshold. |
| UK-H2 | Ask the participant to identify energy direction and stop home support; watch whether the controls are usable independently. | No claim of tested assistive technology or actual service override. |
| UK-H3 | Ask who authorises V2H, who receives a fault and who provides accessible help. | No verified operator/HEMS/carer responsibilities. |
| UK-W2/W3, adapted to home positioning | Observe understanding of positioning, obstacle stop, manual stop, accessible status and recovery. | No measured WPT alignment or real automated parking capability. |
| UK-W1 and UK-S1 | Use separate storyboard/discussion for cable handling and effects on other users of an on-street installation. | The home scene cannot answer street WPT or public-space readiness by itself. |

For the first workshops, the facilitator may record completion, help requested, whether the stop reason was understood, reserve and energy-direction comprehension, override success, and comments on access routes through a separately approved procedure. No participant event stream or new research payload is added by this preview. The UK UI no longer elicits the choice fields required by the present V1.3 submission schema, so it is explicitly kept in preview mode until an approved UK instrument and contract are reconciled.

The partner V1.2 RC1 Worker and its QR links are outside this implementation.
