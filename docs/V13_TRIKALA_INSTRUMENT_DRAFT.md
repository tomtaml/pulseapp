# Trikala: lighter workshop instrument

Status: preview cognitive-pretest draft, 30 September 2026. English wording is not an approved T1.2 questionnaire or Greek translation. No response is scored, submitted or stored as a participant record. The current server research contract is unchanged and this route remains collection-locked.

## Participant flow

Start with the preview participation/privacy information and simulation acknowledgement. The preview notice explains that responses stay in page memory, disappear on reload, and may be skipped. It does not substitute for the participant information and consent process of a future data-collecting study. Any separate facilitator notes follow the workshop's supplied information and approved procedure.

Parking, the charging-window choice, the reserve and departure settings, the V2G offer and explicit session permission remain app tasks. There is no extra survey between the initial offer choice and starting the session.

With questions enabled, pressing Continue after completed parking or the completed/stopped energy session reveals one optional question within that same screen. Participants can answer and continue or choose Skip question. There is no correctness gate or immediate answer feedback, and no question appears during movement or energy transfer. Returning with Back does not repeat a completed/skipped checkpoint. Changing the session plan resets the energy checkpoint for the new session.

The closing section follows the baseline energy session. In full preview, the complete SUS module appears immediately after use and before the other closing questions. The optional next-day delay task comes after all baseline ratings; it adds one separate willingness-change question when case questions are enabled. It cannot change the baseline energy ledger or first-session ratings.

## Item map

| ID | Wording or source | Placement / response | Intended evidence |
| --- | --- | --- | --- |
| gr_alignment_ease | How easy or difficult was it to position the car? | Parking checkpoint; five labelled categories from Very difficult to Very easy, plus Cannot judge; skippable | Immediate perceived positioning effort; draft individual indicator |
| gr_reserve_understanding | Can V2G reduce the battery below the [selected %] minimum you selected? | Energy checkpoint; Yes / No / Not sure; skippable | Understanding the reserve floor; no pass gate or score |
| service_confidence_1 | Existing shared next-trip-energy protection item | Closing; original 1–5 agreement scale plus Cannot judge | Confidence in mobility protection |
| service_confidence_2 | Existing shared recovery/help item | Closing; same scale plus Cannot judge | Expected recovery confidence; no claim that an unshown fault was experienced |
| wpt_intention_t1 | Existing shared wireless-charging intention item | Closing; same scale plus Cannot judge | Stated intention to use WPT; not a WTP estimate |
| v2g_intention_t1 | Existing shared V2G intention item | Closing; same scale plus Cannot judge | Stated acceptance under shown protections; not a WTA estimate |
| fairness_item | Existing shared fairness item | Closing; same scale plus Cannot judge | Perceived distribution of benefits and costs |
| actor_trust_item | Existing shared operator-trust item | Closing; same scale plus Cannot judge | Stated trust in the described operator |
| gr_gross_understanding | Does the displayed gross V2G payment include battery wear and all fees? | Closing; Yes / No / Not sure; skippable | Gross-payment comprehension |
| gr_choice_reason | What most influenced your choice of V2G plan or charging only? | Closing; one main reason: payment, control, trip needs, battery/other costs, insufficient information, another reason, or Not sure | Language and trade-off probe, conditional on the participant's app choice |
| gr_fault_willingness | How did the separate start-delay exercise change your willingness to allow V2G? | Only after the optional next-day task; Less willing / No change / More willing / Not sure; skippable | Reported effect of the hypothetical fault; not a causal effect estimate |
| sus_01–sus_10 | Existing full ten-item SUS wording and scoring definition remain unchanged | Separate optional module after baseline use; no extra Cannot judge category | Full usability instrument when specifically enabled; the preview calculates no score and allows leaving it incomplete |

The shared six items retain their exact existing wording from `v13-questions.js`. They are individual draft indicators; a shorter validated multi-item scale is not claimed. Cannot judge is a categorical response, not a numeric midpoint. Missing/skipped answers remain missing. No comprehension item or preference rating is reported as an individual score.

## Views and burden

- `view=demo`: app tasks and beginning acknowledgements only; no checkpoint or closing questionnaire.
- `view=questions`: two optional checkpoints and two closing case items; no shared ratings or SUS.
- `view=light`: recommended trial route, two optional checkpoints plus eight closing items; no SUS. Participant session stepping controls are hidden.
- `view=full`: adds the complete ten-item SUS module; total twenty survey items before any optional fault task.
- `questions=0|1`, `sus=0|1`, and `scales=0|1` retain their existing independent module controls.
- `fault=1`: adds the separate next-day recovery task after baseline questions, plus one optional follow-up when questions are enabled.

The workshop setup selects light when the facilitator selects Trikala. They can still choose demo-only or change the modules. No demographic questions, typed monetary thresholds or additional DCE rounds are added. Completion time is a pilot measurement, not a promised duration.

## How to interpret the evidence

The charging-window, reserve, contract, opt-out and stop actions provide context for discussion without re-asking each choice in the questionnaire. Those actions and answers are currently held only in memory; no new analytics or event collection is introduced. A future approved implementation must define the instrument version, missing-value categories, baseline/fault phases and app-event schema before enabling collection.

The offers still change payment and permission together. One practice choice, intention ratings and a main-reason response cannot identify monetary WTP/WTA or an independent control effect. Match the exact T1.2 questionnaire and levels before using this route to pretest a formal DCE. The optional fault follow-up describes a perceived change and does not establish causality.

Next validation: cognitively test the words, check actual completion time and skipping, confirm that the notice and checkpoint appearance are clear, and revise only items with a defined evidence purpose. Compare the shared wording and response formats with Tampere/Oxfordshire before field use; those two app routes are unchanged by this round.
