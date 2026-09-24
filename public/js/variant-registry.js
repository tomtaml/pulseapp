import { tampereRouteProfiles, tampereSocietalProfiles } from "./role-routes.js";

export const MODE_PRESETS = Object.freeze({
  demo: Object.freeze({
    id: "demo",
    modules: Object.freeze({
      scenarioTasks: true,
      measurementFields: false,
      comprehension: false,
      sus: false,
      outcomes: false
    }),
    constructPayload: false,
    submit: false
  }),
  "instrument-preview": Object.freeze({
    id: "instrument-preview",
    modules: Object.freeze({
      scenarioTasks: true,
      measurementFields: true,
      comprehension: true,
      sus: true,
      outcomes: true
    }),
    constructPayload: false,
    submit: false
  }),
  research: Object.freeze({
    id: "research",
    modules: Object.freeze({
      scenarioTasks: true,
      measurementFields: true,
      comprehension: true,
      sus: true,
      outcomes: true
    }),
    constructPayload: true,
    submit: true
  })
});

const FALLBACK_PROFILE = Object.freeze({
  id: "facilitated-stakeholder",
  modules: [],
  sus: false,
  primaryEvidence: []
});

export function resolveInstrumentMode(config = {}, forceDemo = false) {
  if (forceDemo) return "demo";
  const requested = String(config.instrument_mode || "demo");
  if (!Object.hasOwn(MODE_PRESETS, requested)) return "demo";
  if (requested === "research" && config.collection_enabled !== true) {
    return "instrument-preview";
  }
  return requested;
}

export function modePreset(mode) {
  return MODE_PRESETS[mode] || MODE_PRESETS.demo;
}

export function routeProfile(variant, participantGroup) {
  if (variant === "fi-fleet") {
    return tampereRouteProfiles[participantGroup] || tampereRouteProfiles.other || FALLBACK_PROFILE;
  }
  if (variant === "fi-citizen") {
    return tampereSocietalProfiles[participantGroup] || FALLBACK_PROFILE;
  }
  return FALLBACK_PROFILE;
}

export function moduleEnabled(mode, moduleName, profile = FALLBACK_PROFILE) {
  const preset = modePreset(mode);
  if (preset.modules[moduleName] !== true) return false;
  if (moduleName === "sus" && profile.sus === false) return false;
  return true;
}
