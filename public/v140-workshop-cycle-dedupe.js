const v140Params = new URLSearchParams(location.search);

if ((v140Params.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");

  function suppressLegacyCycleCards() {
    const adapter = screen?.querySelector(".v1-adapter-cycle");
    if (!adapter) return;

    screen.querySelectorAll(".v07-cycle-card, .cycle-card").forEach(card => {
      if (card === adapter || card.closest(".v1-adapter-cycle")) return;
      card.hidden = true;
      card.setAttribute("aria-hidden", "true");
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
    observer.observe(screen, { childList: true, subtree: true });
    suppressLegacyCycleCards();
  }
}
