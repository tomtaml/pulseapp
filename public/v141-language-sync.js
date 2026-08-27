const v141LangParams = new URLSearchParams(location.search);

if ((v141LangParams.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");

  function syncFallbackLikertLanguage() {
    const fieldset = screen?.querySelector(".v06-fallback-rating");
    if (!fieldset) return;

    const isFinnish = document.documentElement.lang === "fi";
    const legend = fieldset.querySelector("legend");
    const anchors = fieldset.querySelectorAll(".likert-anchors span");

    if (legend) {
      legend.textContent = isFinnish
        ? "Kuinka hyväksyttävä tällainen manuaalinen varakohdistus olisi tavallisella jakelupysähdyksellä?"
        : "How acceptable would this type of manual fallback positioning be during a normal delivery stop?";
    }

    if (anchors[0]) anchors[0].textContent = isFinnish ? "Täysin eri mieltä" : "Strongly disagree";
    if (anchors[1]) anchors[1].textContent = isFinnish ? "Täysin samaa mieltä" : "Strongly agree";
  }

  const languageObserver = new MutationObserver(syncFallbackLikertLanguage);
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  if (screen) {
    const screenObserver = new MutationObserver(syncFallbackLikertLanguage);
    screenObserver.observe(screen, { childList: true, subtree: true });
  }

  document.querySelector("#languageBtn")?.addEventListener("click", () => {
    requestAnimationFrame(syncFallbackLikertLanguage);
  });

  syncFallbackLikertLanguage();
}
