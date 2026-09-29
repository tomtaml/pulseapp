# Trikala V1.3: first offer experiment and virtual WPT/V2G round

Status: **cognitive pretest design**, 29 September 2026. This is not the approved T1.2 questionnaire, an efficient DCE design, a real tariff, a fitted preference model or evidence of willingness to pay/accept. The exact T1.2 survey instrument and attribute levels are not in this repository. Align wording and levels with that source before field use.

## Why this round

The internal [Part B handoff](HANDOFF_APP_SRF_PIPELINE.md) describes two T1.2 DCE purposes: a technology choice involving dwell, tariffs, renewable share and incentives; and a transport choice involving trip, parking and charging decisions. It proposes, as an *implementation interpretation*, a programme/contract choice and an episode choice. Trikala is a useful concrete setting for both: a passenger car parked for a workday, wireless positioning, a known next trip, and a separate opportunity to return energy to the grid. This app round tests whether participants understand the offers and can use the controls before formal survey levels are fixed. The project [CORDIS fact sheet](https://cordis.europa.eu/project/id/101270569) supports a low-power static bidirectional WPT research context, not any specific Trikala equipment or compensation.

## Highest-priority hypotheses to take into T1.2 design

These are **testable hypotheses**, not findings. Directional predictions require an actual DCE with independently varied attributes and an opt-out.

| ID | Formal experiment and contrast | Directional hypothesis | What the app can probe now |
| --- | --- | --- | --- |
| T-W1 | Technology/episode: otherwise equivalent wireless versus conductive service at varying session price or fee | Some drivers will pay a positive premium for cable-free positioning, conditional on reliable alignment and no loss of readiness. | Can they complete a shared-bay positioning task and identify the same departure outcome? A formal WTP estimate needs multiple randomized price differences and a wired comparator. |
| T-W2 | Technology/episode: vary total session cost, start/ready time, and a properly defined RES-availability signal across feasible windows | Lower cost and a ready time compatible with the trip increase the probability of choosing a window; a RES cue may have additional value when its meaning is understood. | Can users distinguish price from RES availability and recognize an infeasible departure? Do not describe a signal as proof of the electricity's source. |
| T-A1 | V2G contract: vary compensation per exported kWh (or per available parking day) while holding export energy, reserve, control and risk terms constant | Higher credible compensation raises V2G participation; a no-export alternative identifies the accept/reject margin. | Can users distinguish gross payment, recharge cost and unknown wear/fees? The app's single pair cannot estimate WTA. |
| T-A2 | V2G contract: independently vary each-session confirmation versus standing opt-in with notice, both with immediate stop and no penalty | Many users will value direct control; the amount required to accept the less hands-on control model may differ by participant. | Can they tell a hypothetical contract selection from permission for the current session, then stop an active export? |
| T-A3 | V2G contract: independently vary the guaranteed departure SOC/time, battery-impact assurance, and the named actor responsible for failure, within feasible combinations | Stronger mobility and battery protection can lower required compensation, but their relative importance is an empirical question. | Can users identify the protected floor, the unresolved battery cost and who they would contact if a promise fails? |

Do not infer monetary thresholds from a single scripted app choice or from SUS/trust ratings. A formal DCE needs non-dominated feasible choice sets, a genuine no-export/status-quo option, balanced variation, pilot priors, order checks and the approved sample. Price units and recall period must be consistent. Model WTP/WTA from estimated utility coefficients only where the money attribute is identified and the design/scale assumptions support it. Treat EV owners, non-EV drivers and digital-access groups separately where the T1.2 protocol permits, without converting this app into a demographic questionnaire.

## One app practice choice (what is built)

The single stop assumes arrival 08:45, an illustrative 60 kWh usable battery at 45%, target 80%, and a participant-selected minimum of 60–80%. Departure is 14:15 or 17:30. A proposed **22 kW AC-side equipment class is only a ceiling**, while this example models 10.5 kW effective charging and 3 kW export. A 21 kWh charge takes two illustrated hours; the car remains parked beyond that. The start-delay stress test adds 30 minutes. The earlier departure can rule out the late RES window or the 15:00–16:00 export opportunity. No vehicle, charger, grid, market signal, payment or support endpoint is connected.

After charging, if the selected reserve and departure allow a 3 kWh cap, the participant sees two hypothetical *contract* cards and a no-export option:

| Term for this practice task | Offer A | Offer B | No export |
| --- | --- | --- | --- |
| Gross compensation | €0.18 per exported kWh; up to €0.54 for 3 kWh | €0.30 per exported kWh; up to €0.90 for 3 kWh | €0 |
| Permission arrangement | Confirm each session | Standing opt-in with notice | No participation |
| Shared protection | Same chosen minimum, 3 kWh cap, departure guarantee; stop anytime without a fee | Same protection | Keep the charged energy |
| Exclusions | Battery wear, losses, fees and liability unresolved | Same exclusions | No export costs or benefit |

The two cards intentionally trade a higher gross rate against the permission arrangement. **Their attributes are confounded in this one task.** The choice is a comprehension and language probe, not a treatment effect or WTA estimate. Selecting A or B does not turn on export: the user must separately press *Allow this session's V2G*. They can stop while energy flows. The example ledger keeps charging cost, exported kWh, gross payment and hypothetical replacement energy separate. Choosing No export completes the task without sharing.

The approved session follows charging on the same parked-car timeline. Four
accelerated checkpoints represent 15:00–16:00 at an illustrative 3 kW, totaling
3 kWh for a 65% minimum and 17:30 departure. Reverse flow, charge, kWh and gross
credit update together. Participants may pause, advance one checkpoint, resume
or stop; continuing to questions requires finishing or stopping this period.
The 14:15 departure and 80% minimum are deliberate no-export cases and are
explained when selected. A completed or stopped session retains its illustrated
ledger; it does not imply a grid dispatch or real payment.

Facilitator probes: “What decided your choice?”, “What would have to change for you to choose the other offer or No export?”, “Which amount is gross and what is missing from it?”, “Who can stop today's export?”, “Would the guarantee still feel credible if the car must leave early?”, “How could someone without a smartphone use or decline the service?” Record these only under a separately approved workshop method; the preview stores no answers.

## Later formal DCE design decisions

1. Reconcile the exact T1.2 survey wording, intended WPT/WPT+V2G alternatives, money units, choice-set count and attribute levels with the approved instrument. Use this app to pretest comprehension, not to silently replace it.
2. Choose whether compensation is an availability payment, an energy credit, or both. Specify billing interval, export frequency and what happens when no grid request arrives. Hold expected export quantity comparable across offers when testing payment or control.
3. Set battery warranty, losses, recharge price, tax/fees and failure responsibility transparently. A gross credit is not a net gain; make reserve/departure combinations technically feasible.
4. Use a connected DCE design that varies payment, permission and guarantees independently across tasks, with a no-export option and candidate dominance/attention checks. Pilot the words and levels, then assess design balance and precision before collecting preference data.
5. Confirm whether a 22 kW AC-side bidirectional WPT class is appropriate to this demonstrator and what vehicle-side/reverse rates can be claimed. [SAE J2954 (2024)](https://saemobilus.sae.org/standards/j2954_202408-wireless-power-transfer-light-duty-plug-electric-vehicles-alignment-methodology) covers current light-duty stationary wireless charging in the forward direction up to 11 kVA; 22 kVA and bidirectional provisions are described as future revisions. A project-specific bidirectional prototype therefore needs its own verified specification and safety/interoperability evidence. This app claims none.

## Protected boundaries

The new interaction is available only on the V1.3 preview branch. The current GR research payload does not include these contract terms, chosen minimum, parking events or practice choice. Even on a collection-enabled host the focused GR route resolves to instrument-preview and refuses research submission. The V1.2 partner RC1 Worker is unchanged.
