# Finland fleet v0.7.1 dry run

## Scope
v0.7.1 is a UI refinement on the existing `prototype-v0.7` branch. It does not change research field names or enable collection.

## 3/6 V2G agreement
- Fleet V2G agreement is explicitly already in place.
- Main participant view is reduced to four guarantees: protected reserve, vehicle availability, early return and battery protection.
- Agreement-level and activation-level duplicate explanation boxes are hidden.
- Technical ≤22 kW assumption is removed from the main participant view.
- Illustrative compensation remains visible but is labelled as a workshop contract assumption.
- Participant question is simplified to: who should authorise an individual V2G activation?
- Pre-use V2G acceptability remains required and unselected by default.

## 4/6 replay
- After the cycle completes, a `Katso jakso uudelleen / Replay the cycle` control appears.
- Replay runs the same ~21 s visual sequence without resetting previous participant responses or the core research state.
- Replay temporarily disables Continue while the visual cycle is running.
- Charge -> V2G -> recharge/ready direction, SoC, energy, credit and active 15-minute context should all move again.
- At replay completion, Continue is enabled and the final state is restored.

## 5/6 winter fault
- Heading is `Talviolosuhde keskeyttää langattoman latauksen`.
- Failure is a safe charging interruption rather than implying that the parked vehicle physically moved off the pad.
- Stimulus states that heavy snow/slush prevent the system from verifying the charging area and safe energy transfer.
- Decision context shows battery now 67%, protected reserve 65%, and 25 min to departure.
- Recovery choices are distinct: one retry, leave now without retry, remain parked/contact support, or continue route and plan depot charging.
- Decision-owner question is unchanged.

## Safety
- Collection remains disabled.
- No D1 binding or free text required.
- SoC, timing, compensation and technical context remain illustrative workshop values.
