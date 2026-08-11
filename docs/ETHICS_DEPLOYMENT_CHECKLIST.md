# Ethics + secure deployment checklist

This repository is a **research prototype**, not an ethics-approved production research system. The default configuration keeps research data collection disabled.

Before `COLLECTION_ENABLED=true`:

1. Finalise the University of Helsinki ethics/data-protection route, participant information sheet and consent wording for the relevant workshop activity.
2. Confirm controller/processor roles, Cloudflare contractual terms and the approved data-processing route with UH.
3. Create the D1 database using the approved jurisdiction. If the agreed route requires EU-only D1 placement, create it with `--jurisdiction=eu`; this choice must be made when the database is created.
4. Use production Turnstile keys. Store `TURNSTILE_SECRET_KEY` only as a Worker secret and set `TURNSTILE_EXPECTED_HOSTNAME` to the final production hostname.
5. Confirm that operational logging does not retain request bodies or research responses. Do not add analytics, session replay or third-party trackers without a separate review.
6. Keep `COLLECTION_ENABLED=false` until the approved research/data route is in place. Use `?demo=1` for demonstrations that must never send research data.
7. Keep `FREE_TEXT_ENABLED=false` unless open text is scientifically necessary and explicitly covered by the information/consent and data-minimisation assessment.
8. SUS: the English 10-item instrument is included in v0.2. The Finnish wording is a **PULSE working translation for cognitive testing**, not yet treated as a validated Finnish equivalent. Review the translation, back-translate it and document the final wording before using the score for formal cross-language comparison.
9. Pilot the Finnish fleet version and the Finnish citizen/accessibility version separately. Citizens and vulnerable-group participants should evaluate comprehension, accessibility, trust and usability of the fictional fleet app rather than being treated as fleet operational decision-makers.
10. Test keyboard-only operation, 200% zoom, high contrast, plain-language Finnish, common mobile screen readers and assisted participation. Keep a non-digital/facilitator fallback available.
11. Confirm the retention/deletion period and an access-controlled export procedure. There is intentionally no public export endpoint in this prototype.
12. Do not merge anonymous app records with named invitation/contact lists. Keep recruitment administration outside the response database.
13. Record the app version, Git commit, workshop code and study variant in the SRF Activity Map for each session so evidence can be traced to the exact interface tested.
14. Test every QR route on iOS and Android before the workshop: `fi-fleet`, `fi-citizen` and `uk-v2h` as applicable.
15. Run a dry workshop with collection disabled before enabling live research collection.
16. After each workshop, feed issues into the SRF Issue Response Log and Transparency Log; do not treat the SUS score as the sole societal-readiness result.

## Suggested go/no-go gate

Do not enable live collection until the responsible researcher can answer **yes** to all of these:

- participant information and consent wording approved;
- data-protection/ethics route documented;
- approved Cloudflare/D1 environment configured;
- Turnstile production keys and hostname restriction tested;
- SUS language version documented;
- participant groups and workshop code frozen;
- retention/export/deletion responsibilities assigned;
- mobile and accessibility dry-run completed.
