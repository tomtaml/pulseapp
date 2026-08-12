const v08CleanupParams = new URLSearchParams(location.search);
if ((v08CleanupParams.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");
  const workshop = (v08CleanupParams.get("workshop") || "DEMO").replace(/[^A-Za-z0-9_-]/g, "").slice(0,32) || "DEMO";
  const roleKey = `pulse-v08-role-${workshop}`;

  function isDispatcher() {
    const checked = document.querySelector('input[name="participant_group"]:checked')?.value;
    return (checked || sessionStorage.getItem(roleKey) || "") === "dispatcher";
  }

  function isDispatcherStatus() {
    const h1 = document.querySelector("#screen h1")?.textContent || "";
    return isDispatcher() && /Ajoneuvo saapui langattomalle|Vehicle arrived at the wireless/i.test(h1);
  }

  function clean() {
    if (!isDispatcherStatus()) return;

    // Driver-only positioning layers must never appear in the dispatcher route.
    document.querySelector("#screen .v06-positioning")?.remove();
    document.querySelector("#screen .v06-fallback-rating")?.remove();
    document.querySelector("#screen .v06-extra-error")?.remove();

    [
      ".bay-visual",
      ".alignment-controls",
      ".scenario-condition-v05",
      ".auto-failure-v05",
      ".v06-old-align-notice"
    ].forEach(selector => {
      document.querySelectorAll(`#screen ${selector}`).forEach(el => {
        el.hidden = true;
        el.style.setProperty("display", "none", "important");
      });
    });

    [...document.querySelectorAll("#screen fieldset legend")].forEach(legend => {
      if (/Pinta tässä skenaariossa|Surface in this scenario|manuaalinen varakohdistus|manual fallback positioning/i.test(legend.textContent || "")) {
        const fs = legend.closest("fieldset");
        if (fs) {
          fs.hidden = true;
          fs.style.setProperty("display", "none", "important");
        }
      }
    });

    // v0.6 installed a capture-phase validator for the driver's manual fallback item.
    // Dispatcher participants never answer that driver-only question, so keep one
    // hidden compatibility value to prevent the obsolete validator from blocking Next.
    if (!document.querySelector('#screen .v08-dispatcher-compat')) {
      const compat = document.createElement("div");
      compat.className = "v08-dispatcher-compat";
      compat.hidden = true;
      compat.innerHTML = '<input type="radio" name="alignment_fallback_acceptability" value="3" checked>';
      document.querySelector("#screen .v08-dispatcher-status")?.appendChild(compat);
    }

    const clarity = document.querySelector('input[name="alignment_clarity"]')?.closest("fieldset");
    if (clarity) {
      clarity.hidden = false;
      clarity.style.removeProperty("display");
      const actions = document.querySelector("#screen .actions");
      if (actions && clarity.nextElementSibling !== actions) actions.insertAdjacentElement("beforebegin", clarity);
    }

    // Keep only dispatcher-facing content on this page.
    [...screen.children].forEach(el => {
      const keep = el.matches(".progress,.step-label,h1,.lead,.actions,.v08-dispatcher-status") || el === clarity;
      if (!keep) {
        el.hidden = true;
        el.style.setProperty("display", "none", "important");
      }
    });
  }

  if (screen) {
    const observer = new MutationObserver(() => queueMicrotask(clean));
    observer.observe(screen, { childList: true });
    queueMicrotask(clean);
  }
}
