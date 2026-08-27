import baseWorker from "./index.js";
import { validateComprehensionItems } from "./comprehension-contract.js";

const RESEARCH_TEST_BUILD = "1.4.5-test";
const SYNTHETIC_WORKSHOP = "TEST_PIPELINE";
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const MAX_BODY_BYTES = 24000;
const ALLOWED_VARIANTS = new Set(["fi-fleet", "fi-citizen", "uk-v2h"]);
const ALLOWED_GROUPS = new Set([
  "fleet_driver", "dispatcher", "fleet_manager", "citizen",
  "accessibility_representative", "road_user", "other"
]);
const PII_KEYS = new Set([
  "name", "full_name", "first_name", "last_name", "email", "phone", "telephone",
  "address", "street_address", "postal_address", "postcode", "zip",
  "social_security_number", "employer", "employer_name", "company", "company_name",
  "organisation", "organization", "vehicle_id", "vin", "license_plate",
  "registration_number", "gps", "latitude", "longitude", "lat", "long", "location",
  "ip", "ip_address", "user_agent", "charger_id", "evse_id", "raw_session_id"
]);

function securityHeaders(response) {
  const h = new Headers(response.headers);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "no-referrer");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Resource-Policy", "same-origin");
  h.set("Strict-Transport-Security", "max-age=31536000");
  h.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  h.set("Content-Security-Policy", "default-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; object-src 'none'; base-uri 'none'");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h
  });
}

function json(data, status = 200) {
  return securityHeaders(new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0"
    }
  }));
}

function safeString(value, max = 1000) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function integerInRange(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function validLikert(value) {
  return integerInRange(value, 1, 5) !== null;
}

function avg(values) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
}

function susScore(values) {
  if (!Array.isArray(values) || values.length !== 10) return null;
  const numbers = values.map(value => integerInRange(value, 1, 5));
  if (numbers.some(value => value === null)) return null;
  return numbers.reduce((sum, value, index) => sum + (index % 2 === 0 ? value - 1 : 5 - value), 0) * 2.5;
}

function scrubObject(value, depth = 0) {
  if (depth > 6) return null;
  if (Array.isArray(value)) return value.slice(0, 50).map(item => scrubObject(item, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (PII_KEYS.has(String(key).toLowerCase())) continue;
      out[key] = scrubObject(item, depth + 1);
    }
    return out;
  }
  if (typeof value === "string") return value.slice(0, 1000);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean" || value === null) return value;
  return null;
}

function syntheticReadiness(env) {
  const enabled = env.SYNTHETIC_PIPELINE_ENABLED === "true"
    && env.COLLECTION_ENABLED !== "true"
    && env.ENVIRONMENT === "preview"
    && env.TURNSTILE_SITE_KEY === TURNSTILE_TEST_SITE_KEY
    && Boolean(env.TURNSTILE_TEST_SECRET_KEY)
    && Boolean(env.DB)
    && Boolean(env.SYNTHETIC_RATE_LIMITER);
  return { enabled };
}

function sameOriginSyntheticRequest(request) {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (origin !== expected) return false;
  if (secFetchSite && secFetchSite !== "same-origin") return false;
  return true;
}

async function verifyTestTurnstile(env, token) {
  if (!env.TURNSTILE_TEST_SECRET_KEY) return { success: false };
  if (!token || typeof token !== "string" || token.length > 2048) return { success: false };

  const form = new FormData();
  form.append("secret", env.TURNSTILE_TEST_SECRET_KEY);
  form.append("response", token);
  form.append("idempotency_key", crypto.randomUUID());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: controller.signal
    });
  } catch {
    return { success: false };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) return { success: false };
  const result = await response.json();
  if (!result.success) return result;

  const documentedTestResponse =
    result.action === "test" && result.hostname === "localhost";

  const testingKeyResponse =
    result.metadata?.result_with_testing_key === true;

  if (!documentedTestResponse && !testingKeyResponse) {
    return { ...result, success: false };
  }

  return result;
}

function validateCommon(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Invalid request.";
  if (body.synthetic_test !== true || body.workshop_code !== SYNTHETIC_WORKSHOP) {
    return "Synthetic TEST_PIPELINE payload required.";
  }
  if (!ALLOWED_VARIANTS.has(body.variant)) return "Unknown study variant.";
  if (!ALLOWED_GROUPS.has(body.participant_group)) return "Unknown participant group.";
  if (!["fi", "en"].includes(body.language)) return "Invalid language.";
  if (body.consent_confirmed !== true) return "Research notice/consent acknowledgement is required.";
  if (body.prototype_disclaimer_confirmed !== true) return "Prototype disclaimer acknowledgement is required.";
  const comprehensionProblem = validateComprehensionItems(body);
  if (comprehensionProblem) return comprehensionProblem;
  if (susScore(body.sus_values) === null) return "Ten valid SUS responses are required.";
  return null;
}

