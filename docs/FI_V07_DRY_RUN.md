# Finland fleet v0.7 dry run

## Scope
v0.7 keeps the v0.6 positioning/winter flow and redesigns the operational time window plus screens 3/6 and 4/6.

## Safety
- Research collection remains disabled for the preview.
- No free text or D1 binding is required for this dry run.
- All power, SoC, demand, RES, price and compensation values shown in v0.7 are illustrative interface-scenario values, not measured Tampere data or a final tariff/contract.

## 2/6 availability
- Planned stop displays 75 min.
- Availability note displays 15:30–16:45.
- Next delivery remains by 17:00.

## 3/6 V2G agreement
- Heading explains V2G conditions rather than a 12-minute one-off offer.
- Screen explicitly states that the organisation-level V2G agreement is assumed already in place.
- Protected departure reserve = 65%.
- Early vehicle return is allowed.
- Battery protection and mobility-first rule are visible.
- Illustrative credit = 0.25 EUR/kWh and is clearly labelled as a workshop contract assumption.
- Participant still answers how an individual activation should be authorised.
- Participant rates acceptability of the V2G conditions.
- No radio or Likert response is preselected.

## 4/6 accelerated activation
- Start state is 15:30 / 55% SoC.
- Animation lasts about 20–21 seconds.
- Charge phase visibly shows grid -> battery.
- Battery rises to about 72% before V2G.
- V2G phase starts around simulated 16:00 and visibly reverses energy direction battery -> grid.
- Export rises to 3.6 kWh.
- Illustrative V2G credit rises to EUR 0.90.
- SoC never goes below the protected 65% reserve.
- Charging resumes after V2G and final SoC is 70%.
- Vehicle is ready around 16:40, before the 16:45 availability window ends.
- Compact 15-minute context strip highlights the active interval and shows illustrative demand, RES availability and price context.
- The price strip is labelled as context only; it is not presented as the V2G compensation rate.
- After the core cycle completes, the energy-flow clarity Likert appears and can be selected.
- Jatka works after the cycle and clarity rating.

## Browser checks
- Firefox: no observer loop, blank screen, or animation reset.
- Safari/mobile: battery, energy counters and 15-minute context remain readable.
- Reduced-motion preference: energy particles are disabled but phase/direction text remains understandable.

## Research interpretation
The v0.7 credit, prices and 75-minute availability window are scenario stimuli for interface testing. Do not treat them as final DCE levels, market data or demonstrator specifications until agreed in the research/technical design.
