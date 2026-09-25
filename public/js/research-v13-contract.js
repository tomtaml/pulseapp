// Shared by the collection Worker and the synthetic pipeline. The client uses
// the same registry for rendering, but this module alone validates submissions.
export const SCHEMA_VERSION = "research-v1.3";

export const V13_PROFILES = Object.freeze({
  "fi-fleet": Object.freeze({
    fleet_driver: Object.freeze({ sus: true, outcomes: ["wpt_intention_t1", "v2g_intention_t1", "actor_trust_item"] }),
    dispatcher: Object.freeze({ sus: false, outcomes: ["v2g_intention_t1", "actor_trust_item"] }),
    fleet_manager: Object.freeze({ sus: false, outcomes: ["v2g_intention_t1", "fairness_item"] })
  }),
  "gr-prosumer": Object.freeze({
    passenger_prosumer: Object.freeze({ sus: true, outcomes: ["wpt_intention_t1", "v2g_intention_t1", "fairness_item", "actor_trust_item"] })
  }),
  "uk-v2h": Object.freeze({
    accessible_driver: Object.freeze({ sus: true, outcomes: ["wpt_intention_t1", "v2h_intention_t1", "accessibility_item", "actor_trust_item"] })
  })
});

export const V13_CHOICES = Object.freeze({
  "fi-fleet": Object.freeze({
    scenario: ["charge_now", "protect_departure", "authorise_v2g"],
    recovery: ["retry_alignment", "stop_and_leave", "contact_dispatch"]
  }),
  "gr-prosumer": Object.freeze({
    scenario: ["charge_now", "wait_for_lower_tariff", "wait_for_res_surplus"],
    recovery: ["retry", "charge_now", "contact_provider"]
  }),
  "uk-v2h": Object.freeze({
    scenario: ["charge_now", "support_home", "protect_trip"],
    recovery: ["retry_wireless", "use_conductive_fallback", "stop_and_leave"]
  })
});

const COMMON_KEYS = [
  "schema_version", "variant", "participant_group", "workshop_code", "language",
  "consent_confirmed", "prototype_disclaimer_confirmed", "scenario_choice",
  "recovery_choice", "comprehension_answers", "service_confidence_1",
  "service_confidence_2", "turnstile_token"
];
const SUS_KEYS = Array.from({ length: 10 }, (_, index) => `sus_${String(index + 1).padStart(2, "0")}`);
const ANSWER_OPTIONS = [
  ["yes", "no", "unsure"],
  ["yes", "no", "unsure"],
  ["charge", "export", "home", "unsure"],
  ["driver", "operator", "automatic", "unsure"]
];
const ANSWER_KEYS = Object.freeze({
  "fi-fleet": ["yes", "no", "export", "driver"],
  "gr-prosumer": ["yes", "no", "export", "driver"],
  "uk-v2h": ["yes", "no", "home", "driver"]
});

function integerFive(value) { return Number.isInteger(value) && value >= 1 && value <= 5; }

export function validateV13(body, { synthetic = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Invalid request.";
  if (body.schema_version !== SCHEMA_VERSION) return "Invalid research schema.";
  const site = Object.hasOwn(V13_PROFILES, body.variant) ? V13_PROFILES[body.variant] : null;
  if (!site) return "Unknown study variant.";
  const profile = Object.hasOwn(site, body.participant_group) ? site[body.participant_group] : null;
  if (!profile) return "Participant profile does not match the site.";
  if (typeof body.workshop_code !== "string" || !/^[A-Za-z0-9_-]{1,32}$/.test(body.workshop_code)) return "Invalid workshop code.";
  if (!(body.variant === "fi-fleet" ? ["fi", "en"] : body.variant === "gr-prosumer" ? ["el", "en"] : ["en"]).includes(body.language)) return "Invalid site language.";
  if (body.consent_confirmed !== true || body.prototype_disclaimer_confirmed !== true) return "Acknowledgements are required.";
  if (!V13_CHOICES[body.variant].scenario.includes(body.scenario_choice) || !V13_CHOICES[body.variant].recovery.includes(body.recovery_choice)) return "Invalid scenario response.";
  if (!Array.isArray(body.comprehension_answers) || body.comprehension_answers.length !== 4 || body.comprehension_answers.some((value, index) => !ANSWER_OPTIONS[index].includes(value))) return "Four controlled comprehension answers are required.";
  if (![body.service_confidence_1, body.service_confidence_2, ...profile.outcomes.map(key => body[key])].every(integerFive)) return "Missing or invalid 1–5 response.";
  if (profile.sus && !SUS_KEYS.every(key => integerFive(body[key]))) return "Ten 1–5 SUS responses are required.";
  const allowed = new Set([...COMMON_KEYS, ...profile.outcomes, ...(profile.sus ? SUS_KEYS : []), ...(synthetic ? ["synthetic_test"] : [])]);
  if (Object.keys(body).some(key => !allowed.has(key))) return "Unexpected or hidden response field.";
  if (synthetic && (body.synthetic_test !== true || body.workshop_code !== "TEST_PIPELINE")) return "Synthetic test marker required.";
  if (!synthetic && Object.hasOwn(body, "synthetic_test")) return "Synthetic test marker rejected.";
  if (typeof body.turnstile_token !== "string" || body.turnstile_token.length > 2048) return "Invalid human verification token.";
  return null;
}

export function scoreV13(body) {
  const profile = V13_PROFILES[body.variant][body.participant_group];
  const sus = profile.sus ? SUS_KEYS.reduce((sum, key, index) => sum + (index % 2 ? 5 - body[key] : body[key] - 1), 0) * 2.5 : null;
  return {
    comprehension_score: body.comprehension_answers.reduce((sum, answer, index) => sum + Number(answer === ANSWER_KEYS[body.variant][index]), 0),
    sus_score: sus,
    service_confidence_score: (body.service_confidence_1 + body.service_confidence_2) / 2,
    wpt_intention_t1: body.wpt_intention_t1 ?? null,
    v2g_intention_t1: body.v2g_intention_t1 ?? null,
    v2h_intention_t1: body.v2h_intention_t1 ?? null
  };
}

export function minimisedV13(body) {
  const profile = V13_PROFILES[body.variant][body.participant_group];
  const fields = [...COMMON_KEYS.filter(key => key !== "turnstile_token"), ...profile.outcomes, ...(profile.sus ? SUS_KEYS : [])];
  return Object.fromEntries(fields.map(key => [key, body[key]]));
}
