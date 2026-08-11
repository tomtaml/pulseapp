# PULSE Pilot App — v0.3 site-specific workshop design

This document defines the next workshop-sandbox design before implementing the full site-specific UI. The goal is to keep a **common research shell** across sites while exposing only the decisions that are meaningful for each demonstration.

## Language and route architecture

| Route | Default language | Optional fallback | Primary participant context |
|---|---|---|---|
| `fi-fleet` | Finnish | English | N1 fleet driver / dispatcher / fleet manager in Tampere |
| `fi-citizen` | Finnish | English | Citizen, nearby road user, accessibility/vulnerable-group reviewer of the Tampere public-space use case |
| `gr-passenger` | Greek | English | M1 passenger-EV user / resident in Trikala |
| `uk-v2h` | English | — | Disabled driver / carer using accessible wireless charging and V2H in Oxfordshire |

The QR should normally pre-select the route and local language. Participants should not have to choose the demonstration site from a generic map before starting the workshop task.

## Common interaction shell

The current five-screen visual concept is a strong base, but the content should be adapted by route.

1. **Welcome, research notice and accessibility controls**
   - workshop sandbox, no live payment
   - anonymous/pseudonymous research wording as approved
   - text size / high contrast / plain-language mode
   - language switch only where useful

2. **Scenario and participant perspective**
   - site/use case already selected by the QR
   - broad role only; no employer or identity
   - short plain-language explanation of wireless charging and V2X

3. **Session setup**
   - only the attributes the participant could realistically understand or influence
   - mobility need / departure requirement always protected
   - explicit V2G or V2H control where relevant

4. **Virtual charging session + one stress/fault event**
   - show the most important live status information
   - give a meaningful control / override choice
   - capture task interaction separately from later attitude ratings

5. **Post-task evaluation**
   - comprehension check
   - exact 10-item SUS in the local language
   - trust and responsibility
   - wireless-charging acceptance
   - V2G/V2H participation or public-space acceptability as appropriate

SUS should always follow hands-on use of the prototype rather than being shown before the interaction.

---

# Finland — fleet / N1 delivery (`fi-fleet`)

## What the participant is deciding

A fleet driver, dispatcher or fleet manager is dealing with a real operational constraint: **can the vehicle charge and optionally participate in V2G without jeopardising delivery work?**

## Recommended visual elements

### A. Guided docking / winter alignment
- top-down van + wireless pad graphic
- alignment confidence / status ring
- snow, slush or partially obscured bay marking
- message such as `Vehicle detected — move 15 cm left`
- simple `Alignment confirmed` state

### B. Delivery requirement card
- current SoC
- minimum required departure SoC
- required departure time
- dwell time available
- optional route-pressure indicator: `next delivery in 55 min`

### C. V2G offer card
- explicit opt-in
- estimated compensation / tariff value
- renewable / CO2 signal
- guaranteed departure SoC
- `Emergency departure always available`
- optional setting: `confirm every V2G event` vs `allow automatic V2G within my limits`

### D. Live session dashboard
- Charging / V2G / Paused status
- current SoC and projected departure SoC
- time remaining
- energy flow direction visual
- compensation accumulated in the scenario
- winter/alignment status

### E. Fault / stress event
Example: charging fails to start because alignment deteriorates or snow partly covers the reference area.

Ask what should appear first:
- retry / re-align
- emergency departure
- support / responsible party
- alternative charger

## Post-task measures
- alignment clarity
- plan comprehension
- successful-start / reliability expectation
- perceived operational control
- trust that minimum SoC is protected
- wireless acceptance
- V2G willingness
- SUS

---

# Finland — citizen / vulnerable groups (`fi-citizen`)

This route should use the **same visible Tampere delivery-van service**, so citizens are evaluating the real public-facing concept, but it should not pretend that they make fleet-operational decisions.

## What the participant is deciding

`Do I understand what this system is doing, does it appear safe and controllable in public space, and would I accept wireless V2G being used here?`

## Recommended visual elements

### A. Public-space scenario
- delivery van parked over an in-road wireless pad
- pavement / cycle / nearby pedestrian context
- minimal visual explanation of where the charging hardware is
- visible accessible route around the bay

### B. Plain-language explainer
Three short cards:
1. `The vehicle charges without a cable.`
2. `With permission, it can briefly return electricity to the grid.`
3. `The driver can always protect the required battery level and leave.`

### C. Safety and responsibility drawer
- What happens if charging fails?
- Who operates the charging service?
- What does the driver control?
- short EMF / safety information using approved wording

### D. Accessibility controls are part of the test
- large text
- high contrast
- plain-language mode
- keyboard/screen-reader structure
- optional facilitator-assisted mode

### E. Public acceptance prompt after the walkthrough
Keep separate ratings for:
- wireless charging in this public-space setting
- V2G in this public-space setting
- clarity of responsibility
- perceived safety
- accessibility / understandability
- perceived fairness / public benefit

