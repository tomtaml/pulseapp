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

    // Workshop RC1 is intentionally single-run. Replay previously reactivated
    // legacy cycle layers and could produce duplicate charging views.
    screen.querySelectorAll(".v1-replay-adapter-cycle").forEach(button => button.remove());
  }

  if (screen) {
    screen.addEventListener("click", event => {
      const replay = event.target.closest?.(".v1-replay-adapter-cycle");
      if (!replay) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      replay.remove();
    }, true);

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
