const params = new URLSearchParams(location.search);
const v06Variant = params.get("variant") || "fi-fleet";

if (v06Variant === "fi-fleet") {
  document.body.classList.add("v06-fi-fleet");

  const fi = () => document.documentElement.lang === "fi";
  const tr = (fiText, enText) => fi() ? fiText : enText;
  const screen = document.querySelector("#screen");
  let cycleInterval = null;

  function topViewStage() {
    const text = document.querySelector(".alignment-readout")?.textContent || "";
    if (/96%|hyväksytty|accepted/i.test(text)) return 2;
    if (/82%|15 cm/i.test(text)) return 1;
    return 0;
  }

  function positioningState(stage) {
    if (stage === 2) return {
      score:96, offset:0, instruction:tr("Kohdistus hyväksytty", "Alignment accepted"),
      status:tr("✓ Tavoiteltu latausteho käytettävissä", "✓ Target charging-power level available"), cls:"ready"
    };
    if (stage === 1) return {
      score:82, offset:11, instruction:tr("15 cm oikealle ja suorista", "15 cm right, then straighten"),
      status:tr("Kohdistus ei vielä riitä tavoiteltuun tehoon", "Alignment is not yet sufficient for the target power level"), cls:"partial"
    };
    return {
      score:62, offset:-26, instruction:tr("35 cm oikealle", "35 cm right"),
      status:tr("Lataus ei vielä käynnisty", "Charging cannot start yet"), cls:"blocked"
    };
  }

  function topViewPositioning() {
    const heading = document.querySelector("h1");
    if (!heading || !/Aja langattomalle|Approach the wireless/i.test(heading.textContent || "")) return;

    const originalVisual = document.querySelector(".bay-visual");
    const originalControls = document.querySelector(".alignment-controls");
    if (!originalVisual || !originalControls) return;
    originalVisual.hidden = true;
    originalControls.hidden = true;
    document.querySelector(".scenario-condition-v05")?.setAttribute("hidden", "");
    document.querySelector(".auto-failure-v05")?.setAttribute("hidden", "");

    const stage = topViewStage();
    const ps = positioningState(stage);
    const autoTried = sessionStorage.getItem("pulse-v06-auto-tried") === "1";
    const wrongMoves = Number(sessionStorage.getItem("pulse-v06-wrong-moves") || "0");

    let wrap = document.querySelector(".v06-positioning");
    if (!wrap) {
      wrap = document.createElement("section");
      wrap.className = "v06-positioning";
      originalVisual.insertAdjacentElement("beforebegin", wrap);
    }

    wrap.innerHTML = `
      <div class="v06-scenario-chip">❄ ${tr("Tampere · talviskenaario", "Tampere · winter scenario")}</div>
      <div class="v06-topview ${ps.cls}" role="img" aria-label="${tr("Ylhäältä kuvattu jakeluauto, langaton latausalue ja lumivalli", "Top-down delivery van, wireless charging zone and snowbank")}">
        <div class="v06-curb"></div>
        <div class="v06-snowbank"><span>${tr("lumivalli", "snowbank")}</span></div>
        <div class="v06-bay-outline"></div>
        <div class="v06-pad"><span>${tr("langaton latausalue", "wireless charging zone")}</span></div>
        <div class="v06-van" style="--offset:${ps.offset}px"><span class="v06-front">↑</span><span class="v06-cab"></span><span class="v06-body"></span></div>
        ${stage < 2 ? `<div class="v06-guidance-arrow">→</div>` : `<div class="v06-ready-mark">✓</div>`}
        <div class="v06-readout"><strong>${ps.score}%</strong><span>${ps.instruction}</span></div>
      </div>
      <div class="v06-power-status ${ps.cls}"><strong>${ps.status}</strong><span>${tr("Kohdistus vaikuttaa siihen, voidaanko langattoman järjestelmän tavoiteltu tehotaso saavuttaa.", "Alignment affects whether the wireless system can reach its target power level.")}</span></div>
      <div class="v06-condition"><strong>❄ ${tr("Skenaario-olosuhde", "Scenario condition")}</strong><span>${tr("Luminen pinta · lumivalli kaventaa ruutua", "Snow-covered surface · snowbank narrows the bay")}</span><small>${tr("Olosuhde on osa työpajaskenaariota, ei osallistujan valinta.", "The condition is assigned by the workshop scenario, not selected by the participant.")}</small></div>
      ${stage < 2 ? `
        <div class="v06-assist-panel">
          ${!autoTried ? `<button type="button" class="primary v06-auto-btn">${tr("Kokeile pysäköintiavustinta", "Try parking assistant")}</button>` : `
            <div class="v06-assist-failure"><strong>⚠ ${tr("Pysäköintiavustin keskeytti kohdistuksen", "Parking assistant stopped positioning")}</strong><p>${tr("Järjestelmä ei pysty varmistamaan vapaata tilaa lumivallin ja osittain peittyneen reunamerkinnän vuoksi. Tarkista ympäristö ja jatka manuaalisella ohjauksella.", "The system cannot verify clear space because of the snowbank and partly obscured edge marking. Check the surroundings and continue with manual guidance.")}</p><small>${tr("Kuljettaja vastaa turvallisesta ajoliikkeestä.", "The driver remains responsible for the safe manoeuvre.")}</small></div>
            <div class="v06-manual-title"><strong>${tr("Manuaalinen varakohdistus", "Manual fallback positioning")}</strong><span>${tr("Seuraa nuolta ja sovelluksen etäisyysohjetta.", "Follow the arrow and distance guidance.")}</span></div>
            <div class="v06-dpad" aria-label="${tr("Manuaalisen kohdistuksen ohjaimet", "Manual positioning controls")}">
              <span></span><button type="button" data-v06-move="forward">↑<small>${tr("eteen", "forward")}</small></button><span></span>
              <button type="button" data-v06-move="left">←<small>${tr("vasen", "left")}</small></button><button type="button" data-v06-move="right" class="recommended">→<small>${tr("oikea", "right")}</small></button><button type="button" data-v06-move="back">↓<small>${tr("taakse", "back")}</small></button>
            </div>
            <div class="v06-move-feedback" aria-live="polite">${wrongMoves ? tr(`Väärän suunnan yrityksiä: ${wrongMoves}. Ohje suosittelee siirtymistä oikealle.`, `Wrong-direction attempts: ${wrongMoves}. Guidance recommends moving right.`) : tr("Kokeile ohjeen mukaista korjausta.", "Try the correction indicated by the guidance.")}</div>
          `}
        </div>` : `<div class="v06-success"><strong>${tr("Kohdistus valmis", "Positioning complete")}</strong><span>${tr("Langaton lataus voidaan aloittaa. Automaattisen avustimen epäonnistumisesta huolimatta manuaalinen varakohdistus onnistui.", "Wireless charging can start. Manual fallback positioning succeeded despite the automatic-assist failure.")}</span></div>`}
    `;

    wrap.querySelector(".v06-auto-btn")?.addEventListener("click", () => {
      sessionStorage.setItem("pulse-v06-auto-tried", "1");
      originalControls.querySelector('[data-align="auto"]')?.click();
      topViewPositioning();
    });

    wrap.querySelectorAll("[data-v06-move]").forEach(btn => btn.addEventListener("click", () => {
      const move = btn.dataset.v06Move;
      if (move === "right") {
        originalControls.querySelector('[data-align="guided"]')?.click();
      } else {
        sessionStorage.setItem("pulse-v06-wrong-moves", String(wrongMoves + 1));
        topViewPositioning();
      }
    }));

    if (stage === 2 && !document.querySelector('input[name="alignment_fallback_acceptability"]')) {
      const clarityLegend = [...document.querySelectorAll("fieldset legend")].find(el => /kohdistus.*selke|alignment.*clear/i.test(el.textContent || ""));
      const clarityFieldset = clarityLegend?.closest("fieldset");
      if (clarityFieldset) {
        const fieldset = document.createElement("fieldset");
        fieldset.className = "v06-fallback-rating";
        fieldset.innerHTML = `<legend>${tr("Tällainen manuaalinen varakohdistus olisi hyväksyttävä tavallisella jakelupysähdyksellä.", "This type of manual fallback positioning would be acceptable during a normal delivery stop.")}</legend>${likertHtml("alignment_fallback_acceptability")}`;
        clarityFieldset.insertAdjacentElement("afterend", fieldset);
      }
    }

    if (stage === 2) requireExtraAnswer("alignment_fallback_acceptability", tr("Arvioi myös manuaalisen varakohdistuksen hyväksyttävyys.", "Also rate the acceptability of manual fallback positioning."));
  }

  function likertHtml(name) {
    return `<div class="likert-anchors"><span>${tr("Täysin eri mieltä", "Strongly disagree")}</span><span>${tr("Täysin samaa mieltä", "Strongly agree")}</span></div><div class="likert" role="radiogroup">${[1,2,3,4,5].map(v => `<label class="likert-option"><input type="radio" name="${name}" value="${v}"><span>${v}</span></label>`).join("")}</div>`;
  }

  function requireExtraAnswer(name, message) {
    const next = document.querySelector('[data-action="next"]');
    if (!next || next.dataset.v06ExtraValidation === name) return;
    next.dataset.v06ExtraValidation = name;
    next.addEventListener("click", event => {
      if (document.querySelector(`input[name="${name}"]:checked`)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      let error = document.querySelector(".v06-extra-error");
      if (!error) {
        error = document.createElement("p");
        error.className = "v06-extra-error error";
        next.closest(".actions")?.insertAdjacentElement("beforebegin", error);
      }
      error.textContent = message;
      error.scrollIntoView({behavior:"smooth",block:"center"});
    }, true);
  }

  function operationalLimits() {
    const heading = document.querySelector("h1");
    if (!heading || !/Seuraava toimitus|next delivery/i.test(heading.textContent || "")) return;
    document.querySelectorAll(".scenario-grid > div").forEach(tile => {
      const label = tile.querySelector("span")?.textContent || "";
      if (/Pysähdys|Planned stop/i.test(label)) tile.querySelector("strong").textContent = "60 min";
    });
    const lead = heading.nextElementSibling;
    if (lead?.classList.contains("lead")) lead.textContent = tr(
      "Ennen lataus- ja V2G-päätöstä järjestelmä näyttää, milloin ajoneuvo tarvitaan takaisin käyttöön ja mikä akun vähimmäisvaraus on turvattava. Arvot ovat kuvitteellisia työpajaskenaarioita.",
      "Before the charging and V2G decision, the system shows when the vehicle is needed back in service and which minimum battery reserve must be protected. Values are illustrative workshop scenarios."
    );
  }

  function v2gOffer() {
    const heading = document.querySelector("h1");
    if (!heading || !/V2G ennen|V2G decision before/i.test(heading.textContent || "")) return;
    heading.textContent = tr("Sopiiko lyhyt V2G-jakso tälle pysähdykselle?", "Does a short V2G period fit this stop?");
    const lead = heading.nextElementSibling;
    if (lead?.classList.contains("lead")) lead.textContent = tr(
      "Ajoneuvon lataustarve ja taattu lähtövaraus ovat etusijalla. Tässä skenaariossa niiden jälkeen voidaan tarjota lyhyt V2G-jakso ilman lähtöviivettä.",
      "The vehicle's charging need and guaranteed departure reserve come first. In this scenario, a short V2G period can be offered afterwards without delaying departure."
    );
    document.querySelectorAll(".v2g-card .metric").forEach(row => {
      const label = row.querySelector("span")?.textContent || "";
      const value = row.querySelector("strong");
      if (!value) return;
      if (/V2G-ikkuna|V2G window/i.test(label)) value.textContent = tr("noin 12 min", "about 12 min");
      else if (/Enintään verkkoon|Maximum export/i.test(label)) value.textContent = tr("noin 4 kWh", "about 4 kWh");
      else if (/hyvitys|compensation/i.test(label)) value.textContent = tr("esimerkkihyvitys", "illustrative benefit");
    });
    if (!document.querySelector(".v06-v2g-condition")) {
      const card = document.querySelector(".v2g-card");
      const note = document.createElement("div");
      note.className = "v06-v2g-condition";
      note.innerHTML = `<strong>${tr("Ehto V2G:lle", "Condition for V2G")}</strong><span>${tr("V2G käynnistyy vain, jos lataustarve ja lähtövaraustakuu säilyvät turvattuina.", "V2G starts only if the charging need and departure-reserve guarantee remain protected.")}</span><small>${tr("≤22 kW -luokan langaton järjestelmä on tässä vain työpajaskenaarion oletus, ei Tampereen lopullinen tekninen määritys.", "The ≤22 kW wireless-system class is an illustrative workshop assumption, not the final Tampere technical specification.")}</small>`;
      card?.insertAdjacentElement("afterend", note);
    }
  }

  function cycleScreen() {
    const heading = document.querySelector("h1");
    if (!heading || !/virtuaalinen lataus|virtual charging|langaton lataus- ja V2G/i.test(heading.textContent || "")) return;
    heading.textContent = tr("Seuraa lyhyt langaton lataus- ja V2G-jakso", "Follow a short wireless charging and V2G cycle");
    const lead = heading.nextElementSibling;
    if (lead?.classList.contains("lead")) lead.textContent = tr(
      "Jakso nopeutetaan noin kymmeneen sekuntiin. Tarkkaile kellonaikaa, energian suuntaa, akun varausta ja sitä, säilyykö lähtövaraustakuu.",
      "The cycle is compressed into about ten seconds. Watch the clock, energy direction, battery level and whether the departure reserve remains protected."
    );

    document.querySelector(".grid-context-v05")?.setAttribute("hidden", "");
    const originalCard = document.querySelector(".cycle-card");
    if (!originalCard) return;
    originalCard.hidden = true;

    let card = document.querySelector(".v06-cycle-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "v06-cycle-card";
      originalCard.insertAdjacentElement("beforebegin", card);
    }

    const originalRun = originalCard.querySelector('[data-action="run-cycle"]') || document.querySelector('[data-action="run-cycle"]');
    const alreadyDone = !!originalRun?.disabled || /Lähtövalmius|Ready to leave|completed/i.test(document.getElementById("cyclePhase")?.textContent || "");
    renderCycleCard(card, alreadyDone ? 42 : 0, alreadyDone);

    const run = card.querySelector(".v06-run-cycle");
    if (run && !run.dataset.bound) {
      run.dataset.bound = "1";
      run.addEventListener("click", () => {
        originalRun?.click();
        startV06Cycle(card);
      });
    }
  }

  function cycleSnapshot(minute) {
    if (minute >= 42) return {time:"16:12", phase:tr("Valmis seuraavaan toimitukseen", "Ready for next delivery"), soc:66, toVehicle:10.1, toGrid:4.0, net:6.1, direction:"done", demand:tr("laskeva", "easing"), res:tr("keskitaso", "moderate"), reason:tr("V2G-jakso päättyi. 65 % lähtövaraustakuu säilyi.", "The V2G period ended. The 65% departure-reserve guarantee remained protected.")};
    if (minute >= 30) {
      const p = Math.min(1,(minute-30)/12);
      return {time:clockFromMinute(minute), phase:tr("V2G aktiivinen", "V2G active"), soc:Math.round(73-7*p), toVehicle:10.1, toGrid:Number((4*p).toFixed(1)), net:Number((10.1-4*p).toFixed(1)), direction:"export", demand:tr("korkea", "high"), res:tr("vähemmän", "lower"), reason:tr("Verkko pyytää lyhyttä joustoa. Lähtövaraustakuu on jo turvattu.", "The grid requests short flexibility. The departure reserve is already protected.")};
    }
    const p = minute/30;
    return {time:clockFromMinute(minute), phase:tr("Langaton lataus", "Wireless charging"), soc:Math.round(55+18*p), toVehicle:Number((10.1*p).toFixed(1)), toGrid:0, net:Number((10.1*p).toFixed(1)), direction:"charge", demand:tr("keskitaso", "moderate"), res:tr("paljon", "high"), reason:minute >= 27 ? tr("Lähtövaraustakuu on turvattu ja pieni puskuri rakennetaan ennen V2G:tä.", "The departure reserve is protected and a small buffer is built before V2G.") : tr("Ajoneuvoa ladataan ensin kohti suojattua lähtövarausta.", "The vehicle charges first toward the protected departure reserve.")};
  }

  function clockFromMinute(minute) {
    const total = 15*60 + 30 + minute;
    const h = Math.floor(total/60);
    const m = total%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }

  function renderCycleCard(card, minute, done=false) {
    const s = cycleSnapshot(minute);
    const width = Math.min(100, Math.round((minute/42)*100));
    const flow = s.direction === "export" ? `🚐 <span class="v06-flow-arrow export">→</span> ⚡` : s.direction === "charge" ? `⚡ <span class="v06-flow-arrow">→</span> 🚐` : `✓`;
    card.innerHTML = `
      <div class="v06-cycle-meta">
        <div><span>${tr("Simuloitu kellonaika", "Simulated time")}</span><strong>${s.time}</strong></div>
        <div><span>${tr("Sähkön kysyntä", "Electricity demand")}</span><strong>${s.demand}</strong></div>
        <div><span>${tr("Uusiutuvaa sähköä", "Renewable availability")}</span><strong>${s.res}</strong></div>
      </div>
      <div class="v06-cycle-main ${s.direction}">
        <div class="scenario-badge">${tr("Simuloidut työpaja-arvot", "Simulated workshop values")}</div>
        <div class="v06-cycle-phase">${s.phase}</div>
        <div class="v06-cycle-soc"><strong>${s.soc}%</strong><span>${tr("akun varaus", "battery")}</span></div>
        <div class="v06-cycle-flow">${flow}</div>
        <div class="v06-cycle-progress"><div style="width:${width}%"></div></div>
        <div class="v06-energy-grid"><div><strong>${s.toVehicle.toFixed(1)} kWh</strong><span>${tr("ajoneuvoon", "to vehicle")}</span></div><div><strong>${s.toGrid.toFixed(1)} kWh</strong><span>${tr("verkkoon", "to grid")}</span></div><div><strong>+${s.net.toFixed(1)} kWh</strong><span>${tr("netto akkuun", "net to battery")}</span></div></div>
        <div class="v06-cycle-reason">${s.reason}</div>
        ${s.direction === "export" ? `<div class="v06-override-note">↩ ${tr("Ajoneuvo voidaan ottaa käyttöön ja V2G keskeyttää tarvittaessa. Tätä ei vaadita tässä perusskenaariossa.", "The vehicle can be taken back into service and V2G stopped if needed. This is not required in the standard scenario.")}</div>` : ""}
        ${done ? `<div class="v06-cycle-finish"><strong>✓ ${tr("Lähtövaraustakuu turvattu", "Departure-reserve guarantee protected")}</strong><span>${tr("V2G:n vaikutus lähtöaikaan tässä skenaariossa: 0 min", "V2G departure-time impact in this scenario: 0 min")}</span></div>` : `<button type="button" class="primary v06-run-cycle">${tr("Käynnistä nopeutettu jakso", "Run accelerated cycle")}</button>`}
      </div>
      <small class="v06-tech-note">${tr("Skenaario kuvaa ≤22 kW -luokan langatonta järjestelmää. Teho-, akku- ja V2G-arvot ovat vain käyttöliittymätestin oletuksia, kunnes Tampereen demonstraattorin lopulliset tekniset arvot vahvistetaan.", "The scenario represents a ≤22 kW-class wireless system. Power, battery and V2G values are interface-test assumptions until the final Tampere demonstrator specifications are confirmed.")}</small>
    `;
  }

  function startV06Cycle(card) {
    if (cycleInterval) clearInterval(cycleInterval);
    const next = document.querySelector('[data-action="next"]');
    if (next) next.disabled = true;
    let minute = 0;
    renderCycleCard(card,0,false);
    cycleInterval = setInterval(() => {
      minute += 1;
      if (minute >= 42) {
        clearInterval(cycleInterval);
        cycleInterval = null;
        renderCycleCard(card,42,true);
        if (next) next.disabled = false;
        return;
      }
      renderCycleCard(card,minute,false);
    },250);
  }

  function winterFault() {
    const heading = document.querySelector("h1");
    if (!heading || !/Lumimyrsky|snowstorm/i.test(heading.textContent || "")) return;
    const paragraphs = [...document.querySelectorAll("p")];
    const alertText = paragraphs.find(p => /Voimakas lumisade|Heavy snow/i.test(p.textContent || ""));
    if (alertText) alertText.textContent = tr(
      "Voimakas lumisade ja loska peittävät osan latausalueesta ja kohdistus heikkenee. Seuraava toimitus lähtee 25 minuutin kuluttua.",
      "Heavy snow and slush cover part of the charging area and alignment deteriorates. The next delivery leaves in 25 minutes."
    );
  }

  function comprehension() {
    const heading = document.querySelector("h1");
    if (!heading || !/Ymmärtämisen tarkistus|Comprehension/i.test(heading.textContent || "")) return;
    if (document.querySelector('input[name="c4"]')) return;
    const actions = document.querySelector(".actions");
    if (!actions) return;
    const fieldset = document.createElement("fieldset");
    fieldset.className = "v06-c4";
    fieldset.innerHTML = `<legend>${tr("Mitä talvihäiriössä voi tapahtua, jos riittävä kohdistus menetetään?", "What can happen in a winter disruption if sufficient alignment is lost?")}</legend><div class="options">
      <label class="option"><input type="radio" name="c4" value="redecision"><span>${tr("Lataus/V2G voi keskeytyä ja tilanteesta tehdään uusi päätös", "Charging/V2G may stop and a new operational decision is needed")}</span></label>
      <label class="option"><input type="radio" name="c4" value="always_auto"><span>${tr("Järjestelmä jatkaa aina automaattisesti", "The system always continues automatically")}</span></label>
      <label class="option"><input type="radio" name="c4" value="vehicle_locked"><span>${tr("Ajoneuvoa ei voi enää käyttää", "The vehicle can no longer be used")}</span></label>
      <label class="option"><input type="radio" name="c4" value="unsure"><span>${tr("En ole varma", "Not sure")}</span></label>
    </div>`;
    actions.insertAdjacentElement("beforebegin",fieldset);
    requireExtraAnswer("c4",tr("Vastaa myös talvihäiriötä koskevaan kohtaan.","Please also answer the winter-disruption item."));
  }

  function apply() {
    topViewPositioning();
    operationalLimits();
    v2gOffer();
    cycleScreen();
    winterFault();
    comprehension();
  }

  if (screen) {
    const observer = new MutationObserver(() => apply());
    observer.observe(screen,{childList:true});
    apply();
  }
}
