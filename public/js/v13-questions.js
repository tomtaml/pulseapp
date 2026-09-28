// URL presets only control which preview pages appear. They never unlock
// collection; production submissions continue to use the complete schema.
export const WORKSHOP_PRESETS = Object.freeze({
  demo: Object.freeze({ questions: false, sus: false, scales: false }),
  questions: Object.freeze({ questions: true, sus: false, scales: false }),
  full: Object.freeze({ questions: true, sus: true, scales: true })
});

export function resolveWorkshopView(params) {
  const legacyDemo = params.get("demo") === "1";
  const workshopOnly = legacyDemo || params.has("view") || ["questions", "sus", "scales"].some(key => params.has(key));
  const preset = legacyDemo ? "demo" : Object.hasOwn(WORKSHOP_PRESETS, params.get("view")) ? params.get("view") : "full";
  const modules = { ...WORKSHOP_PRESETS[preset] };
  if (!legacyDemo) for (const key of ["questions", "sus", "scales"]) {
    if (["0", "1"].includes(params.get(key))) modules[key] = params.get(key) === "1";
  }
  return { modules, workshopOnly };
}

export function workshopPages(variant, participantGroup, modules, profiles) {
  const pages = variant === "uk-v2h"
    ? ["intro", "home_intro", "energy"]
    : variant === "gr-prosumer" ? ["intro", "gr_arrival", "scenario", "recovery", "energy"]
    : ["intro", "alignment", "scenario", "energy", "recovery"];
  if (modules.questions && variant === "uk-v2h") pages.push("uk_probes");
  if (modules.questions && variant === "gr-prosumer") pages.push("gr_probes");
  if (modules.questions) pages.push("comprehension");
  if (modules.sus && profiles[variant]?.[participantGroup]?.sus) pages.push("sus");
  if (modules.scales) pages.push("outcomes");
  return [...pages, "done"];
}

export function resolveWorkshopMode(config, { modules, workshopOnly }) {
  if (!modules.questions && !modules.sus && !modules.scales) return "demo";
  if (!workshopOnly && config.instrument_mode === "research" && config.collection_enabled === true) return "research";
  return "instrument-preview";
}

export function resolveSiteMode(config, view, variant) {
  const mode = resolveWorkshopMode(config, view);
  // Focused site journeys contain draft tasks that the current research
  // submission contract does not represent. Keep them workshop-only.
  return ["uk-v2h", "gr-prosumer"].includes(variant) && mode === "research" ? "instrument-preview" : mode;
}

export function workshopOutcomeKeys(variant, profile) {
  return variant === "uk-v2h" ? profile.outcomes.filter(key => key !== "wpt_intention_t1") : profile.outcomes;
}

export function rc1FleetWorkshopMode(view) {
  return {
    id: "v13-fleet-preview",
    modules: {
      scenarioTasks: true, measurementFields: false,
      comprehension: view.modules.questions, sus: view.modules.sus,
      outcomes: view.modules.scales
    },
    constructPayload: false, submit: false
  };
}

