# PULSE v1.1 utility / aggregator view

## Purpose

`/utility.html` is a read-only operational view for demonstrating how multiple PULSE wireless charging / V2G sessions could be observed together by an energy-utility, CPO/aggregator or fleet-energy stakeholder.

It is not a participant questionnaire and it must not read the SSH research database.

## Current preview

The page first requests:

`GET /api/charging/utility-summary?workshop=<code>`

If that endpoint is unavailable, v1.1 uses a clearly labelled synthetic multi-session mock in the browser. This is intentional: the current mock charging adapters are local to each participant browser and therefore do not yet constitute a shared live session registry.

The mock view demonstrates:

- concurrent operational session states;
- grid-to-vehicle and vehicle-to-grid power;
- cumulative energy to vehicles and back to grid;
- net fleet power;
- illustrative V2G peak-shaving contribution;
- illustrative RES-aligned charging share;
- available flexibility;
- a 15-minute demand / RES / price context timeline.

All values are workshop scenario values, not measured Tampere grid data.

## Future API contract

A future shared charging backend should expose an authenticated read-only aggregate endpoint shaped approximately as:

```json
{
  "protocol_version": "pulse-session-v1",
  "source": "charging-backend",
  "registry_connected": true,
  "observed_at": "2026-08-14T12:00:00Z",
  "sessions": [
    {
      "session_ref": "pseudonymous-operational-ref",
      "state": "CHARGING",
      "soc_percent": 69,
      "protected_soc_percent": 65,
      "power_kw": 18,
      "direction": "grid_to_vehicle",
      "energy_to_vehicle_kwh": 8.2,
      "energy_to_grid_kwh": 0,
      "departure_ready": false
    }
  ],
  "aggregate": {
    "active_sessions": 6,
    "import_power_kw": 29,
    "export_power_kw": 26,
    "net_power_kw": 3,
    "energy_to_vehicle_kwh": 55.1,
    "energy_to_grid_kwh": 7.4,
    "peak_shaving_kw": 26,
    "res_aligned_share_pct": 72,
    "flexibility_available_kw": 50
  }
}
```

## Data-separation rule

The utility plane may process the minimum operational fields needed to run and verify charging / V2G. It must not automatically inherit the research payload.

Do not expose in this view:

- SUS or other questionnaire answers;
- trust / acceptance scores;
- participant role or vulnerability category;
- names, emails or phone numbers;
- VIN or registration plate;
- raw charger / EVSE credentials;
- precise participant location;
- research submission IDs.

Operational session identifiers shown to the dashboard should be pseudonymous references. Mapping to charger, EVSE or vehicle identifiers should remain inside the authenticated charging backend when technically necessary.

## Security before real data

The current mock utility page can be public for workshop demonstration because it contains no real operational data.

Before `source=charging-backend` is enabled:

1. require authenticated authorised utility / pilot staff access;
2. keep the participant QR route separate from the utility dashboard route;
3. keep upstream charger / CPO credentials in Worker or backend secrets, never in browser JavaScript;
4. return only allow-listed operational fields;
5. rate-limit and audit dashboard/backend access;
6. define retention for operational telemetry separately from SSH research retention;
7. ensure research joins, where ethically approved, use a purpose-limited pseudonymous linkage rather than exposing research data in the operational dashboard.

## Indicator semantics

`peak_shaving_kw` should be calculated against an explicitly documented reference case (for example the same charging load without V2G / managed charging), not presented as an absolute grid-system benefit without a baseline.

`res_aligned_share_pct` is a scheduling indicator. It is not proof of physical electricity provenance. In the field pilot it should be derived from timestamped energy transfers joined to an approved RES / electricity-mix signal.
