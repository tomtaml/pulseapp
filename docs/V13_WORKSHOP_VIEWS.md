# V1.3 workshop views

The facilitator can open `https://pulse-srf-variant-preview.tom-tamlander.workers.dev/v13-setup.html`, choose a site and a starting view, then switch each question module on or off. The page creates a shareable preview link. No response is submitted or stored by these workshop views; record any approved observations using the workshop's separate procedure.

| Starting view | Scenario | Understanding questions | SUS | Service confidence, trust and outcome scales |
| --- | --- | --- | --- | --- |
| Demo only (`view=demo`) | Yes | No | No | No |
| Demo plus questions (`view=questions`) | Yes | Yes | No | No |
| Full preview (`view=full`) | Yes | Yes | Direct users only | Yes |

The facilitator can alter any of the last three columns with `questions=0|1`, `sus=0|1` and `scales=0|1`. The old `demo=1` link still forces demo only. A link with `view=` or an individual module switch always stays in preview mode, even if opened on an environment where the complete research instrument is available. Research submissions still require the complete approved instrument and server-side collection gates; these switches never relax the server validation.

The scenario pages appear in all views. The Finnish fleet route `/v13-fleet.html` runs the full RC1 mobile interaction stack: alignment guidance, next-delivery constraints, V2G permission and offer, animated charging and export cycle, override and winter recovery. Its questions, SUS and trust screens are enabled by the same facilitator switches. Links to `/v13.html?variant=fi-fleet` redirect to that route. The Greek passenger route compares charging now, a lower tariff and renewable surplus, with V2G requiring separate permission. The UK route contrasts charging for a trip with protected-reserve home support and a conductive fallback. All values and offers are illustrative, and the scenarios require site confirmation. These V1.3 pages do not change or deploy the partner V1.2 RC1 Worker.

SUS is presented only to roles marked as direct users: the fleet driver, Greek passenger driver and UK accessible driver. The dispatcher and fleet manager can see comprehension and confidence/trust items but not SUS. The Finnish fleet route uses the RC1 Finnish working translation for comprehension, SUS and trust when `lang=fi`; those are for cognitive testing and must not be treated as approved scores or the final V1.3 research instrument. Greek study questions and scales remain in English pending approval. UK assistive-technology and participant review is still needed before field use.
