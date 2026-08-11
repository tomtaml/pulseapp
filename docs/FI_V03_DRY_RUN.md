# Finland v0.3 dry-run

Use the `prototype-v0.3` Cloudflare preview only. Research collection must remain disabled.

> Preview deployment check: Cloudflare should build this branch with the non-production deploy command (`npx wrangler versions upload`), not retry the production `main` build.
>
> Fresh preview-trigger commit pushed 11 Aug 2026 after confirming non-production branch builds are enabled in Cloudflare.

## Fleet route

`?variant=fi-fleet&workshop=TAMPERE-S4&demo=1`

Check on a real phone:

- welcome and no-storage status are obvious
- participant role can be selected without providing employer information
- winter docking graphic is understandable
- snow / slush condition choice is usable
- current SoC, guaranteed departure SoC, departure time and dwell time are understandable
- mobility-first guarantee is visible
- virtual session clearly shows battery, charging direction and key signals
- V2G offer clearly shows 6 kWh maximum export, reserve guarantee, compensation and override
- fault scenario makes retry / leave / support / alternative charging understandable
- comprehension questions are answered after the flow
- exact 10-item SUS follows hands-on use
- trust, accessibility, wireless acceptance and V2G participation are separate measures

## Citizen / accessibility route

`?variant=fi-citizen&workshop=TAMPERE-S4&demo=1`

Check with citizens and vulnerable-group representatives:

- same fictional Tampere delivery-van concept is recognisable
- no participant is asked to make fictional fleet-operational settings
- wireless charging is explained without technical jargon
- public-space charging/alignment status is understandable
- V2G energy direction, reserve protection and ability to stop are clear
- fault state explains what happened and who should be responsible
- comprehension questions test the interface, not prior technical knowledge
- SUS is administered only after the hands-on walkthrough
- wireless acceptance and V2G public acceptability remain separate
- larger-text and high-contrast controls remain usable throughout

## Required observations for SRF traceability

During the facilitated workshop, record qualitative observations separately in the SRF Issue Response Log. For each important signal note:

- Activity ID / workshop
- actor group
- screen or task
- observed confusion, concern or requirement
- SR dimension (e.g. trust, control, accessibility, safety, fairness)
- proposed design response
- owner
- evidence confidence
- status / next review point

Do not put names or other direct identifiers in the app or the issue log used for this dry run.