function validate(body) {
  const common = validateCommon(body);
  if (common) return common;

  if (body.variant === "fi-fleet") {
    const likerts = [
      "alignment_clarity", "constraint_clarity", "preuse_v2g_acceptance",
      "energy_flow_clarity", "trust_reliability", "trust_predictability",
      "control_confidence", "failure_recovery_confidence", "wireless_use_intention",
      "v2g_acceptance_under_guarantees"
    ];
    if (likerts.some(key => !validLikert(body[key]))) return "Missing or invalid fleet scale response.";
    if (!["fleet_policy", "dispatcher", "driver", "shared"].includes(body.constraint_owner)) return "Invalid constraint owner.";
    if (!["driver_each", "fleet_preapproved", "dispatcher", "automatic_override"].includes(body.v2g_authorisation)) return "Invalid V2G authorisation.";
    if (!["retry", "override", "support", "alternative"].includes(body.fault_decision)) return "Invalid fault decision.";
    if (!["driver", "dispatcher", "automatic", "fleet_policy"].includes(body.fault_owner)) return "Invalid fault owner.";
    if (body.cycle_completed !== true) return "Virtual cycle must be completed.";
  } else {
    if ([body.trust_1, body.trust_2, body.trust_3].some(value => !validLikert(value))) {
      return "Three valid trust responses are required.";
    }
    for (const key of ["accessibility_understanding", "wireless_acceptance", "bidirectional_participation"]) {
      if (!validLikert(body[key])) return `Invalid ${key}.`;
    }
  }
  return null;
}

function researchPayload(body) {
  const clean = scrubObject(body);
  const base = {
    schema_version: "research-v1.1",
    app_version: "1.0.0",
    synthetic_test: true,
    variant: clean.variant,
    workshop_code: SYNTHETIC_WORKSHOP,
    participant_group: clean.participant_group,
    language: clean.language,
    winter_condition: ["clear", "snow", "slush"].includes(clean.winter_condition) ? clean.winter_condition : null,
    current_soc: integerInRange(clean.current_soc, 5, 100),
    minimum_soc: integerInRange(clean.minimum_soc, 10, 100),
    departure_time: /^([01]\d|2[0-3]):[0-5]\d$/.test(clean.departure_time || "") ? clean.departure_time : null,
    dwell_minutes: integerInRange(clean.dwell_minutes, 15, 480),
    comprehension_items: clean.comprehension_items,
    sus_values: Array.isArray(clean.sus_values) ? clean.sus_values.map(Number) : []
  };

  if (clean.variant === "fi-fleet") {
    Object.assign(base, {
      alignment_method: ["guided", "auto"].includes(clean.alignment_method) ? clean.alignment_method : null,
      alignment_clarity: integerInRange(clean.alignment_clarity, 1, 5),
      constraint_owner: clean.constraint_owner,
      constraint_clarity: integerInRange(clean.constraint_clarity, 1, 5),
      v2g_authorisation: clean.v2g_authorisation,
      preuse_v2g_acceptance: integerInRange(clean.preuse_v2g_acceptance, 1, 5),
      cycle_completed: clean.cycle_completed === true,
      cycle_overridden: clean.cycle_overridden === true,
      cycle_energy_to_vehicle: Number(clean.cycle_energy_to_vehicle) || null,
      cycle_energy_to_grid: Number(clean.cycle_energy_to_grid) || null,
      cycle_net_energy: Number(clean.cycle_net_energy) || null,
      energy_flow_clarity: integerInRange(clean.energy_flow_clarity, 1, 5),
      fault_decision: clean.fault_decision,
      fault_owner: clean.fault_owner,
      trust_reliability: integerInRange(clean.trust_reliability, 1, 5),
      trust_predictability: integerInRange(clean.trust_predictability, 1, 5),
      control_confidence: integerInRange(clean.control_confidence, 1, 5),
      failure_recovery_confidence: integerInRange(clean.failure_recovery_confidence, 1, 5),
      wireless_use_intention: integerInRange(clean.wireless_use_intention, 1, 5),
      v2g_acceptance_under_guarantees: integerInRange(clean.v2g_acceptance_under_guarantees, 1, 5)
    });
  } else {
    Object.assign(base, {
      alignment_clarity: integerInRange(clean.alignment_clarity, 1, 5),
      preuse_v2g_acceptance: integerInRange(clean.preuse_v2g_acceptance, 1, 5),
      energy_flow_clarity: integerInRange(clean.energy_flow_clarity, 1, 5),
      fault_decision: clean.fault_decision,
      trust_1: integerInRange(clean.trust_1, 1, 5),
      trust_2: integerInRange(clean.trust_2, 1, 5),
      trust_3: integerInRange(clean.trust_3, 1, 5),
      accessibility_understanding: integerInRange(clean.accessibility_understanding, 1, 5),
      wireless_acceptance: integerInRange(clean.wireless_acceptance, 1, 5),
      bidirectional_participation: integerInRange(clean.bidirectional_participation, 1, 5)
    });
  }
  return base;
}

