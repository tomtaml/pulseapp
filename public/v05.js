const qs = new URLSearchParams(location.search);
const variant = qs.get("variant") || "fi-fleet";
if (variant === "fi-fleet") {
  const allowedSurface = new Set(["clear", "snow", "slush"]);
  const surface = allowedSurface.has(qs.get("surface")) ? qs.get("surface") : "snow";
  let gridTimers = [];

  const fi = () => document.documentElement.lang === "fi";
  const tr = (fiText, enText) => fi() ? fiText : enText;
  const clearGridTimers = () => { gridTimers.forEach(clearTimeout); gridTimers = []; };

  function scenarioCondition() {
    const map = {
      clear: ["Kuiva pinta · ei näkyvää estettä", "Clear surface · no visible obstruction"],
      snow: ["Luminen pinta · lumivalli kaventaa ruutua", "Snow-covered surface · snowbank narrows the bay"],
      slush: ["Loskainen pinta · merkinnät osin peittyneet", "Slushy surface · markings partly obscured"]
    };
    return map[surface][fi() ? 0 : 1];
  }

  function fixedSurfaceCondition() {
    const legends = [...document.querySelectorAll("fieldset legend")];
    const legend = legends.find(el => /Pinta tässä skenaariossa|Surface in this scenario/i.test(el.textContent || ""));
    if (!legend) return;
    const fieldset = legend.closest("fieldset");
    if (!fieldset || fieldset.dataset.v05Hidden) return;
    fieldset.dataset.v05Hidden = "1";
    fieldset.hidden = true;
    const card = document.createElement("div");
    card.className = "scenario-condition-v05";
    card.innerHTML = `<strong>❄ ${tr("Skenaario-olosuhde", "Scenario condition")}</strong><span>${scenarioCondition()}</span><small>${tr("Olosuhde määräytyy työpajaskenaariosta, ei osallistujan valinnasta.", "The condition is assigned by the workshop scenario, not selected by the participant.")}</small>`;
    fieldset.insertAdjacentElement("afterend", card);
  }

  function alignmentEnhancements() {
    const auto = document.querySelector('[data-align="auto"]');
    const guided = document.querySelector('[data-align="guided"]');
    const readout = document.querySelector(".alignment-readout");
    if (!auto || !guided || !readout) return;

    const aligned = /96%|hyväksytty|accepted/i.test(readout.textContent || "");
    const guidedStage = /82%|15 cm/i.test(readout.textContent || "");
    const autoFailed = sessionStorage.getItem("pulse-v05-auto-failed") === "1";

    if (aligned) {
      auto.closest(".alignment-controls")?.classList.add("v05-alignment-complete");
      return;
    }

    const guidedText = guidedStage
      ? tr("Manuaaliohjaus: 15 cm oikealle ja suorista", "Manual guidance: 15 cm right, then straighten")
      : tr("Manuaaliohjaus: siirry 35 cm oikealle", "Manual guidance: move 35 cm right");
    if (guided.textContent !== guidedText) guided.textContent = guidedText;

    const autoText = tr("Kokeile pysäköintiavustinta", "Try parking assistant");
    if (auto.textContent !== autoText && !autoFailed) auto.textContent = autoText;

    if (surface !== "clear" && autoFailed) {
      auto.disabled = true;
      auto.textContent = tr("Pysäköintiavustin ei käytettävissä", "Parking assistant unavailable");
      showAutoFailure(auto);
    }

    if (!auto.dataset.v05Capture) {
      auto.dataset.v05Capture = "1";
      auto.addEventListener("click", event => {
        if (surface === "clear") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        sessionStorage.setItem("pulse-v05-auto-failed", "1");
        auto.disabled = true;
        auto.textContent = tr("Pysäköintiavustin pysäytetty", "Parking assistant stopped");
        showAutoFailure(auto);
      }, true);
    }
  }

  function showAutoFailure(auto) {
    if (document.querySelector(".auto-failure-v05")) return;
    const box = document.createElement("div");
    box.className = "auto-failure-v05";
    box.innerHTML = `<strong>⚠ ${tr("Automaattinen kohdistus keskeytettiin", "Automatic alignment stopped")}</strong><p>${tr("Järjestelmä havaitsi epävarman vapaan tilan lumivallin tai peittyneen reunamerkinnän vuoksi. Kuljettaja tarkistaa ympäristön ja jatkaa sovelluksen manuaaliohjauksella.", "The system detected uncertain clearance because of the snowbank or obscured edge marking. The driver checks the surroundings and continues with manual app guidance.")}</p><small>${tr("Kuljettaja vastaa edelleen turvallisesta ajoliikkeestä.", "The driver remains responsible for the safe manoeuvre.")}</small>`;
    auto.closest(".alignment-controls")?.insertAdjacentElement("afterend", box);
  }

  function roleRoutePreview() {
    const roleInputs = [...document.querySelectorAll('input[name="participant_group"]')];
    if (!roleInputs.length) return;
    const container = roleInputs[0].closest(".options") || roleInputs[0].parentElement?.parentElement;
    if (!container) return;
    let preview = document.querySelector(".role-preview-v05");
    if (!preview) {
      preview = document.createElement("div");
      preview.className = "role-preview-v05";
      preview.hidden = true;
      container.insertAdjacentElement("afterend", preview);
    }
    const update = () => {
      const role = roleInputs.find(i => i.checked)?.value || "";
      if (role) sessionStorage.setItem("pulse-v05-role", role);
      const text = {
        fleet_driver: ["Täysi operatiivinen reitti", "Full operational route", "Kohdistus, lataus/V2G, ohitus, talvihäiriö, ymmärtäminen ja SUS.", "Alignment, charging/V2G, override, winter disruption, comprehension and SUS."],
        dispatcher: ["Operoinnin reitti", "Operations route", "Lähtörajoitukset, kaluston saatavuus, viive, häiriötilanne ja päätösvastuu. SUS vain, jos testataan oikeasti operoinnin käyttöliittymää.", "Departure constraints, vehicle availability, delay, disruption and decision responsibility. SUS only if an operations interface is genuinely being tested."],
        fleet_manager: ["Kalusto- ja sopimusreitti", "Fleet / contract route", "Luotettavuusraja, V2G-valtuutus, hyvitys, akkutakuu, vastuut ja hankintaehto. Ei oletuksena kuljettaja-SUS:ia.", "Reliability threshold, V2G authorisation, compensation, battery guarantee, liability and procurement conditions. No driver SUS by default."],
        other: ["Ohjattu sidosryhmäreitti", "Facilitated stakeholder route", "Käytä prototyyppiä keskustelun ärsykkeenä ja kirjaa toteutettavuus- ja vastuukysymykset SRF-lokiin.", "Use the prototype as a discussion stimulus and record feasibility and responsibility issues in the SRF log."]
      }[role];
      if (!text) {
        preview.hidden = true;
        preview.replaceChildren();
        return;
      }
      preview.hidden = false;
      preview.innerHTML = `<strong>${text[fi() ? 0 : 1]}</strong><span>${text[fi() ? 2 : 3]}</span><small>${tr("v0.5: roolikohtainen reititys rakennetaan tämän jaon pohjalta.", "v0.5: role-specific routing is being built from this split.")}</small>`;
    };
    roleInputs.forEach(i => {
      if (!i.dataset.v05Role) {
        i.dataset.v05Role = "1";
        i.addEventListener("change", update);
      }
    });
    update();
  }

  function gridPanel() {
    const heading = document.querySelector("h1");
    if (!heading || !/virtuaalinen lataus|virtual charging/i.test(heading.textContent || "")) return;
    const card = document.querySelector(".cycle-card");
    if (!card) return;
    let panel = document.querySelector(".grid-context-v05");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "grid-context-v05";
      panel.innerHTML = `<div><span>${tr("Simuloitu kellonaika", "Simulated time")}</span><strong id="simClockV05">15:30</strong></div><div><span>${tr("Sähkön kysyntä", "Electricity demand")}</span><strong id="gridDemandV05">${tr("keskitaso", "moderate")}</strong></div><div><span>${tr("Uusiutuvan sähkön osuus", "Renewable share")}</span><strong id="resShareV05">72%</strong></div><p id="gridReasonV05">${tr("Ladataan ennen iltapäivän korkeampaa kysyntää.", "Charging before the higher-demand afternoon period.")}</p><small>${tr("Kuvitteelliset työpaja-arvot — eivät Tampereen reaaliaikaista verkkodataa.", "Illustrative workshop values — not real-time Tampere grid data.")}</small>`;
      card.insertAdjacentElement("beforebegin", panel);
    }

    const run = document.querySelector('[data-action="run-cycle"]');
    if (run && !run.dataset.v05Grid) {
      run.dataset.v05Grid = "1";
      run.addEventListener("click", () => {
        clearGridTimers();
        setGrid("15:30", tr("keskitaso", "moderate"), "72%", tr("Ajoneuvo lataa ennen kysyntähuippua.", "The vehicle charges before the demand peak."));
        gridTimers.push(setTimeout(() => setGrid("15:45", tr("nouseva", "rising"), "61%", tr("Lähtövaraus on jo turvattu; V2G-ikkuna lähestyy.", "Departure reserve is protected; the V2G window is approaching.")), 1500));
        gridTimers.push(setTimeout(() => setGrid("16:00", tr("korkea / huippu", "high / peak"), "38%", tr("Kysyntä on korkea suhteessa uusiutuvaan tarjontaan — simuloitu V2G-tuki aktivoituu.", "Demand is high relative to renewable supply — simulated V2G support activates.")), 3300));
        gridTimers.push(setTimeout(() => setGrid("16:20", tr("laskeva", "easing"), "55%", tr("Huippu hellittää ja ajoneuvo palautetaan lähtövalmiiksi.", "The peak eases and the vehicle is restored to departure-ready status.")), 5200));
      }, true);
    }

    const phase = document.getElementById("cyclePhase");
    if (phase && !phase.dataset.v05Observer) {
      phase.dataset.v05Observer = "1";
      const observer = new MutationObserver(updateOverrideVisibility);
      observer.observe(phase, {childList:true, characterData:true, subtree:true});
    }
    updateOverrideVisibility();
  }

  function setGrid(time, demand, res, reason) {
    const clock = document.getElementById("simClockV05");
    const d = document.getElementById("gridDemandV05");
    const r = document.getElementById("resShareV05");
    const why = document.getElementById("gridReasonV05");
    if (clock) clock.textContent = time;
    if (d) d.textContent = demand;
    if (r) r.textContent = res;
    if (why) why.textContent = reason;
  }

  function updateOverrideVisibility() {
    const override = document.querySelector('[data-action="override-cycle"]');
    const phase = document.getElementById("cyclePhase")?.textContent || "";
    if (!override) return;
    const ready = /Ready to leave|Lähtövalmius|Cycle completed|Jakso suoritettu/i.test(phase);
    const started = !/Ready to start|Valmis aloittamaan/i.test(phase);
    const label = tr("Tarvitsen auton nyt — lopeta energiajakso", "Need the vehicle now — stop energy session");
    if (override.textContent !== label) override.textContent = label;
    override.hidden = !started || ready;
  }

  function apply() {
    fixedSurfaceCondition();
    alignmentEnhancements();
    roleRoutePreview();
    gridPanel();
  }

  const screen = document.querySelector("#screen");
  if (screen) {
    // Observe only replacement of the rendered screen. v0.5 itself mutates descendants;
    // observing the whole subtree caused a self-triggering MutationObserver loop in Firefox.
    const observer = new MutationObserver(() => apply());
    observer.observe(screen, {childList:true});
    apply();
  }
}
