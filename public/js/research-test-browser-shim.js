const qs = new URLSearchParams(location.search);
const SYNTHETIC_WORKSHOP = "TEST_PIPELINE";
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const SYNTHETIC_TEST_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const syntheticModeRequested = qs.get("synthetic") === "1"
  && qs.get("workshop") === SYNTHETIC_WORKSHOP
  && qs.get("demo") !== "1";

if (syntheticModeRequested) {
  const nativeFetch = window.fetch.bind(window);
  let syntheticReady = false;
  let syntheticWidgetId = 0;

  function sameOriginUrl(input) {
    try {
      const raw = input instanceof Request ? input.url : String(input);
      const url = new URL(raw, location.href);
      return url.origin === location.origin ? url : null;
    } catch {
      return null;
    }
  }

  function methodOf(input, init) {
    return String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  }

  function updateBadge() {
    const badge = document.getElementById("collectionBadge");
    if (!badge) return;
    const fi = document.documentElement.lang === "fi";
    const text = syntheticReady
      ? (fi ? "Synteettinen testi · TEST_PIPELINE" : "Synthetic test · TEST_PIPELINE")
      : (fi ? "Synteettinen testi · lukittu" : "Synthetic test · locked");
    if (badge.textContent !== text) badge.textContent = text;
    badge.classList.toggle("live", syntheticReady);
  }

  function renderSyntheticVerification(target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    const fi = document.documentElement.lang === "fi";
    el.innerHTML = syntheticReady
      ? `<div class="notice"><strong>${fi ? "Synteettinen ihmistarkistus" : "Synthetic human verification"}</strong><br>${fi ? "TEST_PIPELINE käyttää Cloudflaren testivarmennusta. Oikeaa osallistujaa ei varmenneta tässä portissa." : "TEST_PIPELINE uses Cloudflare test verification. No real participant verification occurs at this gate."}</div>`
      : `<div class="warning">${fi ? "Synteettinen testiputki on lukittu." : "Synthetic test pipeline is locked."}</div>`;
  }

  // Gate 2E uses a browser-only Turnstile adapter so the existing participant UI can
  // complete its normal verification step without pretending this is production human
  // verification. The server still sends the synthetic token to Cloudflare Siteverify
  // and accepts it only with the dedicated always-pass testing secret.
  window.turnstile = {
    render(target) {
      syntheticWidgetId += 1;
      renderSyntheticVerification(target);
      return syntheticWidgetId;
    },
    getResponse() {
      return syntheticReady ? SYNTHETIC_TEST_TOKEN : "";
    },
    reset(targetId) {
      if (targetId) renderSyntheticVerification("#turnstile");
    },
    remove() {
      const el = document.getElementById("turnstile");
      if (el) el.innerHTML = "";
    }
  };

  const badge = document.getElementById("collectionBadge");
  if (badge) {
    new MutationObserver(updateBadge).observe(badge, { childList: true, subtree: true, characterData: true });
    updateBadge();
  }

  window.fetch = async (input, init = {}) => {
    const url = sameOriginUrl(input);
    const method = methodOf(input, init);

    if (url?.pathname === "/api/config" && method === "GET") {
      const [baseResponse, healthResponse] = await Promise.all([
        nativeFetch(input, init),
        nativeFetch("/api/health", { cache: "no-store" })
      ]);

      const base = await baseResponse.json().catch(() => ({}));
      const health = await healthResponse.json().catch(() => ({}));

      syntheticReady = baseResponse.ok
        && healthResponse.ok
        && health.ok === true
        && health.research_test_worker === true
        && health.research_test_only === true
        && health.research_collection_locked === true
        && health.research_free_text_locked === true
        && health.synthetic_workshop_code === SYNTHETIC_WORKSHOP
        && health.synthetic_pipeline_ready === true;

      queueMicrotask(updateBadge);

      return new Response(JSON.stringify({
        ...base,
        collection_enabled: syntheticReady,
        free_text_enabled: false,
        turnstile_site_key: syntheticReady ? TURNSTILE_TEST_SITE_KEY : null,
        synthetic_browser_test: true,
        synthetic_pipeline_ready: syntheticReady
      }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store, max-age=0"
        }
      });
    }

    if (url?.pathname === "/api/submit" && method === "POST") {
      if (!syntheticReady) {
        return new Response(JSON.stringify({ ok: false, error: "Synthetic research pipeline is locked." }), {
          status: 503,
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }

      let payload;
      try {
        const raw = init.body ?? (input instanceof Request ? await input.clone().text() : "");
        payload = JSON.parse(String(raw));
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Malformed synthetic browser payload." }), {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }

      payload.synthetic_test = true;
      payload.workshop_code = SYNTHETIC_WORKSHOP;
      payload.turnstile_token = SYNTHETIC_TEST_TOKEN;

      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      headers.set("content-type", "application/json");

      return nativeFetch("/api/research/synthetic-submit", {
        ...init,
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify(payload)
      });
    }

    return nativeFetch(input, init);
  };

  document.documentElement.dataset.researchSyntheticTest = "true";
}
