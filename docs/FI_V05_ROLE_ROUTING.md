# Finland / Tampere v0.5 role routing

## Principle

The Pilot App is a modular research instrument, not one identical exercise for every stakeholder. The participant role selected after consent determines the intended route.

## Fleet routes

### Fleet driver — full operational route

Use the full delivery-stop simulation:

1. approach / alignment
2. next-delivery constraints
3. V2G authorisation
4. accelerated charging + V2G cycle
5. winter disruption and override
6. comprehension
7. SUS
8. fleet trust and acceptance

Primary evidence: alignment clarity, charging/V2G choice, override, fault recovery, comprehension, SUS and trust.

### Dispatcher / operations — operations-control route

Do not ask the participant to pretend to steer the vehicle. The interface should show the driver/vehicle alignment state and operational consequences.

Primary decisions:

- departure deadline and protected SoC
- vehicle availability
- delay tolerance
- V2G authorisation / escalation
- disruption response
- responsibility allocation

SUS should only be used if the prototype genuinely represents an operations interface.

### Fleet manager / organisation — governance route

Use a short operational walkthrough, then focus on:

- required charging-start reliability
- maximum acceptable operational delay
- protected battery / departure guarantee
- V2G authorisation model
- compensation / benefit allocation
- liability and fault responsibility
- procurement / service-level conditions

Do not use the driver SUS by default.

### Other implementation stakeholder

Use the operational prototype mainly as a concrete discussion stimulus. Record siting, responsibility, fallback, permissions, grid/data and implementation issues in the SRF register.

## Citizen / accessibility routes

Keep `fi-citizen` separate from fleet-operational choices.

Citizen / road-user evidence:

- wireless and V2G comprehension
- public-space acceptability
- visible energy flow and consent
- safety and responsibility
- accessibility and fairness

For mobility-limited / older / vulnerable participants, observe unaided use and use SUS only when the tested interface is genuinely relevant to them.

## Scenario conditions

Conditions such as `clear`, `snow` and `slush` are experimental/workshop conditions. They should not be selected by the participant.

Current URL pattern:

`?variant=fi-fleet&workshop=TAMPERE-S4&demo=1&surface=snow`

Planned condition dimensions:

- surface: clear / snow / slush
- alignment assistance: automatic available / automatic unavailable → manual guidance
- delivery pressure: low / medium / high
- grid signal: moderate demand / peak demand
- renewable share: illustrative time-varying value
- V2G contract: explicit driver confirmation / fleet pre-authorisation / dispatcher authorisation / automatic with override

All technical and grid values used in the workshop prototype are illustrative scenario values unless explicitly replaced with validated pilot data.

## v0.5 UI changes

- surface is shown as an assigned scenario condition rather than a participant choice
- automatic parking assistant can stop under obstructed winter conditions, requiring manual guidance
- charging cycle receives a sped-up simulated clock
- electricity demand and renewable share vary over the simulated cycle
- V2G is linked visually to a high-demand / lower-renewable-share period
- the override control is contextual and hidden after the cycle is complete
- role profiles are now explicitly defined in `public/js/role-routes.js`

## Next implementation step

Wire the role profiles into the screen router so that `fleet_driver`, `dispatcher` and `fleet_manager` no longer receive identical downstream tasks. The driver route remains the reference implementation; dispatcher and fleet-manager routes should be built as genuinely different interfaces rather than relabelled driver questions.
