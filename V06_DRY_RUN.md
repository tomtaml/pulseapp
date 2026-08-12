# v0.6 Tampere fleet dry run

Collection remains disabled. Test with `?variant=fi-fleet&workshop=TAMPERE-S4&demo=1&surface=snow`.

## 1/6 positioning
- Top view is visible and readable on phone.
- Parking assistant is tried first and stops because winter obstruction/edge marking cannot be verified.
- Manual controls require approximately two rightward corrections.
- Wrong-direction taps do not advance alignment and produce clear feedback.
- Alignment bands progress 62% -> 82% -> 96%.
- Charging-readiness wording is understandable and does not claim a measured Tampere power value.
- Both alignment clarity and manual fallback acceptability are answered deliberately.

## 2/6 operational limits
- Planned stop is shown as 60 min.
- Current SoC 55%, protected reserve 65%, and departure 17:00 are clearly illustrative.
- Participant understands who may own the reserve rule.

## 3/6 V2G decision
- Offer is clearly conditional on mobility requirements.
- V2G period is about 12 min and export about 4 kWh.
- <=22 kW class is explicitly an illustrative workshop assumption, not a final demonstrator specification.
- Authorisation and pre-use acceptance are separate questions.

## 4/6 cycle
- Accelerated clock runs from 15:30 to 16:12 in about 10.5 seconds.
- 15:30-16:00 shows grid -> vehicle charging.
- 16:00-16:12 visibly reverses to vehicle -> grid V2G.
- Final state is 66%, above protected 65% reserve.
- Summary is internally consistent: +10.1 kWh to vehicle, -4.0 kWh to grid, +6.1 kWh net.
- Driver context uses qualitative demand / renewable availability rather than detailed market data.
- No dominant permanent emergency button appears in the standard run.

## 5/6 winter disruption
- Fault continues the same snow/slush positioning story.
- Recovery alternatives and decision ownership feel realistic for delivery operations.

## 6/6 comprehension
- Existing three items are unselected initially.
- Fourth winter-disruption comprehension item appears and must be answered.

## Evaluation
- SUS remains unchanged and all ten items require deliberate answers.
- Final fleet trust/acceptability items remain role-relevant.

## Browser checks
- Firefox: complete route without freezes.
- Safari: complete route without freezes.
- Mobile portrait: no clipped controls or hidden questions.
- FI/EN switch: v0.6 additions update language coherently.
