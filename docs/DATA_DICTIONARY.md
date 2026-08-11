# Data dictionary

The prototype is designed to collect anonymous workshop interaction data only.

## Study variants
- `fi-fleet`: Finland / Tampere, wireless charging + V2G, delivery-fleet operational user flow.
- `fi-citizen`: Finland / Tampere, citizen/accessibility review of the same core prototype using a fictional fleet scenario.
- `uk-v2h`: Oxfordshire-oriented alternative, wireless charging + V2H.

## Core stored fields
- server-generated submission UUID
- server timestamp
- workshop code
- study variant
- broad participant group
- language
- structured task responses
- comprehension items
- SUS 1–5 values (only after approved wording is inserted)
- calculated SUS score
- trust items
- wireless-charging acceptance
- bidirectional participation/acceptability
- optional non-identifying note (max 500 characters)

## SRF traceability
The data are designed to map into the project registers:
- Activity ID / workshop code
- actor group
- evidence signal
- comprehension / control / trust / accessibility indicator
- candidate design requirement
- later DCE / Behavioural Twin variable

Do not merge raw prototype records with named workshop invitation/contact lists.
