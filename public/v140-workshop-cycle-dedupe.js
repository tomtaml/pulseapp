const v140Params = new URLSearchParams(location.search);

if ((v140Params.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");

  function suppressLegacyCycleCards() {
    const adapter = screen?.querySelector(".v1-adapter-cycle");
    if (!adapter) return;

    screen.querySelectorAll(".v07-cycle-card, .cycle-card, .v06-cycle-card").forEach(card => {
      if (card === adapter || card.closest(".v1-adapter-cycle")) return;
      card.hidden = true;
      card.setAttribute("aria-hidden", "true");
      card.style.setProperty("display", "none", "important");
      card.style.setProperty("visibility", "hidden", "important");
    });

    // v071 still adds its own legacy replay wrapper after the hidden v07 card.
    // Keep the adapter-backed replay button as the single participant control.
    screen.querySelectorAll(".v071-replay-wrap").forEach(replay => {
      replay.hidden = true;
      replay.setAttribute("aria-hidden", "true");
      replay.style.setProperty("display", "none", "important");
      replay.style.setProperty("visibility", "hidden", "important");
    });
  }

  if (screen) {
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        suppressLegacyCycleCards();
      });
    });
    observer.observe(screen, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style", "class"] });
    suppressLegacyCycleCards();
  }
}
