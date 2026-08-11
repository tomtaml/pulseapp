import { copy } from "./copy.js";

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

export function t(language, key) { return copy[language][key] || copy.en[key]; }

export function progress(step) {
  return `<div class="progress" aria-label="Progress"><div style="width:${Math.round((step / 10) * 100)}%"></div></div>`;
}

export function actions(language, step, nextLabel = t(language, "continue"), allowBack = true) {
  return `<div class="actions">${allowBack && step > 0 ? `<button class="secondary" data-action="back">${t(language, "back")}</button>` : ""}<button class="primary" data-action="next">${nextLabel}</button></div>`;
}

export function radioGroup(name, options, value) {
  return `<div class="options">${options.map(([v, label]) => `<label class="option"><input type="radio" name="${name}" value="${esc(v)}" ${value === v ? "checked" : ""}><span>${esc(label)}</span></label>`).join("")}</div>`;
}

export function likert(language, name, value = 3) {
  return `<div class="likert-anchors"><span>${t(language, "stronglyDisagree")}</span><span>${t(language, "stronglyAgree")}</span></div><div class="likert" role="radiogroup" aria-label="${esc(name)}">${[1,2,3,4,5].map(v => `<label class="likert-option"><input type="radio" name="${name}" value="${v}" ${Number(value) === v ? "checked" : ""}><span>${v}</span></label>`).join("")}</div>`;
}
