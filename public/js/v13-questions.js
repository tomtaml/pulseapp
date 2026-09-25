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
  const pages = ["intro", ...(variant === "fi-fleet" ? ["alignment"] : []), "scenario", "energy", "recovery"];
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

export const SITES = Object.freeze({
  "fi-fleet": {
    title: "Tampere fleet charging", badge: "Finland · fleet · V2G", languages: ["en", "fi"],
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
    intro: "A passenger car is parked in Trikala. Compare charging now with a lower tariff and a renewable energy surplus, then decide whether to shift the session. In this proposed service, you could leave early. A separate V2G offer would need your permission and a protected reserve; you could stop energy sharing at any time.",
    scenario: "The app shows a cheaper later tariff and a renewable surplus period. The next trip still needs a protected reserve. With permission, V2G would return energy to the grid. Which charging option would you choose?",
    scenarioOptions: [
      ["charge_now", "Charge now"], ["wait_for_lower_tariff", "Wait for the lower tariff"],
      ["wait_for_res_surplus", "Wait for the renewable surplus"]
    ],
    recovery: "The chosen charging session cannot start. How should the app recover?",
    recoveryOptions: [
      ["retry", "Retry the planned session"], ["charge_now", "Charge now for the next trip"],
      ["contact_provider", "Contact the service provider"]
    ],
    roles: { passenger_prosumer: "Passenger car driver" }
  },
  "uk-v2h": {
    title: "Accessible home energy", badge: "UK · accessible driver · V2H", languages: ["en"],
    intro: "An accessible vehicle charges wirelessly at home. It may support home demand while protecting the charge needed for the next trip. In this proposed service, you could leave early and stop home energy sharing at any time. A conductive gully is available as a fallback.",
    scenario: "Home demand rises before the next trip. Choose how the vehicle and home should share energy.",
    scenarioOptions: [
      ["charge_now", "Charge the vehicle now"], ["support_home", "Support the home within the protected reserve"],
      ["protect_trip", "Keep all available charge for the trip"]
    ],
    recovery: "Rain interrupts wireless alignment. The vehicle needs charge for the next trip. What would you use?",
    recoveryOptions: [
      ["retry_wireless", "Retry wireless positioning"], ["use_conductive_fallback", "Use the conductive gully fallback"],
      ["stop_and_leave", "Stop and leave with the available charge"]
    ],
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
