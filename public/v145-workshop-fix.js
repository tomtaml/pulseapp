// Workshop RC1 fixes: explicit language deep-link, stable bottom navigation, and SUS progress cue.

const v145Params = new URLSearchParams(location.search);
const v145RequestedLanguage = v145Params.get("lang");

function v145SyncLanguageUrl() {
  const current = document.documentElement.lang;
  if (!["fi", "en"].includes(current)) return;
  const url = new URL(location.href);
  url.searchParams.set("lang", current);
  window.history.replaceState({}, "", url);
}

let v145LanguageApplied = false;

function v145ApplyRequestedLanguage() {
  if (v145LanguageApplied || !["fi", "en"].includes(v145RequestedLanguage)) return;
  const current = document.documentElement.lang;
  if (current !== v145RequestedLanguage) {
    const languageButton = document.querySelector("#languageBtn");
    if (languageButton) {
      languageButton.click();
      v145LanguageApplied = true;
    }
  }
  v145SyncLanguageUrl();
}

[0, 50, 200, 500].forEach((delay) => {
  window.setTimeout(v145ApplyRequestedLanguage, delay);
});

document.querySelector("#languageBtn")?.addEventListener("click", () => {
  window.requestAnimationFrame(v145SyncLanguageUrl);
});

const v145Style = document.createElement("style");
v145Style.textContent = `
:root {
  --v145-footer-height: 3.5rem;
  --v145-actions-height: 5.5rem;
}

.footer {
  position: fixed !important;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 8;
}

.actions,
.sus-step .actions {
  position: fixed !important;
  left: 50%;
  right: auto !important;
  bottom: var(--v145-footer-height) !important;
  transform: translateX(-50%);
  width: min(680px, calc(100% - 2rem));
  z-index: 20;
  margin: 0 !important;
  padding: .65rem .25rem .25rem;
  background: linear-gradient(to bottom, transparent, var(--surface) 18%);
}

.shell {
  padding-bottom: calc(1rem + var(--v145-footer-height) + var(--v145-actions-height)) !important;
}

.card {
  padding-bottom: calc(clamp(1rem, 4vw, 1.45rem) + var(--v145-actions-height)) !important;
}

.v145-sus-status {
  margin: .5rem 0 1rem;
  font-weight: 700;
}

@media (max-width: 520px) {
  :root {
    --v145-footer-height: 3.25rem;
    --v145-actions-height: 5.8rem;
  }

  .actions,
  .sus-step .actions {
    left: 0;
    right: 0 !important;
    bottom: var(--v145-footer-height) !important;
    transform: none;
    width: 100%;
    padding: .55rem .7rem calc(.55rem + env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--border);
  }

  .shell {
    padding-bottom: calc(1rem + var(--v145-footer-height) + var(--v145-actions-height)) !important;
  }

  .card {
    padding-bottom: calc(1rem + var(--v145-actions-height)) !important;
  }
}
`;
document.head.appendChild(v145Style);

let v145SusFrame = 0;

function v145ScheduleSusStatus() {
  if (v145SusFrame) return;
  v145SusFrame = window.requestAnimationFrame(() => {
    v145SusFrame = 0;
    v145UpdateSusStatus();
  });
}

function v145UpdateSusStatus() {
  const screen = document.querySelector("#screen");
  if (!screen?.classList.contains("sus-step")) {
    screen?.querySelector(".v145-sus-status")?.remove();
    return;
  }

  const form = screen.querySelector(".sus-form");
  if (!form) return;

  const count = form.querySelectorAll('input[name^="sus_"]:checked').length;
  let status = screen.querySelector(".v145-sus-status");

  if (!status) {
    status = document.createElement("p");
    status.className = "v145-sus-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    form.insertAdjacentElement("beforebegin", status);
  }

  const english = document.documentElement.lang !== "fi";
  const nextText = english
    ? `SUS responses completed: ${count} / 10${count === 10 ? " — ready to continue." : " — answer all statements before continuing."}`
    : `SUS-vastauksia: ${count} / 10${count === 10 ? " — voit jatkaa." : " — vastaa kaikkiin väittämiin ennen jatkamista."}`;

  if (status.textContent !== nextText) status.textContent = nextText;
}

const v145Screen = document.querySelector("#screen");
if (v145Screen) {
  const v145Observer = new MutationObserver(v145ScheduleSusStatus);
  v145Observer.observe(v145Screen, { childList: true, subtree: true });
  v145Screen.addEventListener("change", (event) => {
    if (event.target.matches('input[name^="sus_"]')) v145ScheduleSusStatus();
  });
  v145UpdateSusStatus();
}


function v145SyncFallbackLanguage() {
  const screen = document.querySelector("#screen");
  if (!screen) return;

  const fieldset = [...screen.querySelectorAll("fieldset")].find((item) => {
    const text = item.querySelector("legend")?.textContent || "";
    return /Kuinka hyväksyttävä tällainen manuaalinen varakohdistus|How acceptable would this type of manual fallback positioning/i.test(text);
  });
  if (!fieldset) return;

  const english = document.documentElement.lang !== "fi";
  const copy = english
    ? {
        question: "How acceptable would this type of manual fallback positioning be during a normal delivery stop?",
        low: "Strongly disagree",
        high: "Strongly agree"
      }
    : {
        question: "Kuinka hyväksyttävä tällainen manuaalinen varakohdistus olisi tavallisella jakelupysähdyksellä?",
        low: "Täysin eri mieltä",
        high: "Täysin samaa mieltä"
      };

  const legend = fieldset.querySelector("legend");
  const anchors = fieldset.querySelectorAll(".likert-anchors span");
  if (legend && legend.textContent !== copy.question) legend.textContent = copy.question;
  if (anchors[0] && anchors[0].textContent !== copy.low) anchors[0].textContent = copy.low;
  if (anchors[1] && anchors[1].textContent !== copy.high) anchors[1].textContent = copy.high;
}

let v145FallbackFrame = 0;
function v145ScheduleFallbackLanguage() {
  if (v145FallbackFrame) return;
  v145FallbackFrame = window.requestAnimationFrame(() => {
    v145FallbackFrame = 0;
    v145SyncFallbackLanguage();
  });
}

if (v145Screen) {
  const v145FallbackObserver = new MutationObserver(v145ScheduleFallbackLanguage);
  v145FallbackObserver.observe(v145Screen, { childList: true, subtree: true });
  v145SyncFallbackLanguage();
}
