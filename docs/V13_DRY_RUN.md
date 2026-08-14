# PULSE v1.3 shared utility clock dry run

## Safety
- Research collection remains disabled.
- Charging commands remain disabled.
- Shared registry contains only synthetic operational session state.
- Price, demand and RES values are illustrative workshop scenario signals.

## Shared clock
1. Open utility view for `TAMPERE-S4` before any QR session: clock should wait at 15:30.
2. Open first participant URL with `ops=1`: utility clock starts at 15:30.
3. One simulated 15-minute interval lasts about 20 real seconds.
4. Clock advances 15:30 → 15:45 → 16:00 → 16:15 → 16:30 → 16:45 and then stays at 16:45.
5. All active QR sessions show the same simulated utility time.

## Utility view
- Demand, RES availability and illustrative price graph shares the same current-slot highlight as the clock.
- Session table shows assigned route/SoC/reserve/dwell profiles and a session-specific utility recommendation.
- Aggregate charging/V2G power changes as participant sessions update.
- Event log shows arrivals, state changes and utility-clock interval changes.

## Participant app
Use `?variant=fi-fleet&workshop=TAMPERE-S4&demo=1&ops=1&dev=1`.
- 3/6 and 4/6 show the shared utility signal.
- The signal card shows this session's current SoC, protected reserve, route need and dwell.
- In 4/6 the manual reference-cycle button is hidden in shared-clock mode.
- The visible market strip follows the server utility clock.
- A vehicle below protected reserve charges even during a peak period.
- Only an eligible vehicle with sufficient buffer should export during 16:00/16:15.
- 16:30 restores departure buffer; 16:45 releases a vehicle once protected reserve is satisfied.

## Known prototype boundary
The utility clock is automatic and unauthenticated controls are intentionally not exposed. A future authenticated operator interface may add pause/advance/reset controls for field-pilot testing.
