# Finland fleet v0.8 dispatcher / operations dry run

## Scope
v0.8 keeps the frozen v0.7.1 driver route and adds a genuinely different route when the participant selects `Ajojärjestelijä / operointi`.

## Safety
- Research collection remains disabled.
- No free text or D1 binding is required.
- Existing research field names are reused only for UI dry-run compatibility; role-specific field naming must be finalised in the measurement dictionary before live collection.

## Role routing
- Selecting `Kuljettaja` leaves the v0.7.1 driver route unchanged.
- Selecting `Ajojärjestelijä / operointi` shows the v0.8 operations route preview.
- Dispatcher route must not show or require the top-view/manual driver positioning task.
- The hidden core alignment state is advanced automatically only to satisfy the current prototype state machine.

## 1/6 vehicle status
- Heading: vehicle arrived at wireless charging bay.
- Shows accepted alignment as system status, not a dispatcher task.
- Shows battery 55%, protected reserve 65%, availability 15:30–16:45, next departure 17:00.
- One visible Likert asks whether the status is clear enough to assess vehicle availability.

## 2/6 operational limits
- 75-minute availability and 17:00 next departure remain consistent with the driver scenario.
- Reserve-authority question is framed around who may change the protected reserve during operations.
- Clarity question asks whether the dispatcher can judge the available energy-service window.

## 3/6 V2G activation governance
- Fleet-level agreement remains assumed in place.
- Main decision is who authorises an individual V2G activation.
- Acceptance item is explicitly about day-to-day dispatch operations.

## 4/6 monitoring
- Reuses the v0.7.1 charge -> V2G -> recharge animation.
- Framing is vehicle availability and predictable departure readiness.
- Energy-flow clarity item is reframed as whether the dispatcher can tell when the vehicle may return to service.
- Replay remains available after completion.

## 5/6 winter interruption
- Driver reports the wireless charging interruption to operations.
- Status remains 67% battery / 65% protected reserve / 25 min to departure.
- Decision item asks what the dispatcher would instruct the driver to do.
- Governance item asks who may make the decision without further approval.

## 6/6 comprehension
- Early recall is allowed.
- V2G cannot continue below protected reserve.
- Individual activation is allowed only while reserve and next-delivery deadline remain protected.

## SUS and post-use constructs
- Standard 10 SUS items remain unchanged.
- Intro states that the participant is rating the operations prototype.
- Final constructs are rewritten for dispatcher relevance: vehicle availability reliability, predictability, operational control, escalation confidence, operations-use intention and conditional V2G acceptance.

## Browser / stability checks
- Firefox: no observer loop on role screen or 1/6.
- 1/6 automatically resolves the hidden driver alignment state in under one second.
- No driver top-view controls flash or remain visible after dispatcher routing settles.
- Back navigation preserves the dispatcher route after reselecting the role.
- Driver route still completes normally on the same branch.

## Research note
Before enabling collection, create role-specific field names in the measurement dictionary and backend schema rather than interpreting driver-labelled storage fields as dispatcher measures.
