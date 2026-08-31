const v143Params = new URLSearchParams(location.search);

if ((v143Params.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");

  const slotCopy = [
    { demand: ["keskitaso", "moderate"], res: ["paljon", "high"] },
    { demand: ["nouseva", "rising"], res: ["paljon", "high"] },
    { demand: ["korkea", "high"], res: ["vähemmän", "lower"] },
    { demand: ["korkea", "high"], res: ["vähemmän", "lower"] },
    { demand: ["laskeva", "easing"], res: ["keskitaso", "moderate"] },
    { demand: ["keskitaso", "moderate"], res: ["keskitaso", "moderate"] }
  ];

  function syncMarketLanguage() {
    if (!screen) return;
    const isFinnish = document.documentElement.lang === "fi";
    const index = isFinnish ? 0 : 1;

    screen.querySelectorAll(".v07-market").forEach(market => {
      const headStrong = market.querySelector(".v07-market-head strong");
      const headSmall = market.querySelector(".v07-market-head small");
      if (headStrong) {
        const value = isFinnish ? "15 min sähköjärjestelmän tilanne" : "15-minute electricity-system context";
        if (headStrong.textContent !== value) headStrong.textContent = value;
      }
      if (headSmall) {
        const value = isFinnish ? "Kuvitteelliset työpaja-arvot" : "Illustrative workshop values";
        if (headSmall.textContent !== value) headSmall.textContent = value;
      }

      market.querySelectorAll(".v07-market-slot").forEach((slot, i) => {
        const copy = slotCopy[i];
        if (!copy) return;
        const spans = slot.querySelectorAll("span");
        if (spans[0]) {
          const value = `${isFinnish ? "kys." : "dem."} ${copy.demand[index]}`;
          if (spans[0].textContent !== value) spans[0].textContent = value;
        }
        if (spans[1]) {
          const value = `RES ${copy.res[index]}`;
          if (spans[1].textContent !== value) spans[1].textContent = value;
        }
      });

      const foot = market.querySelector(".v07-market-foot");
      if (foot) {
        const value = isFinnish
          ? "* Hintasignaali on havainnollistava. V2G-hyvitys käyttää erillistä kuvitteellista sopimushintaa 0,25 €/kWh."
          : "* Price signal is illustrative. V2G credit uses a separate fictional contract rate of €0.25/kWh.";
        if (foot.textContent !== value) foot.textContent = value;
      }
    });
  }

  window.addEventListener("pulse:charging-snapshot", syncMarketLanguage);
  window.addEventListener("pulse:charging-ready", syncMarketLanguage);

  new MutationObserver(syncMarketLanguage).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  document.querySelector("#languageBtn")?.addEventListener("click", () => {
    requestAnimationFrame(syncMarketLanguage);
  });

  if (screen) {
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        syncMarketLanguage();
      });
    }).observe(screen, { childList: true, subtree: true });
  }

  syncMarketLanguage();
}
