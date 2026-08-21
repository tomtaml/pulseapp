# PULSE analysis export v1

## Purpose

This operator-side export path creates an **analysis-ready, PII-minimised CSV** from the research D1 database without adding any public export API or enabling participant collection.

The tool is `scripts/export_analysis.py`.

## Security posture

- The export runs locally from an authorised operator terminal using Wrangler and the operator's existing Cloudflare credentials.
- It does **not** create a browser-accessible or public HTTP export endpoint.
- It reads the remote D1 database with an explicit SQL column allow-list.
- It deliberately excludes raw `payload_json`, submission UUIDs, exact submission timestamps and free text.
- It does not export named contact data or operational identifiers.
- `research` rows are the default export kind.
- `synthetic_test` rows must be requested explicitly, which prevents synthetic validation data from silently entering a real research analysis file.
- Output is written under `exports/`, which must remain gitignored.

## Analysis allow-list

The CSV contains only the following categories:

1. Record classification and study context: `record_kind`, app version, variant, workshop code, broad participant group and language.
2. Server-derived research scores: comprehension, SUS and trust, plus the approved accessibility/wireless/bidirectional summary columns.
3. Structured scenario/design signals already present in the approved research payload, such as winter condition, fictional SoC/reserve, dwell time, alignment clarity, V2G authorisation, cycle metrics, fault decisions and structured trust/acceptability ratings.

The export does not include `optional_note`, even if free text is approved in a future production deployment. Qualitative data requires a separately governed process.

## Usage

Safe default — real research records only:

```bash
python3 scripts/export_analysis.py
```

Equivalent explicit command:

```bash
python3 scripts/export_analysis.py --record-kind research
```

Gate/testing use only — synthetic records:

```bash
python3 scripts/export_analysis.py --record-kind synthetic_test
```

The command writes two local files:

- `exports/pulse_analysis_<record_kind>_<UTC timestamp>.csv`
- `exports/pulse_analysis_<record_kind>_<UTC timestamp>.metadata.json`

The metadata file records the source database, record kind, row count, exported columns and fields excluded by design.

## Gate 2F validation criteria

Gate 2F export validation passes when all of the following are demonstrated:

1. D1 contains only the expected `record_kind` classes and current synthetic validation rows remain separate from future `research` rows.
2. The synthetic export returns exactly the expected synthetic row count.
3. The CSV header contains no `payload_json`, `id`, `submitted_at`, `optional_note` or known PII/operational identifier columns.
4. The export metadata reports the same row count as the CSV.
5. The default `research` export returns zero rows while live collection is still locked.
6. `/api/health` remains fail-closed after the validation: `synthetic_pipeline_enabled=false`, `synthetic_pipeline_ready=false`, `research_collection_locked=true`, `research_free_text_locked=true`.

## Production boundary

Passing this export gate does **not** authorise live participant data collection. Production collection still requires the full fail-closed readiness conditions, governance approval, production Turnstile configuration, approved retention/access arrangements and any required ethics/data-management approvals.
