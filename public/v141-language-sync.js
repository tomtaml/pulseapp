const v141LangParams = new URLSearchParams(location.search);

if ((v141LangParams.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");
  const FALLBACK_KEY = "pulse-v06-v3-fallback-rating";
  const STEP_KEY = "pulse-v06-v3-manual-step";

  function isFinnish() {
    return document.documentElement.lang === "fi";
  }

  function manualFallbackComplete() {
    const step = Number(sessionStorage.getItem(STEP_KEY) || "0");
    return step >= 3 || !!screen?.querySelector(".v06-success");
  }

  function findClarityFieldset() {
    const legend = [...(screen?.querySelectorAll("fieldset legend") || [])].find(el => {
      const text = el.textContent || "";
      return /kohdistus.*selke|alignment.*clear|clear.*alignment/i.test(text);
    });
    return legend?.closest("fieldset") || null;
  }

  function fallbackCopy() {
    return isFinnish()
      ? {
          question: "Kuinka hyväksyttävä tällainen manuaalinen varakohdistus olisi tavallisella jakelupysähdyksellä?",
          low: "Täysin eri mieltä",
          high: "Täysin samaa mieltä"
        }
      : {
          question: "How acceptable would this type of manual fallback positioning be during a normal delivery stop?",
          low: "Strongly disagree",
          high: "Strongly agree"
        };
  }

  function buildFallbackFieldset(clarityFieldset) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "v06-fallback-rating";
    const saved = Number(sessionStorage.getItem(FALLBACK_KEY) || "0");
    const copy = fallbackCopy();
    fieldset.innerHTML = `<legend>${copy.question}</legend>
      <div class="likert-anchors"><span>${copy.low}</span><span>${copy.high}</span></div>
      <div class="likert" role="radiogroup" aria-label="alignment_fallback_acceptability">
        ${[1,2,3,4,5].map(v => `<label class="likert-option"><input type="radio" name="alignment_fallback_acceptability" value="${v}" ${saved === v ? "checked" : ""}><span>${v}</span></label>`).join("")}
      </div>`;
    fieldset.querySelectorAll('input[name="alignment_fallback_acceptability"]').forEach(input => {
      input.addEventListener("change", () => {
        sessionStorage.setItem(FALLBACK_KEY, input.value);
        screen?.querySelector(".v06-extra-error")?.remove();
      });
    });
    clarityFieldset.insertAdjacentElement("afterend", fieldset);
    return fieldset;
  }

  function syncFallbackLikertLanguage() {
    if (!screen || !manualFallbackComplete()) return;
    const clarityFieldset = findClarityFieldset();
    if (!clarityFieldset) return;

    let fieldset = screen.querySelector(".v06-fallback-rating");
    if (!fieldset) fieldset = buildFallbackFieldset(clarityFieldset);

    const copy = fallbackCopy();
    const legend = fieldset.querySelector("legend");
    const anchors = fieldset.querySelectorAll(".likert-anchors span");

    if (legend && legend.textContent !== copy.question) legend.textContent = copy.question;
    if (anchors[0] && anchors[0].textContent !== copy.low) anchors[0].textContent = copy.low;
    if (anchors[1] && anchors[1].textContent !== copy.high) anchors[1].textContent = copy.high;
  }

  let scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncFallbackLikertLanguage();
    });
  }

  const languageObserver = new MutationObserver(scheduleSync);
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  if (screen) {
    const screenObserver = new MutationObserver(scheduleSync);
    screenObserver.observe(screen, { childList: true, subtree: true });
  }

  document.querySelector("#languageBtn")?.addEventListener("click", scheduleSync);
  scheduleSync();
}
