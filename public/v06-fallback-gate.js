const v06GateParams = new URLSearchParams(location.search);
if ((v06GateParams.get("variant") || "fi-fleet") === "fi-fleet") {
  const KEY = "pulse-v06-v3-fallback-rating";
  const MIRROR_ID = "v06FallbackRatingMirror";

  function isPositioningScreen() {
    const heading = document.querySelector("#screen h1");
    return !!heading && /Aja langattomalle|Aja latausalueelle|Approach the wireless|position the vehicle/i.test(heading.textContent || "");
  }

  function syncMirror() {
    const saved = Number(sessionStorage.getItem(KEY) || "0");
    let mirror = document.getElementById(MIRROR_ID);
    if (!isPositioningScreen() || saved < 1 || saved > 5) {
      mirror?.remove();
      return;
    }
    if (!mirror) {
      mirror = document.createElement("input");
      mirror.id = MIRROR_ID;
      mirror.type = "radio";
      mirror.name = "alignment_fallback_acceptability";
      mirror.hidden = true;
      mirror.setAttribute("aria-hidden", "true");
      document.body.appendChild(mirror);
    }
    mirror.value = String(saved);
    mirror.checked = true;
  }

  document.addEventListener("change", event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.name !== "alignment_fallback_acceptability" || !input.checked) return;
    sessionStorage.setItem(KEY, input.value);
    document.querySelector(".v06-extra-error")?.remove();
    syncMirror();
  }, true);

  const screen = document.querySelector("#screen");
  if (screen) {
    const observer = new MutationObserver(() => queueMicrotask(syncMirror));
    observer.observe(screen, { childList: true });
  }
  queueMicrotask(syncMirror);
}
