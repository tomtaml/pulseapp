#!/usr/bin/env python3
"""Create a PII-minimised analysis CSV from the PULSE research D1 database.

The export is an operator-side CLI tool only. It does not create or call a public
export endpoint. The query uses an explicit analysis allow-list and deliberately
omits raw payload_json, submission UUIDs, exact submission timestamps, free text,
and operational identifiers.
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

DATABASE = "pulse-research-test-eu-v2"
CONFIG = "wrangler.research-test.jsonc"
ALLOWED_RECORD_KINDS = ("research", "synthetic_test")

ANALYSIS_COLUMNS = [
    "record_kind",
    "app_version",
    "variant",
    "workshop_code",
    "participant_group",
    "language",
    "comprehension_score",
    "sus_completed",
    "sus_score",
    "trust_score",
    "accessibility_understanding",
    "wireless_acceptance",
    "bidirectional_participation",
    "winter_condition",
    "current_soc",
    "minimum_soc",
    "departure_time",
    "dwell_minutes",
    "alignment_method",
    "alignment_clarity",
    "constraint_owner",
    "constraint_clarity",
    "v2g_authorisation",
    "preuse_v2g_acceptance",
    "cycle_completed",
    "cycle_overridden",
    "cycle_energy_to_vehicle",
    "cycle_energy_to_grid",
    "cycle_net_energy",
    "energy_flow_clarity",
    "fault_decision",
    "fault_owner",
    "trust_reliability",
    "trust_predictability",
    "control_confidence",
    "failure_recovery_confidence",
    "wireless_use_intention",
    "v2g_acceptance_under_guarantees",
    "trust_1",
    "trust_2",
    "trust_3",
]


def analysis_query(record_kind: str) -> str:
    if record_kind not in ALLOWED_RECORD_KINDS:
        raise ValueError("Unsupported record kind")
    return f"""
SELECT
  record_kind,
  app_version,
  variant,
  workshop_code,
  participant_group,
  language,
  comprehension_score,
  sus_completed,
  sus_score,
  trust_score,
  accessibility_understanding,
  wireless_acceptance,
  bidirectional_participation,
  json_extract(payload_json, '$.winter_condition') AS winter_condition,
  json_extract(payload_json, '$.current_soc') AS current_soc,
  json_extract(payload_json, '$.minimum_soc') AS minimum_soc,
  json_extract(payload_json, '$.departure_time') AS departure_time,
  json_extract(payload_json, '$.dwell_minutes') AS dwell_minutes,
  json_extract(payload_json, '$.alignment_method') AS alignment_method,
  json_extract(payload_json, '$.alignment_clarity') AS alignment_clarity,
  json_extract(payload_json, '$.constraint_owner') AS constraint_owner,
  json_extract(payload_json, '$.constraint_clarity') AS constraint_clarity,
  json_extract(payload_json, '$.v2g_authorisation') AS v2g_authorisation,
  json_extract(payload_json, '$.preuse_v2g_acceptance') AS preuse_v2g_acceptance,
  json_extract(payload_json, '$.cycle_completed') AS cycle_completed,
  json_extract(payload_json, '$.cycle_overridden') AS cycle_overridden,
  json_extract(payload_json, '$.cycle_energy_to_vehicle') AS cycle_energy_to_vehicle,
  json_extract(payload_json, '$.cycle_energy_to_grid') AS cycle_energy_to_grid,
  json_extract(payload_json, '$.cycle_net_energy') AS cycle_net_energy,
  json_extract(payload_json, '$.energy_flow_clarity') AS energy_flow_clarity,
  json_extract(payload_json, '$.fault_decision') AS fault_decision,
  json_extract(payload_json, '$.fault_owner') AS fault_owner,
  json_extract(payload_json, '$.trust_reliability') AS trust_reliability,
  json_extract(payload_json, '$.trust_predictability') AS trust_predictability,
  json_extract(payload_json, '$.control_confidence') AS control_confidence,
  json_extract(payload_json, '$.failure_recovery_confidence') AS failure_recovery_confidence,
  json_extract(payload_json, '$.wireless_use_intention') AS wireless_use_intention,
  json_extract(payload_json, '$.v2g_acceptance_under_guarantees') AS v2g_acceptance_under_guarantees,
  json_extract(payload_json, '$.trust_1') AS trust_1,
  json_extract(payload_json, '$.trust_2') AS trust_2,
  json_extract(payload_json, '$.trust_3') AS trust_3
FROM submissions
WHERE record_kind = '{record_kind}'
ORDER BY submitted_at ASC;
""".strip()


def extract_rows(wrangler_payload):
    """Handle Wrangler's current JSON envelope without depending on metadata fields."""
    envelopes = wrangler_payload if isinstance(wrangler_payload, list) else [wrangler_payload]
    rows = []
    for envelope in envelopes:
        if not isinstance(envelope, dict):
            continue
        results = envelope.get("results")
        if isinstance(results, list):
            rows.extend(row for row in results if isinstance(row, dict))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Export PULSE analysis-ready D1 rows")
    parser.add_argument(
        "--record-kind",
        choices=ALLOWED_RECORD_KINDS,
        default="research",
        help="research is the safe default; synthetic_test must be requested explicitly",
    )
    parser.add_argument("--database", default=DATABASE)
    parser.add_argument("--config", default=CONFIG)
    parser.add_argument("--output-dir", default="exports")
    args = parser.parse_args()

    query = analysis_query(args.record_kind)
    cmd = [
        "npx", "wrangler@latest", "d1", "execute", args.database,
        "--remote", "--config", args.config, "--json", "--command", query,
    ]

    completed = subprocess.run(cmd, text=True, capture_output=True)
    if completed.returncode != 0:
        if completed.stderr:
            print(completed.stderr, file=sys.stderr, end="")
        if completed.stdout:
            print(completed.stdout, file=sys.stderr, end="")
        return completed.returncode

    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        print(f"Could not parse Wrangler JSON output: {exc}", file=sys.stderr)
        return 2

    rows = extract_rows(payload)
    for row in rows:
        unexpected = set(row) - set(ANALYSIS_COLUMNS)
        if unexpected:
            print(f"Refusing export: unexpected columns returned: {sorted(unexpected)}", file=sys.stderr)
            return 3

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    stem = f"pulse_analysis_{args.record_kind}_{timestamp}"
    csv_path = output_dir / f"{stem}.csv"
    metadata_path = output_dir / f"{stem}.metadata.json"

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=ANALYSIS_COLUMNS, extrasaction="raise")
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column) for column in ANALYSIS_COLUMNS})

    metadata = {
        "export_version": "analysis-export-v1",
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_database": args.database,
        "record_kind": args.record_kind,
        "row_count": len(rows),
        "columns": ANALYSIS_COLUMNS,
        "excluded_by_design": [
            "payload_json",
            "id",
            "submitted_at",
            "optional_note",
            "name",
            "email",
            "phone",
            "address",
            "vehicle_id",
            "vin",
            "license_plate",
            "gps",
            "ip_address",
            "user_agent",
            "raw_session_id",
        ],
    }
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {len(rows)} row(s) to {csv_path}")
    print(f"Wrote export metadata to {metadata_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