Do **not** ask citizens to choose fleet compensation, dispatcher settings or delivery constraints as if those were their decisions.

## Post-task measures
- comprehension
- SUS
- trust
- accessibility understanding
- wireless acceptance
- V2G public acceptability
- public-space fairness / burden-benefit question

---

# Greece — Trikala passenger transport (`gr-passenger`)

## What the participant is deciding

A resident using an M1 passenger EV decides **when and under what tariff / renewable-energy conditions to charge or participate in bidirectional charging without compromising the next trip**.

## Recommended visual elements

### A. Charger / session scenario
The map/list visual from the concept slide is most useful here.

Show a small set of fictional alternatives around the Trikala Mobility Hub, e.g.:
- `Wireless PULSE bay — available`
- `Conventional public charger — available`
- `Charge later / off-peak window`

Avoid implying that these are real current chargers unless the field site is confirmed.

### B. Trip-need setup
- current SoC
- next trip / departure time
- minimum departure SoC
- expected parking time

### C. Tariff + renewable-energy gamification
- current price band
- next cheaper period
- RES share now / later
- simple projected saving
- optional reward / benefit indicator

The participant can choose:
- charge now
- wait for cheaper / greener period
- allow automatic optimisation within constraints
- opt into / out of V2G

### D. Live session dashboard
- SoC
- session time
- current tariff
- RES share
- charging/V2G status
- cost / saving estimate
- next-trip reserve guarantee

### E. Hot-weather condition
Use a simple non-alarmist status element such as:
- `High ambient temperature — charging operating normally`
or, in a stress scenario,
- `Charging power temporarily reduced to protect the system`

## Post-task measures
- tariff comprehension
- RES / CO2 comprehension
- trust in automated optimisation
- perceived fairness of incentives
- wireless acceptance
- V2G participation
- SUS

---

# UK — Oxfordshire accessible V2H (`uk-v2h`)

## What the participant is deciding

A disabled driver or carer needs **hands-free charging that protects mobility first**, while optionally allowing the vehicle to support the home.

## Recommended visual elements

### A. Accessibility-first welcome
Before the scenario:
- large text
- high contrast
- screen-reader-compatible structure
- voice-assist concept / audio prompt placeholder
- `Driver` / `Carer` perspective
- plain-language mode

### B. Reserved disabled-bay scenario
- accessible on-street bay
- wireless pad
- domestic connection / home icon
- fallback conductive gully shown as contingency, not the default interaction

A generic charger map is less important here than showing **the physical accessibility benefit of cable-free charging**.

### C. Mobility + home reserve setup
- current vehicle SoC
- minimum travel reserve
- next-trip time
- optional home-support period
- simple household load state

### D. V2H offer
- `Support the home until 18:00`
- guaranteed vehicle reserve
- current / expected tariff
- `Stop V2H now` large control
- `Leave now` / emergency override always visible

### E. Live energy-flow visual
Use a very simple flow:

`Grid ↔ Home ↔ Vehicle`

Clearly highlight the current direction and the protected vehicle reserve.

### F. Accessibility fault / fallback scenario
Example: wireless charging does not start.

Possible actions:
- retry alignment
- leave immediately
- request assistance
- use fallback conductive gully

The test should reveal whether the fallback itself recreates an accessibility barrier.

## Post-task measures
- ability to understand status without assistance
- perceived physical accessibility
- trust that mobility reserve is protected
- confidence in fault handling
- wireless acceptance
- V2H willingness
- SUS

V2G can remain a secondary future-service concept, but the primary Oxfordshire workshop flow should remain V2H so the participant task stays coherent.

---

# Cross-site design rules

## Keep harmonised across all variants
- 10-item SUS scoring and response scale
- comprehension measured after interaction
- trust / responsibility item family
- separate wireless acceptance from V2G/V2H acceptance
- protected minimum SoC / mobility need
- explicit control and override
- workshop ID + app version for SRF traceability

## Allow to vary by use case
- participant roles
- environmental condition (winter / heat / wet-accessibility context)
- energy-service logic (fleet V2G / passenger smart charging + V2G / V2H)
- tariff and incentive detail
- fault scenario
- acceptance target (operational participation vs public-space acceptability)

## Do not overload the prototype
The workshop app should **not become the full DCE**. It can expose and cognitively test candidate DCE attributes, but the later DCE should randomise controlled choice profiles separately. The app's role is to reveal whether attributes are understandable, credible and decision-relevant before they are fixed in the survey design.

## Proposed implementation sequence
1. Freeze this site-specific screen matrix.
2. Add `gr-passenger` and route-specific role groups.
3. Refactor language handling to `fi`, `en`, `el` with route-specific defaults.
4. Implement the Finland fleet flow first.
5. Implement Finland citizen/accessibility as a closely matched public-facing version.
6. Implement Greece tariff/RES flow.
7. Implement UK accessibility/V2H flow.
8. Run internal mobile dry tests before enabling any research collection.
