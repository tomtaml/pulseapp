const v07Params = new URLSearchParams(location.search);
if ((v07Params.get("variant") || "fi-fleet") === "fi-fleet") {
  document.body.classList.add("v07-fi-fleet");

  const screen = document.querySelector("#screen");
  const fi = () => document.documentElement.lang === "fi";
  const tr = (fiText, enText) => fi() ? fiText : enText;

  let cycleTimer = null;
  let cycleRunning = false;
  let cycleMinute = 0;
  let coreCycleStarted = false;

  const marketSlots = [
    { time:"15:30", demand:["keskitaso","moderate"], res:["paljon","high"], price:8 },
    { time:"15:45", demand:["nouseva","rising"], res:["paljon","high"], price:11 },
    { time:"16:00", demand:["korkea","high"], res:["vähemmän","lower"], price:17 },
    { time:"16:15", demand:["korkea","high"], res:["vähemmän","lower"], price:14 },
    { time:"16:30", demand:["laskeva","easing"], res:["keskitaso","moderate"], price:11 },
    { time:"16:45", demand:["keskitaso","moderate"], res:["keskitaso","moderate"], price:9 }
  ];

  function isLimitsScreen() {
    const h1 = document.querySelector("#screen h1");
    return !!h1 && /Seuraava toimitus|next delivery/i.test(h1.textContent || "");
  }

  function isAgreementScreen() {
    const h1 = document.querySelector("#screen h1");
    return !!h1 && /Sopiiko lyhyt V2G|V2G ennen latausjaksoa|V2G decision before|V2G-jakso tälle/i.test(h1.textContent || "");
  }

  function isCycleScreen() {
    const h1 = document.querySelector("#screen h1");
    return !!h1 && /Seuraa lyhyt langaton|virtuaalinen lataus|virtual charging|wireless charging and V2G/i.test(h1.textContent || "");
  }

  function operationalWindow() {
    if (!isLimitsScreen()) return;
    document.querySelectorAll(".scenario-grid > div").forEach(tile => {
      const label = tile.querySelector("span")?.textContent || "";
      const value = tile.querySelector("strong");
      if (value && /Pysähdys|Planned stop/i.test(label) && value.textContent !== "75 min") value.textContent = "75 min";
    });

    const routeCard = document.querySelector(".route-card");
    if (routeCard && !document.querySelector(".v07-availability-note")) {
      const note = document.createElement("div");
      note.className = "v07-availability-note";
      note.innerHTML = `<strong>🕒 ${tr("Ajoneuvon käytettävyysikkuna", "Vehicle availability window")}</strong>
        <span>${tr("15:30–16:45 · ajoneuvo on pysäköitynä ja käytettävissä lataukseen tai sovittuun V2G-joustoon.", "15:30–16:45 · the vehicle is parked and available for charging or agreed V2G flexibility.")}</span>
        <small>${tr("Seuraava toimitus lähtee viimeistään 17:00.", "The next delivery leaves by 17:00.")}</small>`;
      routeCard.insertAdjacentElement("afterend", note);
    }
  }

  function agreementScreen() {
    if (!isAgreementScreen()) return;
    const h1 = document.querySelector("#screen h1");
    if (h1) h1.textContent = tr("Millä ehdoilla ajoneuvo voi osallistua V2G:hen?", "Under what conditions can the vehicle participate in V2G?");
    const lead = h1?.nextElementSibling;
    if (lead?.classList.contains("lead")) {
      lead.textContent = tr(
        "Tässä skenaariossa kaluston V2G-sopimus on jo hyväksytty organisaatiotasolla. Arvioi, mitä ehtoja yksittäisen aktivoinnin pitäisi noudattaa kuljettajan ja operoinnin näkökulmasta.",
        "In this scenario, the fleet V2G agreement has already been approved at organisation level. Review the conditions that an individual activation should follow from the driver and operations perspective."
      );
    }

    const oldOffer = document.querySelector(".v2g-card");
    if (oldOffer) oldOffer.hidden = true;
    document.querySelector(".v06-v2g-condition")?.setAttribute("hidden", "");

    let card = document.querySelector(".v07-agreement-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "v07-agreement-card";
      (oldOffer || lead)?.insertAdjacentElement(oldOffer ? "beforebegin" : "afterend", card);
    }

    card.innerHTML = `
      <div class="scenario-badge">${tr("Työpajaskenaario · V2G-sopimus oletetaan hyväksytyksi", "Workshop scenario · fleet V2G agreement assumed in place")}</div>
      <div class="v07-contract-level">
        <strong>${tr("Sopimustaso", "Agreement level")}</strong>
        <span>${tr("Kalusto-organisaatio on liittynyt V2G-palveluun. Tätä sopimusta ei hyväksytä uudelleen jokaisella pysähdyksellä.", "The fleet organisation has joined the V2G service. The agreement is not renegotiated at every stop.")}</span>
      </div>
      <div class="v07-contract-grid">
        <div><span>${tr("Taattu lähtövaraus", "Protected departure reserve")}</span><strong>65%</strong></div>
        <div><span>${tr("Käytettävyysikkuna", "Availability window")}</span><strong>15:30–16:45</strong></div>
        <div><span>${tr("Aikaisempi käyttöönotto", "Early vehicle return")}</span><strong>${tr("sallittu", "allowed")}</strong></div>
        <div><span>${tr("Akun suojaus", "Battery protection")}</span><strong>${tr("sovituissa rajoissa", "within agreed limits")}</strong></div>
      </div>
      <div class="v07-contract-rule">
        <strong>🛡 ${tr("Liikkuminen ennen verkkopalvelua", "Mobility before grid service")}</strong>
        <span>${tr("V2G aktivoituu vain, jos lähtövaraus ja seuraavan toimituksen aikaraja pysyvät turvattuina.", "V2G activates only if the departure reserve and next-delivery deadline remain protected.")}</span>
      </div>
      <div class="v07-comp-rule">
        <div><strong>${tr("Esimerkkihyvitys", "Illustrative V2G credit")}</strong><span>0,25 €/kWh</span></div>
        <small>${tr("Vain käyttöliittymätestin sopimusmalli — ei markkinahinta, tariffi tai Tampereen lopullinen korvausmalli.", "Interface-test contract assumption only — not a market price, tariff or final Tampere compensation model.")}</small>
      </div>
      <div class="v07-activation-level">
        <strong>${tr("Aktivointitaso", "Activation level")}</strong>
        <span>${tr("Kun ajoneuvo on pysäköitynä ja käytettävissä, järjestelmä voi pyytää lyhyen V2G-aktivoinnin sopimuksen rajoissa.", "While the vehicle is parked and available, the system may request a short V2G activation within the agreed limits.")}</span>
      </div>
      <small class="v07-tech-note">${tr("≤22 kW -luokan langaton järjestelmä on tässä edelleen työpajaskenaarion oletus, ei Tampereen lopullinen tekninen määritys.", "The ≤22 kW wireless-system class remains an illustrative workshop assumption, not the final Tampere technical specification.")}</small>
    `;

    const legends = [...document.querySelectorAll("#screen fieldset legend")];
    const auth = legends.find(el => /Miten V2G pitäisi|How should V2G normally/i.test(el.textContent || ""));
    if (auth) auth.textContent = tr("Miten yksittäinen V2G-aktivointi pitäisi normaalisti hyväksyä?", "How should an individual V2G activation normally be authorised?");
    const acceptance = legends.find(el => /Kuinka hyväksyttävä tämä V2G|How acceptable would this V2G/i.test(el.textContent || ""));
    if (acceptance) acceptance.textContent = tr("Kuinka hyväksyttävät nämä V2G-ehdot olisivat omassa työroolissasi?", "How acceptable would these V2G conditions be in your work role?");
  }

  function clock(minute) {
    const total = 15 * 60 + 30 + minute;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function cycleSnapshot(minute) {
    if (minute >= 70) return { time:"16:40", phase:tr("Valmis seuraavaan toimitukseen", "Ready for next delivery"), subphase:tr("Ajoneuvo vapautuu käyttöön ennen 16:45", "Vehicle released before 16:45"), soc:70, toVehicle:12.6, toGrid:3.6, net:9.0, credit:0.90, direction:"done", explanation:tr("Lähtövaraustakuu säilyi ja ajoneuvo on valmis seuraavaan toimitukseen.", "The departure-reserve guarantee remained protected and the vehicle is ready for the next delivery.") };
    if (minute >= 45) {
      const p = Math.min(1, (minute - 45) / 25);
      return { time:clock(minute), phase:tr("Langaton lataus jatkuu", "Wireless charging resumes"), subphase:tr("V2G päättyi · palautetaan lähtöpuskuri", "V2G ended · restoring departure buffer"), soc:Math.round(66 + 4 * p), toVehicle:Number((10.2 + 2.4 * p).toFixed(1)), toGrid:3.6, net:Number((6.6 + 2.4 * p).toFixed(1)), credit:0.90, direction:"charge", explanation:tr("Verkkopalvelu on päättynyt. Ajoneuvoa ladataan jälleen ennen lähtöä.", "The grid-service activation has ended. The vehicle is charging again before departure.") };
    }
    if (minute >= 30) {
      const p = Math.min(1, (minute - 30) / 15);
      const exported = Number((3.6 * p).toFixed(1));
      return { time:clock(minute), phase:tr("V2G aktiivinen", "V2G active"), subphase:tr("Energiaa ajoneuvosta sähköverkkoon", "Energy from vehicle to grid"), soc:Math.round(72 - 6 * p), toVehicle:10.2, toGrid:exported, net:Number((10.2 - exported).toFixed(1)), credit:Number((exported * 0.25).toFixed(2)), direction:"export", explanation:tr("Kysyntä on korkeampi ja uusiutuvaa sähköä on suhteellisesti vähemmän. Sopimuksen mukainen V2G-aktivointi on käynnissä.", "Demand is higher and renewable availability is relatively lower. The agreed V2G activation is running.") };
    }
    const p = minute / 30;
    return { time:clock(minute), phase:tr("Langaton lataus", "Wireless charging"), subphase:tr("Energiaa sähköverkosta ajoneuvoon", "Energy from grid to vehicle"), soc:Math.round(55 + 17 * p), toVehicle:Number((10.2 * p).toFixed(1)), toGrid:0, net:Number((10.2 * p).toFixed(1)), credit:0, direction:"charge", explanation:minute >= 20 ? tr("65 % lähtövaraustakuu on jo saavutettu. Ennen V2G:tä rakennetaan lisäpuskuri.", "The 65% departure reserve has been reached. An additional buffer is built before V2G.") : tr("Ajoneuvo ladataan ensin niin, että seuraavan toimituksen liikkumistarve turvataan.", "The vehicle charges first so the next delivery's mobility need is protected.") };
  }

  function slotIndex(minute) { return Math.max(0, Math.min(marketSlots.length - 1, Math.floor(minute / 15))); }

  function flowHtml(direction) {
    if (direction === "done") return `<div class="v07-flow-done">✓</div>`;
    const left = direction === "export" ? "🔋" : "⚡";
    const right = direction === "export" ? "⚡" : "🔋";
    return `<div class="v07-flow ${direction}"><div class="v07-flow-node">${left}</div><div class="v07-flow-lane" aria-hidden="true">${[0,1,2,3,4].map(i => `<span style="--i:${i}">●</span>`).join("")}<b>→</b></div><div class="v07-flow-node">${right}</div></div>`;
  }

  function marketHtml(minute) {
    const active = slotIndex(minute);
    return `<div class="v07-market"><div class="v07-market-head"><strong>${tr("15 min sähköjärjestelmän tilanne", "15-minute electricity-system context")}</strong><small>${tr("Kuvitteelliset työpaja-arvot", "Illustrative workshop values")}</small></div><div class="v07-market-slots">${marketSlots.map((s, i) => `<div class="v07-market-slot ${i === active ? "active" : ""}"><strong>${s.time}</strong><span>${tr("kys.", "dem.")} ${tr(s.demand[0], s.demand[1])}</span><span>RES ${tr(s.res[0], s.res[1])}</span><b>${s.price} c/kWh*</b></div>`).join("")}</div><small class="v07-market-foot">${tr("* Hintasignaali on vain havainnollistava konteksti. V2G-hyvitys lasketaan tässä erillisellä kuvitteellisella sopimushinnalla.", "* The price signal is illustrative context only. The V2G credit here uses a separate fictional contract rate.")}</small></div>`;
  }

  function renderCycle(card, minute, running, done) {
    const s = cycleSnapshot(minute);
    const progress = Math.min(100, Math.round((minute / 70) * 100));
    card.innerHTML = `<div class="v07-cycle-top"><div><span>${tr("Simuloitu aika", "Simulated time")}</span><strong>${s.time}</strong></div><div><span>${tr("Käytettävyysikkuna", "Availability window")}</span><strong>15:30–16:45</strong></div><div><span>${tr("Lähtö viimeistään", "Leave by")}</span><strong>17:00</strong></div></div><div class="v07-cycle-main ${s.direction}"><div class="scenario-badge">${tr("Nopeutettu työpajasimulaatio", "Accelerated workshop simulation")}</div><div class="v07-phase"><strong>${s.phase}</strong><span>${s.subphase}</span></div><div class="v07-battery-row"><div class="v07-battery" role="img" aria-label="${tr("Akun varaustaso", "Battery state of charge")} ${s.soc}%"><div class="v07-battery-fill" style="width:${s.soc}%"></div><strong>${s.soc}%</strong></div><div class="v07-battery-status"><span>${tr("Suojattu lähtövaraus", "Protected reserve")}</span><strong>65%</strong></div></div>${flowHtml(s.direction)}<div class="v07-energy-counters"><div><span>${tr("Ajoneuvoon", "To vehicle")}</span><strong>${s.toVehicle.toFixed(1)} kWh</strong></div><div><span>${tr("Verkkoon", "To grid")}</span><strong>${s.toGrid.toFixed(1)} kWh</strong></div><div><span>${tr("Netto akkuun", "Net to battery")}</span><strong>+${s.net.toFixed(1)} kWh</strong></div><div class="v07-credit"><span>${tr("V2G-hyvitys", "V2G credit")}</span><strong>€${s.credit.toFixed(2)}</strong></div></div><div class="v07-cycle-progress"><div style="width:${progress}%"></div></div><div class="v07-explanation">${s.explanation}</div>${marketHtml(minute)}${!running && !done ? `<button type="button" class="primary v07-run-cycle">${tr("Käynnistä noin 20 s nopeutettu jakso", "Run ~20 s accelerated cycle")}</button>` : ""}${done ? `<div class="v07-cycle-finish"><strong>✓ ${tr("Ajoneuvo valmis ennen käytettävyysikkunan päättymistä", "Vehicle ready before the availability window ends")}</strong><span>${tr("V2G-hyvitys tässä esimerkissä: €0,90 · vaikutus lähtöaikaan: 0 min", "Illustrative V2G credit: €0.90 · departure-time impact: 0 min")}</span></div>` : ""}</div><small class="v07-cycle-note">${tr("Energia-, SoC-, hinta- ja hyvitysarvot ovat yhtenäisen käyttöliittymäskenaarion oletuksia, eivät Tampereen mitattua dataa.", "Energy, SoC, price and credit values are internally consistent interface-scenario assumptions, not measured Tampere data.")}</small>`;
    card.querySelector(".v07-run-cycle")?.addEventListener("click", startCycle);
  }

  function findCoreRunButton() { return document.querySelector(".cycle-card [data-action='run-cycle']"); }
  function startCoreCycleWhenReady() {
    if (coreCycleStarted) return;
    const coreRun = findCoreRunButton();
    if (!coreRun || coreRun.disabled) { coreCycleStarted = true; return; }
    coreCycleStarted = true;
    coreRun.click();
  }

  function startCycle() {
    if (cycleRunning) return;
    cycleRunning = true;
    cycleMinute = 0;
    coreCycleStarted = false;
    const next = document.querySelector("[data-action='next']");
    if (next) next.disabled = true;
    const card = document.querySelector(".v07-cycle-card");
    if (card) renderCycle(card, cycleMinute, true, false);
    if (cycleTimer) clearInterval(cycleTimer);
    cycleTimer = setInterval(() => {
      cycleMinute += 1;
      if (cycleMinute === 50) startCoreCycleWhenReady();
      const liveCard = document.querySelector(".v07-cycle-card");
      if (liveCard) renderCycle(liveCard, cycleMinute, true, false);
      if (cycleMinute >= 70) {
        clearInterval(cycleTimer);
        cycleTimer = null;
        cycleRunning = false;
        startCoreCycleWhenReady();
        const finalCard = document.querySelector(".v07-cycle-card");
        if (finalCard) renderCycle(finalCard, 70, false, true);
        const liveNext = document.querySelector("[data-action='next']");
        if (liveNext) liveNext.disabled = false;
      }
    }, 300);
  }

  function cycleScreen() {
    if (!isCycleScreen()) return;
    const h1 = document.querySelector("#screen h1");
    if (h1) h1.textContent = tr("Seuraa latausta, V2G-aktivointia ja lähtövalmiutta", "Follow charging, V2G activation and departure readiness");
    const lead = h1?.nextElementSibling;
    if (lead?.classList.contains("lead")) lead.textContent = tr("Noin 75 minuutin pysäköintijakso nopeutetaan noin 20 sekuntiin. Seuraa akun varausta, energian suuntaa, 15 minuutin verkkotilannetta ja V2G-hyvityksen kertymistä.", "About 75 minutes of parked availability is compressed into roughly 20 seconds. Follow battery state, energy direction, 15-minute grid context and the accumulating V2G credit.");
    document.querySelector(".grid-context-v05")?.setAttribute("hidden", "");
    document.querySelector(".v06-cycle-card")?.setAttribute("hidden", "");
    const original = document.querySelector(".cycle-card");
    if (original) original.hidden = true;
    let card = document.querySelector(".v07-cycle-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "v07-cycle-card";
      const anchor = document.querySelector(".v06-cycle-card") || original;
      if (anchor) anchor.insertAdjacentElement("beforebegin", card); else lead?.insertAdjacentElement("afterend", card);
    }
    const coreRun = findCoreRunButton();
    const done = !!coreRun?.disabled || !!document.querySelector('input[name="energy_flow_clarity"]');
    if (cycleRunning) renderCycle(card, cycleMinute, true, false); else renderCycle(card, done ? 70 : 0, false, done);
  }

  function apply() { operationalWindow(); agreementScreen(); cycleScreen(); }
  if (screen) {
    const observer = new MutationObserver(() => queueMicrotask(apply));
    observer.observe(screen, { childList:true });
    queueMicrotask(apply);
  }
}