export const SITES = Object.freeze({
  "fi-fleet": {
    title: "Tampere fleet charging", badge: "Finland · fleet · V2G", languages: ["en", "fi"],
    // Working RC1 Finnish scenario wording for the storage-free demo only.
    demoFi: {
      title: "Langaton lataus + V2G jakelukalustolle", badge: "Suomi · jakelukalusto · V2G",
      intro: "Käy läpi kuvitteellinen Tampereen jakelupysähdys: kohdista auto, turvaa seuraava toimitus, tarkastele V2G-mahdollisuutta ja ratkaise talvihäiriö. Testaamme palvelua, emme teknistä osaamistasi.",
      roles: { fleet_driver: "Kuljettaja", dispatcher: "Ajojärjestelijä / operointi", fleet_manager: "Kalustopäällikkö" },
      roleScenario: null, roleRecovery: null,
      scenario: "Seuraava toimitus lähtee pian. Miten lataus ja mahdollinen V2G-jakso pitäisi järjestää?",
      scenarioOptions: [
        ["charge_now", "Lataa nyt palauttamatta sähköä verkkoon"],
        ["protect_departure", "Turvaa lähtövaraus ja näytä käytettävissä oleva latausaika"],
        ["authorise_v2g", "Salli V2G suojatun lähtövarauksen rajoissa"]
      ],
      recovery: "Lumi ja loska häiritsevät kohdistusta. Seuraava toimitus lähtee 25 minuutin kuluttua. Mitä tekisit?",
      recoveryOptions: [
        ["retry_alignment", "Kohdista uudelleen ja yritä latausta"],
        ["stop_and_leave", "Keskeytä lataus ja jatka suojatulla lähtövarauksella"],
        ["contact_dispatch", "Ota yhteys ajojärjestelyyn"]
      ]
    },
    intro: "A delivery van charges wirelessly during a Tampere stop. Its next departure and minimum reserve stay protected while the fleet considers a short V2G window. In this proposed service, the driver could leave early and stop energy sharing at any time.",
    scenario: "The next delivery leaves soon. Choose how the service should proceed before the V2G window.",
    scenarioOptions: [
      ["charge_now", "Charge now without exporting energy"],
      ["protect_departure", "Protect departure reserve and show available charging time"],
      ["authorise_v2g", "Authorise V2G within the protected reserve"]
    ],
    recovery: "Snow and slush interrupt alignment. The next delivery is due in 25 minutes. What should happen?",
    recoveryOptions: [
      ["retry_alignment", "Realign and retry"], ["stop_and_leave", "Stop and leave with the protected reserve"],
      ["contact_dispatch", "Contact dispatch for a decision"]
    ],
    roleScenario: {
      fleet_driver: "You are driving the next delivery. Review the protected departure reserve before any V2G window.",
      dispatcher: "You are watching fleet availability. One vehicle has a delivery due soon; decide how its charging and V2G window should be handled.",
      fleet_manager: "You are reviewing a proposed fleet energy agreement. Choose which charging and V2G behavior the service must support before adoption."
    },
    roleRecovery: {
      fleet_driver: "Snow and slush interrupt alignment. Your next delivery is due in 25 minutes. What would you do?",
      dispatcher: "Snow and slush interrupt a vehicle's alignment. Its next delivery is due in 25 minutes. How should operations respond?",
      fleet_manager: "A winter alignment failure threatens a scheduled delivery. Which fallback would your fleet policy require?"
    },
    roles: {
      fleet_driver: "Fleet driver", dispatcher: "Dispatcher", fleet_manager: "Fleet manager"
    }
  },
  "gr-prosumer": {
    title: "Trikala passenger charging", badge: "Greece · passenger · tariff and RES", languages: ["en", "el"],
    intro: "Try one simulated passenger-car stop at a wireless bay in Trikala. Position the car, set the minimum needed for the next trip, and compare charging now with later price and renewable-availability signals. A hot-weather start delay requires a recovery decision. Then watch the chosen charging session and decide separately whether to permit V2G export. All prices, times and energy amounts are illustrative workshop assumptions, not a local offer or live forecast.",
    scenario: "The same parked car can charge in one of three example windows. Set a protected next-trip minimum and departure, then compare price and renewable availability separately. Later windows must still leave the car ready in time.",
    scenarioOptions: [
      ["charge_now", "Charge now"], ["wait_for_lower_tariff", "Wait for the lower tariff"],
      ["wait_for_res_surplus", "Wait for the renewable surplus"]
    ],
    recovery: "On a hot afternoon the chosen wireless charging session is delayed before energy begins to move. Your next trip still needs its protected minimum. How should the plan recover?",
    recoveryOptions: [
      ["retry", "Retry the planned session"], ["charge_now", "Charge now for the next trip"],
      ["contact_provider", "Contact provider about an assisted charge-now fallback"]
    ],
    roles: { passenger_prosumer: "Passenger car driver" }
  },
  "uk-v2h": {
    title: "Oxfordshire home parking and V2H", badge: "UK · accessible home V2H", languages: ["en"],
    intro: "Try one illustrative overnight home journey. Check the surroundings before guided parking beside the house. If an obstacle appears or guidance fails, review the route and try the manual arrow controls. Once parked, choose a minimum charge for the morning journey, watch the car charge, then see how it can support the house. The example assumes home-support permission for this story; you can stop it. This is a simulation, not a verified vehicle or home installation.",
    roles: { accessible_driver: "Accessible driver" }
  }
});

export const COMMON_QUESTIONS = [
  ["service_confidence_1", "I am confident the service would protect the energy needed for my next journey or task."],
  ["service_confidence_2", "I am confident I could recover or get help if charging or energy sharing failed."]
];

export const OUTCOME_QUESTIONS = {
  wpt_intention_t1: "I would use wireless charging in a suitable setting if it were available.",
  v2g_intention_t1: "I would allow vehicle-to-grid energy sharing if the reserve, permission and override worked as shown.",
  v2h_intention_t1: "I would use vehicle-to-home energy support if the next-trip reserve and override worked as shown.",
  actor_trust_item: "I would trust the responsible service operator to explain the energy decision and resolve a failure.",
  fairness_item: "The proposed benefits and costs of this charging arrangement seem fairly distributed.",
  accessibility_item: "I could understand and operate the essential controls without assistance."
};

export const COMPREHENSION = [
  ["Can the vehicle be taken back into use before the planned departure?", [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]]],
  ["Can energy sharing reduce the battery below its protected reserve?", [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]]],
  ["Where does exported energy go in this scenario?", [["charge", "Into the vehicle"], ["export", "To the grid"], ["home", "To the home"], ["unsure", "Not sure"]]],
  ["Who can stop energy sharing when a journey is needed?", [["driver", "The driver"], ["operator", "Only the operator"], ["automatic", "Only the system"], ["unsure", "Not sure"]]]
];
