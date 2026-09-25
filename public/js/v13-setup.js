import { WORKSHOP_PRESETS } from "./v13-questions.js";

const form = document.querySelector("#workshopSetup");
const preset = form.elements.preset;
const generated = document.querySelector("#generated");
const previewUrl = document.querySelector("#previewUrl");
const openPreview = document.querySelector("#openPreview");
const copyStatus = document.querySelector("#copyStatus");

function updateLanguage() {
  const canUseFinnish = form.elements.site.value === "fi-fleet";
  form.elements.language.querySelector('option[value="fi"]').disabled = !canUseFinnish;
  if (!canUseFinnish) form.elements.language.value = "en";
}

function applyPreset() {
  for (const key of ["questions", "sus", "scales"]) {
    form.elements[key].checked = WORKSHOP_PRESETS[preset.value][key];
  }
  updateLanguage();
  generated.hidden = true;
}

preset.addEventListener("change", applyPreset);
form.addEventListener("change", event => {
  if (event.target !== preset) { updateLanguage(); generated.hidden = true; }
});
form.addEventListener("input", () => { generated.hidden = true; });
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const url = new URL(form.elements.site.value === "fi-fleet" ? "/v13-fleet.html" : "/v13.html", location.origin);
  url.searchParams.set("variant", form.elements.site.value);
  url.searchParams.set("workshop", form.elements.workshop.value);
  url.searchParams.set("lang", form.elements.language.value);
  url.searchParams.set("view", preset.value);
  for (const key of ["questions", "sus", "scales"]) {
    url.searchParams.set(key, form.elements[key].checked ? "1" : "0");
  }
  previewUrl.value = url.href;
  openPreview.href = url.href;
  copyStatus.textContent = "";
  generated.hidden = false;
});
document.querySelector("#copyPreview").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(previewUrl.value);
    copyStatus.textContent = "Link copied.";
  } catch {
    previewUrl.select();
    copyStatus.textContent = "Select and copy the link above.";
  }
});
applyPreset();
