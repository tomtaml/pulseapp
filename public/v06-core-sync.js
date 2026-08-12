const v06SyncParams = new URLSearchParams(location.search);
if ((v06SyncParams.get("variant") || "fi-fleet") === "fi-fleet") {
  const STEP_KEY = "pulse-v06-v3-manual-step";
  const FALLBACK_KEY = "pulse-v06-v3-fallback-rating";
  const screen = document.querySelector("#screen");
  let timer = null;
  let attempts = 0;

  function isPositioningScreen() {
    const h1 = document.querySelector("#screen h1");
    return !!h1 && /Aja langattomalle|Aja latausalueelle|Approach the wireless|position the vehicle/i.test(h1.textContent || "");
  }

  function manualComplete() {
    return Number(sessionStorage.getItem(STEP_KEY) || "0") >= 3;
  }

  function coreAccepted() {
    return /96%|hyväksytty|accepted/i.test(document.querySelector(".alignment-readout")?.textContent || "");
  }

  function hasCoreClarity() {
    return !![...document.querySelectorAll("#screen fieldset legend")].find(el => /Kuinka selkeää kohdistus|How clear were the alignment/i.test(el.textContent || ""));
  }

  function ratingHtml(saved) {
    return `<div class="likert-anchors"><span>Täysin eri mieltä</span><span>Täysin samaa mieltä</span></div><div class="likert" role="radiogroup" aria-label="alignment_fallback_acceptability">${[1,2,3,4,5].map(v => `<label class="likert-option"><input type="radio" name="alignment_fallback_acceptability" value="${v}" ${Number(saved)===v?"checked":""}><span>${v}</span></label>`).join("")}</div>`;
  }

  function ensureFallbackQuestion() {
    const clarityLegend = [...document.querySelectorAll("#screen fieldset legend")].find(el => /Kuinka selkeää kohdistus|How clear were the alignment/i.test(el.textContent || ""));
    const clarity = clarityLegend?.closest("fieldset");
    if (!clarity) return;
    let fallback = document.querySelector("#screen .v06-fallback-rating");
    if (!fallback) {
      fallback = document.createElement("fieldset");
      fallback.className = "v06-fallback-rating";
      clarity.insertAdjacentElement("afterend", fallback);
    }
    const saved = Number(sessionStorage.getItem(FALLBACK_KEY) || "0");
    fallback.innerHTML = `<legend>Kuinka hyväksyttävä tällainen manuaalinen varakohdistus olisi tavallisella jakelupysähdyksellä?</legend>${ratingHtml(saved)}`;
    fallback.querySelectorAll('input[name="alignment_fallback_acceptability"]').forEach(input => {
      input.addEventListener("change", () => {
        sessionStorage.setItem(FALLBACK_KEY, input.value);
        document.querySelector(".v06-extra-error")?.remove();
      });
    });
  }

  function driveCoreAlignment() {
    if (!isPositioningScreen() || !manualComplete()) return;
    if (coreAccepted() && hasCoreClarity()) {
      ensureFallbackQuestion();
      if (timer) { clearInterval(timer); timer = null; }
      return;
    }
    const guided = document.querySelector('.alignment-controls [data-align="guided"]');
    if (guided) {
      guided.dispatchEvent(new MouseEvent("click", { bubbles:true, cancelable:true, view:window }));
      attempts += 1;
    }
    if (attempts > 8 && timer) { clearInterval(timer); timer = null; }
  }

  function arm() {
    if (!isPositioningScreen() || !manualComplete() || timer) return;
    attempts = 0;
    timer = setInterval(driveCoreAlignment, 180);
    driveCoreAlignment();
  }

  document.addEventListener("change", event => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.name === "alignment_fallback_acceptability" && input.checked) {
      sessionStorage.setItem(FALLBACK_KEY, input.value);
      document.querySelector(".v06-extra-error")?.remove();
    }
  }, true);

  if (screen) {
    const observer = new MutationObserver(() => queueMicrotask(() => {
      if (coreAccepted() && hasCoreClarity()) ensureFallbackQuestion();
      arm();
    }));
    observer.observe(screen, { childList:true });
  }
  queueMicrotask(arm);
}
