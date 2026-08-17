import baseWorker from "./index.js";

const RESEARCH_TEST_BUILD = "1.4.0-test";

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
        operational_registry: "not-mounted"
      }, response.status);
    }

    return baseWorker.fetch(request, env, ctx);
  }
};
