# PULSE v1.3 shared utility clock

Design target for the next branch:

- one server-authoritative workshop clock shared by all QR sessions;
- six 15-minute scenario phases: 15:30, 15:45, 16:00, 16:15, 16:30, 16:45;
- about 20 real seconds per simulated 15-minute phase in workshop mode;
- utility summary returns current simulated time, demand index, RES index, illustrative price and operating intent;
- each QR session keeps its own arrival SoC, protected reserve, route need and dwell profile;
- utility phase influences whether a session should charge, hold, offer V2G, export, restore reserve or prepare departure;
- docking/alignment/fault states remain participant/session driven and take precedence over utility orchestration;
- utility dashboard shows shared clock, demand/RES/price graph, aggregate power, session states and a small event log;
- research responses remain outside the operational registry; charging commands remain mock-only.

This document is a design marker before implementation on `prototype-v1.3-utility-clock`.
