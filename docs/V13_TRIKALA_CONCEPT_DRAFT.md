# Trikala V1.3 participant journey — concept for review

Status: design rationale and site-review questions, updated 29 September 2026. The preview now uses a longer daily parking stop, a shared-path pedestrian as the staged guided-parking obstacle, a proposed 22 kW AC-side WPT/V2G class with lower illustrative effective rates, protected departure and example timing/price/renewable cues. A separate fictional contract-card choice and session authorisation precede virtual V2G export. See [DCE round 1](V13_TRIKALA_DCE_ROUND1.md) for hypotheses and identification limits. The numbers and service promises remain assumptions for review. This document does not approve a survey or collection contract.

## Case anchor and design decision

The PULSE project includes a Trikala local host and a passenger-car charging pathway. The internal Part B handoff describes local residents in M1 week-long trials, tariff and renewable-surplus signals, and usability, fairness and trust evidence. [CORDIS PULSE fact sheet](https://cordis.europa.eu/project/id/101270569) provides the project context; it does not specify the operational Trikala tariff, V2G compensation, equipment readiness or app flow. These details need confirmation with the local partners.

**Primary principle:** make participation understandable and reversible. Use one ordinary parked-car stop, with a known next journey, to explain two decisions separately: *when to charge* and *whether to export energy*. A charging-time selection must never grant V2G permission. The participant can decline export and still complete the charging journey.

## Proposed scene and flow

| Moment in one stop | Participant sees and can do | Evidence to observe or ask |
| --- | --- | --- |
| Arrival and WPT start | At a proposed shared daily-parking bay, staged guidance stops when a pedestrian crosses; the participant waits, rechecks the route, and resumes or uses manual arrows. This is not verified obstacle sensing or autonomy. | Is cable-free use helpful? Can a participant interpret alignment, start status, a pedestrian stop and an assisted route? |
| Protect the next trip | Show current battery, intended departure, a protected minimum for that trip and estimated ready time. These are editable workshop values, not telemetry. | Which reserve feels sufficient? Does an automatic schedule feel acceptable only when the next trip is guaranteed? |
| Compare charging windows | In this **same stop**, compare charge now, a later lower-price window and a later high-renewable-availability window. Each card shows estimated start, ready time, protected reserve, illustrative cost and a labelled renewable signal. An infeasible window must be unavailable or prompt a charge-now fallback. | Can people distinguish price from renewable availability? Would they shift timing, and what inconvenience or uncertainty changes that decision? |
| Watch a chosen session | A short animated timeline shows waiting, grid-to-car charging, reserve reached and ready-to-leave. The chosen window affects time and illustrative price/renewable indicators, while the reserve constraint remains visible. Allow early departure and an explicit stop. | Does the status match the participant's expectation? Is waiting understandable, predictable and reversible? |
| Separate V2G offer | Only when charge exceeds the reserve and the car remains parked through the 15:00–16:00 example window, compare two hypothetical contract cards and No export. Selecting a card does not grant session permission. A separate opt-in shows vehicle → grid, illustrative gross compensation versus replacement energy, and an immediate Stop. | Do participants distinguish a contract preference from a session command, gross from net value, and the right to override? What terms feel fair? |
| Recovery | A hot-weather or charger-start delay interrupts this same stop. Show what happens to the next-trip reserve and the selected plan, then offer retry, charge now if feasible, stop/leave or contact support. Do not silently switch to export or a higher-cost schedule. | Which fallback retains trust and autonomy? Who bears delay or cost, and how could someone without the app participate? |
| Optional reflection | Case-specific understanding and short experience probes, then the shared SUS for direct users and common confidence, trust, WPT/V2G intention and fairness items when enabled. | Compare across sites while preserving Trikala-specific reasons for timing, opt-in and economic value. |

The first demonstration uses mock signals and a fixed, disclosed battery/charging example. It does not imply that renewable availability proves the physical source of delivered electricity. Charging costs and gross export payment are separate; battery wear, losses and fees remain unknown. The values now shown are explicitly labelled fictional workshop placeholders, to be replaced only after site confirmation.

## Evidence map for workshop probing

| Design question | On-screen task or question | Construct / downstream use |
| --- | --- | --- |
| Is the charging opportunity useful for an everyday stop? | Complete alignment and compare the ready time with departure. | Operational fit, effort, WPT usefulness and failure recovery. |
| Do tariff and renewable cues make sense separately? | Ask why the participant chose a window; check whether price and renewable signal were interpreted correctly. | Comprehension, price/RES responsiveness and HMI requirements. |
| Is participation voluntary and controllable? | Ask for explicit V2G consent, then ask the participant to stop export; compare the declined path. | Permission, autonomy, override and V2G intention. |
| What economic value is credible? | Ask the participant to distinguish charging cost from export compensation and identify missing battery information. | Perceived value, battery concerns and fair terms. |
| Who is included or left out? | Discuss app access, payment method, car/charger eligibility, language, other bay users and an assisted/non-digital route. | Digital access, distributive and procedural fairness, local service design. |
| What happens when a plan fails? | Interrupt charging before the reserve is reached, then observe the selected fallback. | Predictability, service trust, actor responsibilities and recovery. |

These are proposed cognitive-testing probes, not a tariff-elasticity estimate or a validated DCE. The broader programme's survey/DCE can test trade-offs across attributes separately; a single scripted app choice cannot estimate population preferences.

## Decisions to resolve with Trikala partners before building numbers or claims

1. Which physical parking and WPT interaction should the screen represent, and which parts are actually intended for the local pilot?
2. Which tariff unit and renewable signal can be shown honestly, at what refresh rate, and who supplies/controls them?
3. Is a V2G offer part of the first participant workshop or a separate concept card? What compensation, battery-impact information and actor responsibilities may be shown?
4. What departure/reserve range and charging power make the example feasible? What happens if a later window cannot satisfy it?
5. Which participant and non-digital routes, accessibility needs and Greek-language wording will be tested first?

Keep the V1.2 RC1 Worker untouched. The first interaction is on the isolated V1.3 preview, with collection disabled. Review the scenario assumptions, equipment, numbers, recovery promises, accessibility, translations and research contract before any participant data collection.
