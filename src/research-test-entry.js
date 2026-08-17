import baseWorker from "./index.js";

const RESEARCH_TEST_BUILD = "1.4.1-test";
const SYNTHETIC_WORKSHOP = "TEST_PIPELINE";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow, noarchive"
    }
  });
}

async function syntheticSubmissionAllowed(request) {
  let body;
  try {
    body = await request.clone().json();
  } catch {
    return false;
  }
  return body?.synthetic_test === true && body?.workshop_code === SYNTHETIC_WORKSHOP;
}

async function markSynthetic(env, submissionId) {
  if (!env.DB || !submissionId) return false;
  const result = await env.DB.prepare(
    "UPDATE submissions SET record_kind = 'synthetic_test' WHERE id = ? AND workshop_code = ?"
  ).bind(submissionId, SYNTHETIC_WORKSHOP).run();
  return Number(result?.meta?.changes || 0) === 1;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      const response = await baseWorker.fetch(request, env, ctx);
      const data = await response.json().catch(() => ({ ok: false }));
      return json({
        ...data,
        research_test_worker: true,
        research_test_build: RESEARCH_TEST_BUILD,
        research_pipeline_mode: "synthetic-test-locked",
        research_db_bound: Boolean(env.DB),
        research_storage: env.DB ? "D1" : "unbound",
        research_collection_locked: String(env.COLLECTION_ENABLED) !== "true",
        research_free_text_locked: String(env.FREE_TEXT_ENABLED) !== "true",
        research_test_only: true,
        synthetic_workshop_code: SYNTHETIC_WORKSHOP,
        operational_registry: "not-mounted"
      }, response.status);
    }

    const isResearchSubmit =
      request.method === "POST" &&
      (url.pathname === "/api/research/submit" || url.pathname === "/api/submit");

    if (isResearchSubmit) {
      if (!(await syntheticSubmissionAllowed(request))) {
        return json({
          ok: false,
          error: "Research-test Worker accepts synthetic TEST_PIPELINE submissions only."
        }, 403);
      }

      const response = await baseWorker.fetch(request, env, ctx);
      if (!response.ok) return response;

      const data = await response.json().catch(() => null);
      if (!data?.submission_id) {
        return json({ ok: false, error: "Synthetic submission response was incomplete." }, 500);
      }

      const marked = await markSynthetic(env, data.submission_id);
      if (!marked) {
        return json({
          ok: false,
          error: "Synthetic submission was stored but could not be marked synthetic_test."
        }, 500);
      }

      return json({ ...data, record_kind: "synthetic_test" }, response.status);
    }

    return baseWorker.fetch(request, env, ctx);
  }
};
