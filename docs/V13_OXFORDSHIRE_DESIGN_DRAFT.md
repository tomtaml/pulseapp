# Oxfordshire V1.3 workshop design draft

Status: for site and participant review, 28 September 2026. This document proposes a preview experience; it does not approve research collection or change the deployed app.

## Direction from the three-site matrix

**Primary principle:** support independent use and accessible recovery. The Oxfordshire interaction should elicit independent task completion, accessible controls, protection of vehicle and household needs, and effects on other users of the space. Keep the common definitions of technology, status, control and failure aligned with Tampere and Trikala. Provide an equivalent non-digital discussion route.

The Tampere RC1 journey provides the interaction grammar: approach/position, charging readiness, protected needs and permission, an animated energy session, interruption/override, then optional understanding and experience questions. Oxfordshire uses **two explicitly separate scenes**. Scene A is on-street, cable-free WPT and accessible recovery. Scene B is a simplified, illustrative household V2H situation. The transition states that this is another setting; it does not imply a physical energy connection from the street bay to a home. V2G is optional only if the site confirms a relevant use. The current UK V1.3 cards are a starting point, not validated site geometry or a live HEMS connection.

## Proposed Oxfordshire journey

| Screen | Participant-facing elements | Decision and visible consequence | Evidence prompt |
| --- | --- | --- | --- |
| 1. Scene A introduction | Compare a cable-handling description or storyboard with on-street cable-free WPT. Explain the simulated next-trip context. | Choose the broad perspective; identify any initial benefits or new barriers in either approach. | UK-W1: usefulness, effort and independence as the participant describes them. |
| 2. Street approach and position | Schematic top-down bay: vehicle, pad, walking/rolling route, access space and gully. Animate `approach → guidance → aligned → ready`; give equivalent text and optional voice. | Request guidance, confirm positioning, or request help. Show clearly whether charging can start. | UK-W2: independent understanding and operation with large text, keyboard/switch and screen reader as applicable. |
| 3. WPT charging state | User-started, pauseable/replayable status sequence `ready → charging → complete`, with an illustrative next-trip reserve. | Start or stop charging and see the resulting vehicle readiness. | Can the participant distinguish positioning, charging and departure readiness? |
| 4. Wet/low-light recovery | Fault interrupts positioning or charging; show retry, conductive gully charging where usable, leave, and accessible support. | Choosing a path changes the visible state and its consequence. The fallback does not imply V2H. | UK-W3: independent recovery, support needed and credibility of the alternative. |
| 5. Scene transition | Explicitly introduce a separate illustrative household-energy setting; retain the vehicle/next-trip concept, without implying the street bay powers the home. | Facilitator may include or skip this scene for the workshop use case. | Keep WPT and V2H responses distinguishable. |
| 6. Household protections | Show vehicle trip reserve and agreed essential household loads or backup threshold side by side; label example values as illustrative. | Choose the conditions under which home support would be permitted. | UK-H1: what must remain protected and who sets each limit? |
| 7. V2H energy and control | User-started sequence `grid → vehicle` or `vehicle → home` after explicit permission, with visible direction, protected needs, pause/stop and an unexpected-state prompt. | Suspend sharing and inspect the resulting state; support and responsibility are discoverable. | UK-H2: direction and override; UK-H3: who controls settings and who provides accessible help. |
| 8. Completion and optional questions | Separate recap for street WPT and household V2H. Same facilitator switches: demo only; understanding; SUS for direct users; confidence, trust and outcome scales. | Replay either scene or finish. No workshop response is submitted. | Comparable constructs, tagged by scene and participation mode. Ask other affected space users about the street scene separately (UK-S1). |

The parking illustration must remain schematic until the site supplies bay orientation, pad, gully, footway and access-clearance details. The animation must be understandable as a still sequence, by keyboard/switch and screen reader, with concise status announcements and reduced motion. A spoken status is participant initiated. Do not use a precise alignment score or claim automatic vehicle positioning without a validated service basis. The household scene uses a distinct visual setting and scene label, rather than continuing the street animation into a home.

## Table A-6 hypotheses as workshop probes

These are **early acceptance hypotheses**, not predicted participant answers. Facilitation should ask neutral questions and note counterexamples as well as support.

