# Ethics + secure deployment checklist

This repository is a **prototype**, not an ethics-approved production research system.

Before `COLLECTION_ENABLED=true`:

1. Finalise UH ethics/data-protection route and participant research notice.
2. Confirm controller/processor roles and Cloudflare contractual/data-protection terms with UH.
3. Create the D1 database with `--jurisdiction=eu` if the agreed data route requires EU-only D1 storage.
4. Use production Turnstile keys; keep the secret only as a Worker secret.
5. Restrict the Turnstile widget to the final production hostname.
6. Confirm that Worker/Cloudflare logging is configured so request bodies and research responses are not retained in operational logs.
7. Keep `COLLECTION_ENABLED=false` until the data route is approved.
8. Replace all SUS placeholders with the exact approved instrument wording and verify scoring.
9. Pilot the Finnish fleet version with drivers/dispatchers and the citizen/accessibility version separately.
10. Test keyboard-only use, screen zoom, high contrast, plain-language Finnish, and assisted participation.
11. Create a retention/deletion plan and an access-controlled export procedure.
12. Do not expose a public data-export endpoint; export from D1 only through authorised admin tooling.
13. Confirm whether the optional free-text field is needed; remove it if not justified.
14. Record app version/commit hash in the SRF Activity Map for each workshop session.
