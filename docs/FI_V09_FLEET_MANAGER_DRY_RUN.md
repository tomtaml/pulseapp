# Finland fleet v0.9 fleet-manager / organisation dry run

## Scope
v0.9 keeps the driver and dispatcher routes and adds a genuinely different route when the participant selects `Kalustopäällikkö` / `Fleet manager`.

## Safety
- Research collection remains disabled.
- No D1 binding or free text is required.
- Existing core field names are reused only for UI dry-run compatibility.
- Procurement, SLA, contract and accountability variables must receive role-specific names before live collection.

## Role routing
- `Kuljettaja`: existing driver route.
- `Ajojärjestelijä / operointi`: dispatcher route.
- `Kalustopäällikkö`: new v0.9 procurement/service-contract route.
- Fleet manager must not perform the driver's positioning task.

## 1/6 service requirements
- Shows four baseline requirements: mobility protection, battery protection, winter fallback, verifiability.
- No top-view/manual manoeuvring is visible.
- One 1–5 item asks whether the baseline requirements are clear enough to evaluate the service.

## 2/6 operational service level
- Uses the same Tampere delivery scenario as a concrete service-level case.
- Reserve governance is framed as a contract + operations rule, not a private driver preference.
- Clarity item asks whether the information is sufficient to define service level and mobility guarantee.

## 3/6 V2G agreement
- One compact manager-specific agreement card.
- Shows protected reserve, zero delivery delay, early recall, battery protection, accountability/verification and illustrative compensation.
- Compensation 0.25 €/kWh is a UI stimulus only, not a market price or Tampere commitment.
- Main decision: how individual activations should be governed within the fleet agreement.
- Acceptance item is organisation-level contract acceptability.

## 4/6 service evidence
- Reuses the accelerated charge -> V2G -> recharge animation as a concrete service record.
- Adds an SLA-evidence note: departure readiness, energy flows, activations/overrides, faults/recovery.
- Explicitly states that one successful session does not demonstrate long-run reliability.
- Rating asks whether the reporting is clear enough for an individual-session SLA check.

## 5/6 winter risk / accountability
- Safe winter interruption remains 67% battery / 65% protected reserve / 25 min to next delivery.
- States explicitly that 65% is sufficient for the assigned delivery in the scenario.
- Primary-rule choices: one retry then fallback; protect delivery; provider incident + SLA log; depot fallback + failed-session record.
- Accountability choices focus on provider, fleet organisation, shared interface, or named SLA owner.

## 6/6 comprehension
- Vehicle may be recalled early.
- V2G cannot continue below protected reserve.
- V2G activation is allowed only when reserve and next-delivery deadline remain protected.

## SUS and post-use
- Standard 10 SUS items remain unchanged.
- Post-use constructs are rewritten for procurement/service relevance: winter reliability, predictability, organisational control, accountability/fallback, wireless deployment intention and V2G contract acceptance.

## Browser / stability
- Firefox and Safari complete the fleet-manager route without observer loops.
- Driver positioning UI does not flash or remain visible on manager 1/6.
- Back navigation retains the fleet-manager route.
- Driver and dispatcher routes still complete on the same branch.

## Research note
Before enabling collection, create a measurement dictionary that distinguishes driver, dispatcher and fleet-manager constructs rather than interpreting shared compatibility field names as equivalent measures.