async function handleSyntheticSubmit(request, env) {
  if (!syntheticReadiness(env).enabled) {
    return json({ ok: false, error: "Synthetic research pipeline is locked." }, 503);
  }
  if (!sameOriginSyntheticRequest(request)) {
    return json({ ok: false, error: "Synthetic submission origin rejected." }, 403);
  }
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    return json({ ok: false, error: "JSON required." }, 415);
  }

  const { success: rateOk } = await env.SYNTHETIC_RATE_LIMITER.limit({ key: "synthetic-research-submit" });
  if (!rateOk) return json({ ok: false, error: "Synthetic submission rate limit reached." }, 429);

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) return json({ ok: false, error: "Submission too large." }, 413);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Submission too large." }, 413);
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Malformed JSON." }, 400);
  }

  const problem = validate(body);
  if (problem) return json({ ok: false, error: problem }, 400);

  const turnstile = await verifyTestTurnstile(env, body.turnstile_token);
  if (!turnstile.success) {
    return json({ ok: false, error: "Test human verification failed." }, 403);
  }

  const clean = researchPayload(body);
  const comprehension = clean.comprehension_items.filter(Boolean).length;
  const sus = susScore(clean.sus_values);
  const trust = clean.variant === "fi-fleet"
    ? avg([clean.trust_reliability, clean.trust_predictability, clean.control_confidence, clean.failure_recovery_confidence])
    : avg([clean.trust_1, clean.trust_2, clean.trust_3]);
  const accessibility = clean.variant === "fi-fleet" ? null : clean.accessibility_understanding;
  const wireless = clean.variant === "fi-fleet" ? clean.wireless_use_intention : clean.wireless_acceptance;
  const bidirectional = clean.variant === "fi-fleet" ? clean.v2g_acceptance_under_guarantees : clean.bidirectional_participation;
  const id = crypto.randomUUID();

  try {
    await env.DB.prepare(`INSERT INTO submissions (
      id, app_version, variant, workshop_code, participant_group, language,
      comprehension_score, sus_completed, sus_score, trust_score,
      accessibility_understanding, wireless_acceptance, bidirectional_participation,
      payload_json, record_kind
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synthetic_test')`)
      .bind(
        id, "1.0.0", clean.variant, SYNTHETIC_WORKSHOP, clean.participant_group, clean.language,
        comprehension, 1, sus, trust, accessibility, wireless, bidirectional, JSON.stringify(clean)
      ).run();
  } catch {
    return json({ ok: false, error: "Synthetic submission could not be stored." }, 500);
  }

  return json({ ok: true, submission_id: id, record_kind: "synthetic_test" });
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
        research_pipeline_mode: env.SYNTHETIC_PIPELINE_ENABLED === "true" ? "synthetic-test-enabled" : "synthetic-test-locked",
        research_db_bound: Boolean(env.DB),
        research_storage: env.DB ? "D1" : "unbound",
        research_collection_requested: env.COLLECTION_ENABLED === "true",
        research_collection_locked: data.collection_enabled !== true,
        research_free_text_locked: String(env.FREE_TEXT_ENABLED) !== "true",
        research_test_only: true,
        synthetic_workshop_code: SYNTHETIC_WORKSHOP,
        synthetic_pipeline_enabled: env.SYNTHETIC_PIPELINE_ENABLED === "true",
        synthetic_pipeline_ready: syntheticReadiness(env).enabled,
        synthetic_turnstile_configured: Boolean(env.TURNSTILE_TEST_SECRET_KEY),
        synthetic_rate_limiter_bound: Boolean(env.SYNTHETIC_RATE_LIMITER),
        operational_registry: "not-mounted"
      }, response.status);
    }

    if (url.pathname === "/api/research/synthetic-submit" && request.method === "POST") {
      return handleSyntheticSubmit(request, env);
    }

    return baseWorker.fetch(request, env, ctx);
  }
};