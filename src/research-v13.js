import { SCHEMA_VERSION, validateV13, scoreV13, minimisedV13 } from "../public/js/research-v13-contract.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

export async function submitV13(request, env, { ready, synthetic = false, verifyHuman, rateLimiter, expectedOrigin }) {
  if (!ready || !env.DB || !rateLimiter) return json({ ok: false, error: "Research pipeline is locked." }, 503);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!expectedOrigin || new URL(request.url).origin !== expectedOrigin || origin !== expectedOrigin || (fetchSite && fetchSite !== "same-origin")) return json({ ok: false, error: "Origin rejected." }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return json({ ok: false, error: "JSON required." }, 415);
  const { success } = await rateLimiter.limit({ key: synthetic ? "v13-synthetic" : "v13-research" });
  if (!success) return json({ ok: false, error: "Rate limit reached." }, 429);
  if (Number(request.headers.get("content-length") || 0) > 24000) return json({ ok: false, error: "Submission too large." }, 413);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 24000) return json({ ok: false, error: "Submission too large." }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: "Malformed JSON." }, 400); }
  const error = validateV13(body, { synthetic });
  if (error) return json({ ok: false, error }, 400);
  if (!(await verifyHuman(body.turnstile_token)).success) return json({ ok: false, error: "Human verification failed." }, 403);
  const scores = scoreV13(body);
  const minimised = minimisedV13(body);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(`INSERT INTO research_v13_submissions
      (id, record_kind, schema_version, variant, participant_group, workshop_code, language,
       comprehension_score, sus_score, service_confidence_score, wpt_intention_t1,
       v2g_intention_t1, v2h_intention_t1, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, synthetic ? "synthetic_test" : "research", SCHEMA_VERSION, body.variant,
        body.participant_group, body.workshop_code, body.language, scores.comprehension_score,
        scores.sus_score, scores.service_confidence_score, scores.wpt_intention_t1,
        scores.v2g_intention_t1, scores.v2h_intention_t1, JSON.stringify(minimised)).run();
  } catch { return json({ ok: false, error: "Submission could not be stored." }, 500); }
  return json({ ok: true, submission_id: id, record_kind: synthetic ? "synthetic_test" : "research" });
}
