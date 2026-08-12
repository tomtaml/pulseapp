const v06FixParams = new URLSearchParams(location.search);
const v06FixVariant = v06FixParams.get("variant") || "fi-fleet";

if (v06FixVariant === "fi-fleet") {
  const screen = document.querySelector("#screen");
  const fi = () => document.documentElement.lang === "fi";
  const tr = (fiText, enText) => fi() ? fiText : enText;

  const AUTO_KEY = "pulse-v06-v2-auto-tried";
  const STEP_KEY = "pulse-v06-v2-manual-step";
  const WRONG_KEY = "pulse-v06-v2-wrong-moves";
  const FALLBACK_KEY = "pulse-v06-v2-fallback-rating";

  function isPositioningScreen() {
    const heading = document.querySelector("h1");
    return !!heading && /Aja langattomalle|Aja latausalueelle|Approach the wireless|position the vehicle/i.test(heading.textContent || "");
  }

  function mainAlignmentAccepted() {
    const text = document.querySelector(".alignment-readout")?.textContent || "";
    return /96%|hyväksytty|accepted/i.test(text);
  }

  function manualStep() {
    if (mainAlignmentAccepted()) return 3;
    const n = Number(sessionStorage.getItem(STEP_KEY) || "0");
    return Number.isFinite(n) ? Math.max(0, Math.min(3, n)) : 0;
  }

  function positioningState(step) {
    if (step >= 3) return {
      score: 96, x: 0, y: 4,
      instruction: tr("Kohdistus hyväksytty", "Alignment accepted"),
      status: tr("✓ Langaton lataus voidaan aloittaa", "✓ Wireless charging can start"),
      detail: tr("Ajoneuvo on latausalueella ja tavoiteltu kohdistustaso on saavutettu.", "The vehicle is over the charging zone and the target alignment level has been reached."),
      cls: "ready", arrow: "✓", arrowClass: "ready", expected: null
    };
    if (step === 2) return {
      score: 84, x: 10, y: -10,
      instruction: tr("15 cm taakse ja suorista", "15 cm back and straighten"),
      status: tr("Kohdistus on lähes valmis", "Alignment is nearly complete"),
      detail: tr("Pituussuunnan hienosäätö tarvitaan ennen latauksen käynnistymistä.", "A final longitudinal correction is needed before charging can start."),
      cls: "partial", arrow: "↓", arrowClass: "down", expected: "back"
    };
    if (step === 1) return {
      score: 71, x: -30, y: -12,
      instruction: tr("35 cm oikealle", "35 cm right"),
      status: tr("Ajoneuvo on vielä sivussa latausalueesta", "The vehicle is still laterally offset from the charging zone"),
      detail: tr("Korjaa sivuttaissijainti ennen viimeistä pituussuunnan hienosäätöä.", "Correct the lateral position before the final longitudinal adjustment."),
      cls: "blocked", arrow: "→", arrowClass: "right", expected: "right"
    };
    return {
      score: 58, x: -30, y: 30,
      instruction: tr("40 cm eteen", "40 cm forward"),
      status: tr("Lataus ei vielä käynnisty", "Charging cannot start yet"),
      detail: tr("Ajoneuvo on liian takana ja sivussa latausalueesta.", "The vehicle is too far back and laterally offset from the charging zone."),
      cls: "blocked", arrow: "↑", arrowClass: "up", expected: "forward"
    };
  }

  function moveLabel(move) {
    const labels = {
      forward: ["eteen", "forward"],
      left: ["vasen", "left"],
      right: ["oikea", "right"],
      back: ["taakse", "back"]
    };
    return labels[move]?.[fi() ? 0 : 1] || move;
  }

  function ratingHtml(name, savedValue) {
    return `<div class="likert-anchors"><span>${tr("Täysin eri mieltä", "Strongly disagree")}</span><span>${tr("Täysin samaa mieltä", "Strongly agree")}</span></div><div class="likert" role="radiogroup" aria-label="${name}">${[1,2,3,4,5].map(v => `<label class="likert-option"><input type="radio" name="${name}" value="${v}" ${Number(savedValue) === v ? "checked" : ""}><span>${v}</span></label>`).join("")}</div>`;
  }

  function ensureFallbackRating() {
    if (manualStep() < 3) return;
    const clarityLegend = [...document.querySelectorAll("fieldset legend")].find(el => /kohdistus.*selke|alignment.*clear/i.test(el.textContent || ""));
    const clarityFieldset = clarityLegend?.closest("fieldset");
    if (!clarityFieldset) return;

    let fieldset = document.querySelector(".v06-fallback-rating");
    const saved = Number(sessionStorage.getItem(FALLBACK_KEY) || "0");
    if (!fieldset) {
      fieldset = document.createElement("fieldset");
      fieldset.className = "v06-fallback-rating";
      clarityFieldset.insertAdjacentElement("afterend", fieldset);
    }
    fieldset.innerHTML = `<legend>${tr("Kuinka hyväksyttävä tällainen manuaalinen varakohdistus olisi tavallisella jakelupysähdyksellä?", "How acceptable would this type of manual fallback positioning be during a normal delivery stop?")}</legend>${ratingHtml("alignment_fallback_acceptability", saved)}`;
    fieldset.querySelectorAll('input[name="alignment_fallback_acceptability"]').forEach(input => {
      input.addEventListener("change", () => {
        sessionStorage.setItem(FALLBACK_KEY, input.value);
        document.querySelector(".v06-extra-error")?.remove();
      });
    });
  }

  function completeMainAlignment() {
    sessionStorage.setItem(STEP_KEY, "3");
    const guided = document.querySelector('.alignment-controls [data-align="guided"]');
    if (!guided) {
      renderPositioningFix();
      return;
    }
    guided.click();
    setTimeout(() => {
      const guidedAgain = document.querySelector('.alignment-controls [data-align="guided"]');
      if (guidedAgain && !mainAlignmentAccepted()) guidedAgain.click();
      setTimeout(renderPositioningFix, 0);
    }, 0);
  }

  function handleMove(move) {
    const step = manualStep();
    const state = positioningState(step);
    if (!state.expected) return;

    if (move !== state.expected) {
      const wrong = Number(sessionStorage.getItem(WRONG_KEY) || "0") + 1;
      sessionStorage.setItem(WRONG_KEY, String(wrong));
      renderPositioningFix();
      return;
    }

    if (step >= 2) {
      completeMainAlignment();
      return;
    }
    sessionStorage.setItem(STEP_KEY, String(step + 1));
    renderPositioningFix();
  }

  function renderPositioningFix() {
    if (!isPositioningScreen()) return;

    const heading = document.querySelector("h1");
    if (heading) heading.textContent = tr("Aja latausalueelle ja kohdista auto", "Drive onto the charging zone and position the vehicle");
    const lead = heading?.nextElementSibling;
    if (lead?.classList.contains("lead")) lead.textContent = tr(
      "Lumivalli kaventaa ruutua. Pysäköintiavustin tarkistaa ensin, voidaanko automaattista kohdistusta käyttää turvallisesti. Jos se keskeytyy, viimeistele kohdistus sovelluksen manuaaliohjauksella.",
      "A snowbank narrows the bay. The parking assistant first checks whether automatic positioning can be used safely. If it stops, finish positioning with the app's manual guidance."
    );

    const originalVisual = document.querySelector(".bay-visual");
    const originalControls = document.querySelector(".alignment-controls");
    if (!originalVisual || !originalControls) return;
    originalVisual.hidden = true;
    originalControls.hidden = true;
    originalVisual.classList.add("v06-hide-original");
    originalControls.classList.add("v06-hide-original");

    const oldNotice = originalControls.nextElementSibling;
    if (oldNotice?.classList.contains("notice") && /Kohdista auto ensin|Align the vehicle first/i.test(oldNotice.textContent || "")) {
      oldNotice.classList.add("v06-old-align-notice");
      oldNotice.hidden = true;
    }

    const surfaceLegend = [...document.querySelectorAll("fieldset legend")].find(el => /Pinta tässä skenaariossa|Surface in this scenario/i.test(el.textContent || ""));
    surfaceLegend?.closest("fieldset")?.setAttribute("hidden", "");
    document.querySelector(".scenario-condition-v05")?.setAttribute("hidden", "");
    document.querySelector(".auto-failure-v05")?.setAttribute("hidden", "");

    const step = manualStep();
    const ps = positioningState(step);
    const autoTried = sessionStorage.getItem(AUTO_KEY) === "1";
    const wrongMoves = Number(sessionStorage.getItem(WRONG_KEY) || "0");

    let wrap = document.querySelector(".v06-positioning");
    if (!wrap) {
      wrap = document.createElement("section");
      wrap.className = "v06-positioning";
      originalVisual.insertAdjacentElement("beforebegin", wrap);
    }

    const recommendedClass = move => ps.expected === move ? "recommended" : "";
    const feedback = wrongMoves
      ? tr(`Väärän suunnan yrityksiä: ${wrongMoves}. Seuraa korostettua nuolta ja etäisyysohjetta.`, `Wrong-direction attempts: ${wrongMoves}. Follow the highlighted arrow and distance guidance.`)
      : tr("Seuraa korostettua nuolta ja etäisyysohjetta.", "Follow the highlighted arrow and distance guidance.");

    wrap.innerHTML = `
      <div class="v06-scenario-chip">❄ ${tr("Tampere · talviskenaario", "Tampere · winter scenario")}</div>
      <div class="v06-topview ${ps.cls}" role="img" aria-label="${tr("Ylhäältä kuvattu jakeluauto, langaton latausalue ja lumivalli", "Top-down delivery van, wireless charging zone and snowbank")}">
        <div class="v06-curb"></div>
        <div class="v06-snowbank"><span>${tr("lumivalli", "snowbank")}</span></div>
        <div class="v06-bay-outline"></div>
        <div class="v06-pad"><span>${tr("langaton latausalue", "wireless charging zone")}</span></div>
        <div class="v06-van" style="transform:translate(calc(-50% + ${ps.x}px), calc(-50% + ${ps.y}px))"><span class="v06-front">↑</span><span class="v06-cab"></span><span class="v06-body"></span></div>
        ${step < 3 ? `<div class="v06-guidance-arrow v06-${ps.arrowClass}">${ps.arrow}</div>` : `<div class="v06-ready-mark">✓</div>`}
        <div class="v06-readout"><strong>${ps.score}%</strong><span>${ps.instruction}</span></div>
      </div>
      <div class="v06-power-status ${ps.cls}"><strong>${ps.status}</strong><span>${ps.detail}</span></div>
      <div class="v06-condition"><strong>❄ ${tr("Skenaario-olosuhde", "Scenario condition")}</strong><span>${tr("Luminen pinta · lumivalli kaventaa ruutua", "Snow-covered surface · snowbank narrows the bay")}</span><small>${tr("Olosuhde on osa työpajaskenaariota, ei osallistujan valinta.", "The condition is assigned by the workshop scenario, not selected by the participant.")}</small></div>
      ${step < 3 ? `<div class="v06-assist-panel">
        ${!autoTried ? `<button type="button" class="primary v06-fix-auto">${tr("Kokeile pysäköintiavustinta", "Try parking assistant")}</button>` : `<div class="v06-assist-failure"><strong>⚠ ${tr("Pysäköintiavustin keskeytti kohdistuksen", "Parking assistant stopped positioning")}</strong><p>${tr("Järjestelmä ei pysty varmistamaan vapaata tilaa lumivallin ja osittain peittyneen reunamerkinnän vuoksi. Tarkista ympäristö ja jatka manuaalisella ohjauksella.", "The system cannot verify clear space because of the snowbank and partly obscured edge marking. Check the surroundings and continue with manual guidance.")}</p><small>${tr("Kuljettaja vastaa turvallisesta ajoliikkeestä.", "The driver remains responsible for the safe manoeuvre.")}</small></div>
        <div class="v06-manual-title"><strong>${tr("Manuaalinen varakohdistus", "Manual fallback positioning")}</strong><span>${tr("Tee kolme pientä korjausta: pituussuunta, sivuttaissuunta ja lopuksi hienosäätö.", "Make three small corrections: longitudinal, lateral, then final fine adjustment.")}</span></div>
        <div class="v06-dpad" aria-label="${tr("Manuaalisen kohdistuksen ohjaimet", "Manual positioning controls")}">
          <span></span><button type="button" data-v06-fix-move="forward" class="${recommendedClass("forward")}">↑<small>${moveLabel("forward")}</small></button><span></span>
          <button type="button" data-v06-fix-move="left" class="${recommendedClass("left")}">←<small>${moveLabel("left")}</small></button><button type="button" data-v06-fix-move="right" class="${recommendedClass("right")}">→<small>${moveLabel("right")}</small></button><button type="button" data-v06-fix-move="back" class="${recommendedClass("back")}">↓<small>${moveLabel("back")}</small></button>
        </div>
        <div class="v06-move-feedback" aria-live="polite"><strong>${tr("Suositeltu korjaus:", "Recommended correction:")} ${ps.instruction}</strong><span>${feedback}</span></div>` : ""}
      </div>` : `<div class="v06-success"><strong>${tr("Kohdistus valmis", "Positioning complete")}</strong><span>${tr("Langaton lataus voidaan aloittaa. Manuaalinen varakohdistus onnistui pysäköintiavustimen keskeytymisen jälkeen.", "Wireless charging can start. Manual fallback positioning succeeded after the parking assistant stopped.")}</span></div>`}
    `;

    wrap.querySelector(".v06-fix-auto")?.addEventListener("click", () => {
      sessionStorage.setItem(AUTO_KEY, "1");
      renderPositioningFix();
    });
    wrap.querySelectorAll("[data-v06-fix-move]").forEach(btn => btn.addEventListener("click", () => handleMove(btn.dataset.v06FixMove)));

    ensureFallbackRating();
  }

  if (screen) {
    const observer = new MutationObserver(() => queueMicrotask(renderPositioningFix));
    observer.observe(screen, { childList: true });
    queueMicrotask(renderPositioningFix);
  }
}
