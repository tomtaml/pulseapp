const v142Params = new URLSearchParams(location.search);

if ((v142Params.get("variant") || "fi-fleet") === "fi-fleet" && v142Params.get("ops") !== "1") {
  const screen = document.querySelector("#screen");
  const fi = () => document.documentElement.lang === "fi";

  function isCycleScreen() {
    const heading = screen?.querySelector("h1")?.textContent || "";
    return /latausta|charging|V2G activation|lähtövalmiutta|departure readiness/i.test(heading);
  }

  function syncPacingCopy() {
    if (!screen || !isCycleScreen()) return;

    const heading = screen.querySelector("h1");
    const lead = heading?.nextElementSibling;
    if (lead?.classList.contains("lead")) {
      lead.textContent = fi()
        ? "Noin 75 minuutin pysäköintijakso nopeutetaan noin 30 sekuntiin. Seuraa akun varausta, energian suuntaa, 15 minuutin verkkotilannetta ja V2G-hyvityksen kertymistä."
        : "About 75 minutes of parked availability is compressed into roughly 30 seconds. Follow battery state, energy direction, 15-minute grid context and the accumulating V2G credit.";
    }

    screen.querySelectorAll(".v1-run-adapter-cycle, .v07-run-cycle").forEach(button => {
      button.textContent = fi()
        ? "Käynnistä noin 30 s nopeutettu jakso"
        : "Run ~30 s accelerated cycle";
    });
  }

  if (screen) {
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        syncPacingCopy();
      });
    }).observe(screen, { childList: true, subtree: true });
  }

  new MutationObserver(syncPacingCopy).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  document.querySelector("#languageBtn")?.addEventListener("click", () => {
    requestAnimationFrame(syncPacingCopy);
  });

  syncPacingCopy();
}
