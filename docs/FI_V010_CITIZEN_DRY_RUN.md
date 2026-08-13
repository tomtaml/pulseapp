# Tampere citizen / accessibility v0.10 dry run

Safety: UI preview only. Collection remains disabled; no free text or D1 research storage is enabled.

## Route
- Select `fi-citizen` and one of: citizen / nearby user, accessibility perspective, road user, other.
- 1/6 shows a public-space charging-bay view; participant does not steer the vehicle.
- 2/6 tests public-space principles: accessible movement, safe transfer, visible energy direction, clear responsibility.
- 3/6 explains charging vs V2G without asking the citizen to approve a fleet contract.
- 4/6 uses the existing simulated cycle; the citizen task is to follow energy direction. Driver override is hidden.
- 5/6 presents a winter/public-space disruption and asks what information should appear first.
- 6/6 checks comprehension of safe start, charging direction and V2G direction.
- Standard SUS follows actual use; final scales cover trust, responsibility, safe stop, accessibility and public-space acceptability.

## Phone checks
- No driver manoeuvring controls appear.
- Role screen does not loop or slow Firefox.
- A+ makes multi-column citizen cards collapse/read naturally.
- High contrast keeps headings and card text readable.
- 2/6 Continue stays disabled until the public-space clarity scale is answered.
- 4/6 can be completed and exposes the energy-flow clarity scale.
- 5/6 options describe information priorities, not fleet-operational decisions.
- All Likert/SUS answers start empty.

## Research note
`constraint_clarity` is temporarily reused for the new public-space-principles clarity item in this dry run. Before live collection, create role-specific citizen/accessibility variable names and update the approved data dictionary/backend schema.
