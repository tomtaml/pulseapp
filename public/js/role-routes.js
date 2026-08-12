export const tampereRouteProfiles = {
  fleet_driver: {
    id: "driver-operational",
    label: { fi: "Kuljettajan operatiivinen reitti", en: "Driver operational route" },
    purpose: "Operational Pilot App use during a delivery stop.",
    modules: ["alignment", "constraints", "v2g_authorisation", "charging_cycle", "winter_recovery", "comprehension", "sus", "fleet_trust"],
    sus: true,
    primaryEvidence: ["alignment clarity", "charging/V2G choice", "override", "winter recovery", "comprehension", "SUS", "trust"]
  },
  dispatcher: {
    id: "operations-control",
    label: { fi: "Ajojärjestelyn / operoinnin reitti", en: "Dispatcher / operations route" },
    purpose: "Operational control, vehicle availability and disruption management.",
    modules: ["vehicle_status", "constraints", "v2g_authorisation", "grid_cycle_monitor", "winter_recovery", "responsibility"],
    sus: false,
    primaryEvidence: ["departure constraints", "vehicle availability", "delay tolerance", "recovery/escalation", "control allocation"]
  },
  fleet_manager: {
    id: "fleet-governance",
    label: { fi: "Kalusto- ja sopimusreitti", en: "Fleet / governance route" },
    purpose: "Procurement, reliability, V2G contract and liability conditions.",
    modules: ["operational_walkthrough", "reliability_threshold", "v2g_contract", "compensation", "battery_guarantee", "liability", "procurement"],
    sus: false,
    primaryEvidence: ["reliability threshold", "compensation", "battery guarantee", "authorisation model", "liability", "procurement condition"]
  },
  other: {
    id: "facilitated-stakeholder",
    label: { fi: "Ohjattu sidosryhmäreitti", en: "Facilitated stakeholder route" },
    purpose: "Use the Pilot App as a concrete discussion stimulus rather than as a driver task.",
    modules: ["walkthrough", "feasibility", "responsibility", "fallback", "srf_log"],
    sus: false,
    primaryEvidence: ["implementation feasibility", "responsibilities", "fallback arrangements", "SRF signals"]
  }
};

export const tampereSocietalProfiles = {
  citizen: {
    id: "citizen-public-space",
    sus: true,
    primaryEvidence: ["wireless/V2G comprehension", "public-space acceptability", "safety", "responsibility"]
  },
  accessibility_representative: {
    id: "accessibility-observed-use",
    sus: true,
    primaryEvidence: ["unaided completion", "accessibility", "comprehension", "trust", "HMI barriers"]
  },
  road_user: {
    id: "road-user-public-space",
    sus: false,
    primaryEvidence: ["curb-space acceptability", "visibility", "safety", "public benefit"]
  }
};
