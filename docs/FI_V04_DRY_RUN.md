# Finland fleet v0.4 dry-run

Use the `prototype-v0.4` Cloudflare preview with collection disabled.

Recommended route:

`?variant=fi-fleet&workshop=TAMPERE-S4&demo=1`

## 1/6 Approach & alignment

- Vehicle starts visibly misaligned.
- Snowbank / constrained bay is understandable without explanation.
- Guided manoeuvre and automatic alignment feel meaningfully different.
- Alignment percentage/instruction changes are understandable.
- Participant cannot continue until alignment is completed and clarity is rated.
- Note whether the control should be driver-facing, vehicle-HMI-facing or primarily automated.

## 2/6 Next-delivery constraints

- Scenario clearly feels like fleet work rather than private EV ownership.
- Next delivery, 14 km, departure time, current SoC, guaranteed SoC and dwell time are understandable.
- Illustrative values are clearly labelled as workshop values.
- Ask facilitator to note whether the guaranteed reserve should be owned by fleet policy, dispatcher, driver or a shared rule.
- Check whether an explicit `need vehicle earlier` control should be added in the next iteration.

## 3/6 V2G authorisation

- V2G decision appears before execution.
- Maximum export, protected reserve, departure impact and illustrative compensation are understandable.
- Four authorisation models are credible for the participant role.
- Capture whether different role-specific versions are needed for driver / dispatcher / fleet manager.

## 4/6 Virtual charging + V2G cycle

- Start the simulated cycle and observe all three phases: charge → V2G export → ready to leave.
- Energy direction visibly reverses during V2G.
- Energy-to-vehicle, energy-to-grid and net-energy counters are understandable.
- `Leave now / stop V2G` remains visible and understandable.
- Test both completing the full cycle and using the override.
- Confirm that all numbers are perceived as simulated, not live technical promises.

## 5/6 Snowstorm recovery

- Scenario feels plausible under Tampere winter logistics pressure.
- Choices are operationally distinct: retry (+3 min), depart now, contact dispatch/support, charge later at depot.
- Responsibility question is useful and not redundant with the operational action.
- Record missing choices suggested by drivers/operations staff.

## 6/6 Comprehension

- Questions can be answered from the scenario just experienced.
- Q1 tests early departure / override understanding.
- Q2 tests protected-reserve understanding.
- Q3 tests actual recognition of the V2G/export phase.

## SUS

- No item is preselected.
- All ten exact SUS items are visible and usable on mobile.
- Bottom actions do not cover item 10.
- Test whether one long page is acceptable or whether a 5+5 presentation is preferable without changing item order/scoring.

## Fleet trust & acceptance

Check whether each item is meaningful for the participant's actual role:

- delivery reliability
- predictability of battery outcome
- control / override
- failure recovery and responsibility
- wireless charging use intention
- V2G acceptance under guarantees

The fleet route should not be interpreted as a private car-owner adoption questionnaire. Fleet-organisation decisions (procurement, contract, compensation, liability) and operational decisions (use opportunity, permit V2G, override/depart) should remain distinguishable.

## Safety

- `COLLECTION_ENABLED=false`
- `FREE_TEXT_ENABLED=false`
- no D1 binding
- all technical/market values are illustrative workshop scenario values
