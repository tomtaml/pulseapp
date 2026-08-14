# v1.2 shared operational sessions — design placeholder

This file marks the transition from the v1.1 utility dashboard mock to a shared operational session registry.

Planned session lifecycle: DOCKING → ALIGNING → READY → CHARGING → V2G_AVAILABLE → V2G_ACTIVE → RECHARGING → READY_TO_DEPART, with FAULT / OVERRIDDEN / SESSION_ENDED exception states.

Operational mock sessions must remain separate from the SSH/research submission database and must not contain names, VIN/registration, participant group, questionnaire answers or precise location.