| ID | Stage and neutral probe | Observation or response to capture | SRF / downstream use |
| --- | --- | --- | --- |
| UK-W1 | Scene A first reaction: “What would change for you between handling a cable and using this wireless bay? What might become harder?” | Perceived usefulness, effort, independence and new positioning/interface barriers. | SRF-03/04/05/25; accessibility and WPT service requirements. |
| UK-W2 | Street positioning: “Show how you would know where to park and when charging has started.” Offer the participant's usual display/assistive settings. | Unaided task completion, status comprehension, guidance replays, assistance requested and HMI mode used; avoid collecting diagnosis. | SRF-06/12/25; accessible HMI requirements and testing. |
| UK-W3 | Wet or low-light interruption: “What would you do next? What help would you need, if any?” | Fallback chosen, ability to find support, perceived independence and burden of retry/gully/leave. | SRF-08/25/27; fallback and pilot accessibility requirements. |
| UK-H1 | Separate household scene: “What vehicle charge and household needs would have to stay protected before you allowed home support?” | Participant-stated trip and essential-load conditions; comprehension of both protections; V2H intention under those conditions. | SRF-11/19/26; V2H reserve-setting requirements. |
| UK-H2 | V2H unexpected-state prompt: “Where is energy going now? How would you pause it?” If site-relevant, probe grid export separately. | Direction answer, independent override success, consequence understood, assistance requested. | SRF-11/12/25; accessible control and V2H/V2G items. |
| UK-H3 | Household responsibility cards: “Who should set the limits, who may stop sharing, and who should provide help if it fails?” | Separate attributions to user, household, HEMS/service provider, carer or support actor; any uncertainty or fairness concern. | SRF-10/12/21; governance and accessible support requirements. |
| UK-S1 | A separate street-layout discussion with affected non-users: “What could this installation change for your route or use of the space?” | Access-route obstruction, rain/lighting concerns, fairness and local-authority design issues; do not ask one driver to represent all users. | SRF-20/22/24/25; site design and public-space assessment. |

## Capture during the first workshops

The existing V1.3 preview is storage-free. Interaction state may drive the on-screen simulation, but no participant event stream or research payload should be added as part of this design review. Use an approved facilitator sheet for observations and a matching printed/assisted storyboard where digital use is unsuitable.

| Comparable construct | On-screen interaction state | Facilitator observation or question |
| --- | --- | --- |
| Positioning and start | Guidance requested, position confirmed, charging ready | Unaided completion, assistance requested, positioning confusion, and perceived effort |
| Control and protected needs | Scene B permission chosen, vehicle/household protections displayed, sharing stopped | Who controls sharing? What stays protected? Can the participant find and explain stop/leave? |
| Failure and recovery | Fault shown, retry/gully/leave/support path selected | Recovery understood; physical or digital burden of each path; support needed |
| Inclusion and public space | Access route and gully shown on the schematic | Participant comments on clearance and dignity; separate observations from other affected space users |
| Experience | Questions, SUS where applicable, confidence/trust/accessibility items | Same construct definitions and mode label (`digital` or `facilitated`) across sites |

For a later approved study, define common event meanings such as `position_confirmed`, `charging_started`, `sharing_authorised`, `override_used`, `fault_shown`, `recovery_selected` and `task_completed`. Include a `scene` distinction (`street_wpt` or `household_v2h`) and record the energy destination (`vehicle`, `home`, or `grid`) separately. Simulation events, facilitator observations and operational telemetry have different sources and should remain distinguishable. Any stored event schema, retention or participant linkage requires separate review; the current V1.3 submission contract has no fields for parking corrections, assistance or event timing.

## Site decisions before implementation

1. Confirm the physical bay layout and which access/clearance features the workshop image may truthfully depict.
2. Use a separate illustrative household-energy scene for V2H in this workshop draft. Confirm which HEMS behavior and household needs the scene may depict. Include V2G only if relevant to the Oxfordshire service under review.
3. Agree illustrative vehicle trip reserve and household backup threshold, departure consequence and fallback behavior, including what the conductive gully can and cannot support.
4. Agree who will review the accessible interaction with screen reader, keyboard/switch, large text, high contrast and reduced motion; include affected space users in a separate prompt.

The implementation should be confined to the V1.3 preview branch and Worker. The partner-facing V1.2 RC1 Worker remains unchanged.
