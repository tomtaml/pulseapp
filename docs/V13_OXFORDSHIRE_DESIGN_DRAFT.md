# Oxfordshire V1.3 workshop design draft

Status: for site and participant review, 28 September 2026. This document proposes a preview experience; it does not approve research collection or change the deployed app.

## Direction from the three-site matrix

**Primary principle:** support independent use and accessible recovery. The Oxfordshire interaction should elicit independent task completion, accessible controls, protection of vehicle and household needs, and effects on other users of the space. Keep the common definitions of technology, status, control and failure aligned with Tampere and Trikala. Provide an equivalent non-digital discussion route.

The Tampere RC1 journey provides the structure: approach/position, charging readiness, reserve and permission, an animated energy session, interruption/override, then optional understanding and experience questions. Oxfordshire needs its own on-street parking scene and its own energy and recovery consequences. The current UK V1.3 cards are a starting point, not a representation of validated site geometry or a live HEMS connection.

## Proposed Oxfordshire journey

| Screen | Participant-facing elements | Decision and visible consequence | Evidence prompt |
| --- | --- | --- | --- |
| 1. Introduction | Accessible vehicle, on-street WPT, simulated service and next-trip context. Display and read-aloud controls remain available. | Choose the broad driver perspective and acknowledge the simulation. | Does the task and next-trip need make sense without facilitator explanation? |
| 2. Approach and position | Schematic top-down bay: vehicle, wireless pad, walking/rolling route, access space, and conductive gully location. Animate `approach → guidance → aligned → ready`; show the same state in text. | Request guidance, confirm positioning, or request help. Show whether charging can start. | Can the participant locate the target and readiness state? Observe unaided completion, corrections and assistance; discuss effects on other space users. |
| 3. Protected needs | A card for current vehicle charge, protected next-trip reserve, planned use, and any agreed household backup threshold or essential load. Values are explicitly illustrative until confirmed. | Choose charge now, permit limited home support if applicable, or preserve vehicle charge. Immediately show the effect on both vehicle and household protections. | Can the participant explain both protections and who controls them? |
| 4. Energy session | A user-started, pauseable/replayable sequence with labelled status, energy direction and reserve: grid → vehicle, then an optional separately authorised vehicle → home phase. A grid-export phase is shown only if relevant and confirmed for this site. | Start, stop sharing, or leave early. Show the resulting charge and readiness, without crossing the protected reserve in the simulation. | Can the participant distinguish charging, V2H and any V2G? Is override discoverable and its consequence understood? |
| 5. Wet interruption | Positioning/charging interruption with a clear fault state and support route. Offer retry, conductive gully charging where usable, or leave with the available charge. | Show which path is active and whether home support is unavailable or unconfirmed through the fallback. | Is the recovery independently usable? What physical or digital assistance would be needed? |
| 6. Completion | Recap chosen charging mode, reserve, override and recovery, with a clear `simulation complete` status. | Participant can replay or finish. | What felt controllable, accessible or burdensome? |
| 7. Optional questions | Same facilitator switches as the other V1.3 sites: demo only; understanding questions; SUS for a direct interface user; confidence, trust and outcome scales. | No workshop response is submitted by the preview. | Use the common constructs for cross-site interpretation; add a separate space-user prompt rather than asking the driver to speak for all bystanders. |

The parking illustration must remain schematic until the site supplies bay orientation, pad, gully, footway and access-clearance details. The animation must be understandable as a still sequence, by keyboard/switch and screen reader, with concise status announcements and reduced motion. A spoken status is participant initiated. Do not use a precise alignment score or claim automatic vehicle positioning without a validated service basis.

## Capture during the first workshops

The existing V1.3 preview is storage-free. Interaction state may drive the on-screen simulation, but no participant event stream or research payload should be added as part of this design review. Use an approved facilitator sheet for observations and a matching printed/assisted storyboard where digital use is unsuitable.

| Comparable construct | On-screen interaction state | Facilitator observation or question |
| --- | --- | --- |
| Positioning and start | Guidance requested, position confirmed, charging ready | Unaided completion, assistance requested, positioning confusion, and perceived effort |
| Control and protected needs | Permission chosen, reserve displayed, sharing stopped, departure ready | Who controls sharing? What stays protected? Can the participant find and explain stop/leave? |
| Failure and recovery | Fault shown, retry/gully/leave/support path selected | Recovery understood; physical or digital burden of each path; support needed |
| Inclusion and public space | Access route and gully shown on the schematic | Participant comments on clearance and dignity; separate observations from other affected space users |
| Experience | Questions, SUS where applicable, confidence/trust/accessibility items | Same construct definitions and mode label (`digital` or `facilitated`) across sites |

For a later approved study, define common event meanings such as `position_confirmed`, `charging_started`, `sharing_authorised`, `override_used`, `fault_shown`, `recovery_selected` and `task_completed`. Record the energy destination (`vehicle`, `home`, or `grid`) separately. Simulation events, facilitator observations and operational telemetry have different sources and should remain distinguishable. Any stored event schema, retention or participant linkage requires separate review; the current V1.3 submission contract has no fields for parking corrections, assistance or event timing.

## Site decisions before implementation

1. Confirm the physical bay layout and which access/clearance features the workshop image may truthfully depict.
2. Confirm whether V2H is physically connected to the on-street demonstration, or belongs in a separate illustrative household-energy scene. Include V2G only if relevant to the Oxfordshire service under review.
3. Agree illustrative vehicle trip reserve and household backup threshold, departure consequence and fallback behavior, including what the conductive gully can and cannot support.
4. Agree who will review the accessible interaction with screen reader, keyboard/switch, large text, high contrast and reduced motion; include affected space users in a separate prompt.

The implementation should be confined to the V1.3 preview branch and Worker. The partner-facing V1.2 RC1 Worker remains unchanged.
