const v1CycleParams = new URLSearchParams(location.search);
if ((v1CycleParams.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");
  const fi = () => document.documentElement.lang === "fi";
  const tr = (a,b) => fi() ? a : b;
  let lastSnapshot = window.PULSE_CHARGING_LAST_SNAPSHOT || null;
  let running = false;
  let runError = "";
  let renderedState = null;
  let renderedDirection = null;

  const marketSlots = [
    ["15:30","keskitaso","paljon",8],["15:45","nouseva","paljon",11],["16:00","korkea","vähemmän",17],
    ["16:15","korkea","vähemmän",14],["16:30","laskeva","keskitaso",11],["16:45","keskitaso","keskitaso",9]
  ];

  function activeSlot(state) {
    if (state === "READY") return 0;
    if (state === "CHARGING") return 1;
    if (state === "V2G_AVAILABLE") return 2;
    if (state === "V2G_ACTIVE") return 3;
    if (state === "RECHARGING") return 4;
    return 5;
  }

  function view(snapshot) {
    const s = snapshot || {state:"READY",soc_percent:55,protected_soc_percent:65,energy_to_vehicle_kwh:0,energy_to_grid_kwh:0,direction:"idle",departure_ready:false};
    const toVehicle = Number(s.energy_to_vehicle_kwh || 0);
    const toGrid = Number(s.energy_to_grid_kwh || 0);
    const soc = Number(s.soc_percent ?? 55);
    const net = toVehicle - toGrid;
    let time="15:30", phase=tr("Valmiina aloittamaan","Ready to start"), sub=tr("Ajoneuvo on kohdistettu ja lataus voi alkaa","Vehicle is aligned and charging can begin"), progress=0, explanation=tr("Jakso ei ole vielä käynnissä.","The session has not started yet.");
    if (s.state === "CHARGING") {
      time = toVehicle < 4 ? "15:35" : "15:50"; phase=tr("Langaton lataus","Wireless charging"); sub=tr("Energiaa sähköverkosta ajoneuvoon","Energy from grid to vehicle"); progress=toVehicle < 4 ? 12 : 32; explanation=soc >= 65 ? tr("65 % lähtövaraustakuu on saavutettu. Ennen V2G:tä rakennetaan lisäpuskuri.","The 65% departure reserve is protected. An additional buffer is built before V2G.") : tr("Ajoneuvoa ladataan ensin seuraavan toimituksen liikkumistarpeen turvaamiseksi.","The vehicle charges first to protect the next delivery's mobility need.");
    } else if (s.state === "V2G_AVAILABLE") {
      time="16:00"; phase=tr("V2G-jousto saatavilla","V2G flexibility available"); sub=tr("Lähtövaraus ja käyttöaika tarkistettu","Departure reserve and availability checked"); progress=45; explanation=tr("V2G voidaan aktivoida vain sovittujen rajojen sisällä.","V2G can activate only within the agreed limits.");
    } else if (s.state === "V2G_ACTIVE") {
      time=toGrid < 1.5 ? "16:05" : toGrid < 3 ? "16:10" : "16:15"; phase=tr("V2G aktiivinen","V2G active"); sub=tr("Energiaa ajoneuvosta sähköverkkoon","Energy from vehicle to grid"); progress=55 + Math.min(18, Math.round(toGrid/3.6*18)); explanation=tr("Kysyntä on korkeampi ja energiaa palautetaan verkkoon sopimuksen rajoissa.","Demand is higher and energy is returned to the grid within the agreed limits.");
    } else if (s.state === "RECHARGING") {
      time=toVehicle < 11 ? "16:25" : "16:35"; phase=tr("Langaton lataus jatkuu","Wireless charging resumes"); sub=tr("V2G päättyi · palautetaan lähtöpuskuri","V2G ended · restoring departure buffer"); progress=82 + Math.min(10,Math.round(Math.max(0,toVehicle-10.2)/2.4*10)); explanation=tr("Verkkopalvelu on päättynyt. Ajoneuvoa ladataan jälleen ennen lähtöä.","The grid-service activation has ended. The vehicle is charging again before departure.");
    } else if (s.state === "PAUSED") {
      time="16:15"; phase=tr("Odottaa – ajoneuvo kytkettynä","Holding – vehicle remains connected"); sub=tr("Ei energiansiirtoa","No energy transfer"); progress=74; explanation=tr("Ajoneuvo odottaa yhteisen kellon seuraavaa päätöstä.","The vehicle waits for the next shared-clock decision.");
    } else if (s.state === "READY_TO_DEPART") {
      time="16:40"; phase=tr("Valmis seuraavaan toimitukseen","Ready for next delivery"); sub=tr("Ajoneuvo vapautuu käyttöön ennen 16:45","Vehicle released before 16:45"); progress=100; explanation=tr("Lähtövaraustakuu säilyi ja ajoneuvo on valmis seuraavaan toimitukseen.","The departure-reserve guarantee remained protected and the vehicle is ready for the next delivery.");
    } else if (s.state === "OVERRIDDEN") {
      time="—"; phase=tr("Jakso keskeytetty","Session overridden"); sub=tr("Ajoneuvo palautetaan käyttöön","Vehicle returned to service"); progress=100; explanation=tr("Ohitus pysäytti verkkopalvelun turvallisesti.","The override stopped grid service safely.");
    }
    return {s,toVehicle,toGrid,soc,net,time,phase,sub,progress,explanation,credit:toGrid*0.25};
  }

  function flowHtml(direction,state) {
    if (state === "READY_TO_DEPART") return `<div class="v07-flow-done">✓</div>`;
    if (direction === "idle") return `<div class="v07-flow-done">●</div>`;
    const exporting = direction === "vehicle_to_grid";
    return `<div class="v07-flow ${exporting ? "export" : "charge"}"><div class="v07-flow-node">${exporting ? "🔋" : "⚡"}</div><div class="v07-flow-lane" aria-hidden="true"><span>●</span><span>●</span><span>●</span><b>→</b></div><div class="v07-flow-node">${exporting ? "⚡" : "🔋"}</div></div>`;
  }

  function marketHtml(state) {
    const active=activeSlot(state);
    return `<div class="v07-market"><div class="v07-market-head"><strong>${tr("15 min sähköjärjestelmän tilanne","15-minute electricity-system context")}</strong><small>${tr("Kuvitteelliset työpaja-arvot","Illustrative workshop values")}</small></div><div class="v07-market-slots">${marketSlots.map((s,i)=>`<div class="v07-market-slot ${i===active?"active":""}"><strong>${s[0]}</strong><span>${tr("kys.","dem.")} ${tr(s[1],s[1])}</span><span>RES ${tr(s[2],s[2])}</span><b>${s[3]} c/kWh*</b></div>`).join("")}</div><small class="v07-market-foot">${tr("* Hintasignaali on havainnollistava. V2G-hyvitys käyttää erillistä kuvitteellista sopimushintaa 0,25 €/kWh.","* Price signal is illustrative. V2G credit uses a separate fictional contract rate of €0.25/kWh.")}</small></div>`;
  }

  function render() {
    const card=document.querySelector(".v1-adapter-cycle");
    if (!card) return;
    const v=view(lastSnapshot);
    const done=v.s.state === "READY_TO_DEPART";
    const dev=v1CycleParams.get("dev") === "1" ? `<small class="v07-cycle-note">pulse-session-v1 · ${window.PULSE_CHARGING?.mode || "mock"}</small>` : "";
    card.innerHTML=`<div class="v07-cycle-top"><div><span>${tr("Simuloitu aika","Simulated time")}</span><strong>${v.time}</strong></div><div><span>${tr("Käytettävyysikkuna","Availability window")}</span><strong>15:30–16:45</strong></div><div><span>${tr("Lähtö viimeistään","Leave by")}</span><strong>17:00</strong></div></div>
      <div class="v07-cycle-main ${v.s.direction === "vehicle_to_grid" ? "export" : v.s.state === "READY_TO_DEPART" ? "done" : "charge"}"><div class="scenario-badge">${tr("Nopeutettu työpajasimulaatio","Accelerated workshop simulation")}</div><div class="v07-phase"><strong>${v.phase}</strong><span>${v.sub}</span></div><div class="v07-battery-row"><div class="v07-battery" role="img" aria-label="${tr("Akun varaustaso","Battery state of charge")} ${v.soc}%"><div class="v07-battery-fill" style="width:${v.soc}%"></div><strong>${v.soc}%</strong></div><div class="v07-battery-status"><span>${tr("Suojattu lähtövaraus","Protected reserve")}</span><strong>${v.s.protected_soc_percent ?? 65}%</strong></div></div>${flowHtml(v.s.direction,v.s.state)}<div class="v07-energy-counters"><div><span>${tr("Ajoneuvoon","To vehicle")}</span><strong>${v.toVehicle.toFixed(1)} kWh</strong></div><div><span>${tr("Verkkoon","To grid")}</span><strong>${v.toGrid.toFixed(1)} kWh</strong></div><div><span>${tr("Netto akkuun","Net to battery")}</span><strong>${v.net>=0?"+":""}${v.net.toFixed(1)} kWh</strong></div><div class="v07-credit"><span>${tr("V2G-hyvitys","V2G credit")}</span><strong>€${v.credit.toFixed(2)}</strong></div></div><div class="v07-cycle-progress"><div style="width:${v.progress}%"></div></div><div class="v07-explanation">${v.explanation}</div>${marketHtml(v.s.state)}${runError?`<p class="inline-error error">${runError}</p>`:""}${!running&&!done?`<button type="button" class="primary v1-run-adapter-cycle">${tr("Käynnistä noin 20 s nopeutettu jakso","Run ~20 s accelerated cycle")}</button>`:""}${done?`<div class="v07-cycle-finish"><strong>✓ ${tr("Ajoneuvo valmis ennen käytettävyysikkunan päättymistä","Vehicle ready before the availability window ends")}</strong><span>${tr(`V2G-hyvitys tässä esimerkissä: €${v.credit.toFixed(2)} · vaikutus lähtöaikaan: 0 min`,`Illustrative V2G credit: €${v.credit.toFixed(2)} · departure-time impact: 0 min`)}</span></div><button type="button" class="secondary v1-replay-adapter-cycle">↻ ${tr("Katso jakso uudelleen","Replay cycle")}</button>`:""}</div>${dev}`;
    card.querySelector(".v1-run-adapter-cycle")?.addEventListener("click",()=>start(false));
    card.querySelector(".v1-replay-adapter-cycle")?.addEventListener("click",()=>start(true));
    renderedState=v.s.state;
    renderedDirection=v.s.direction;
  }

  function patchLiveValues(snapshot) {
    const card=document.querySelector(".v1-adapter-cycle");
    if (!card) return false;
    const v=view(snapshot);
    if (renderedState !== v.s.state || renderedDirection !== v.s.direction) return false;
    const battery=card.querySelector(".v07-battery");
    const fill=battery?.querySelector(".v07-battery-fill");
    const batteryValue=battery?.querySelector(":scope > strong");
    if (!battery || !fill || !batteryValue) return false;
    fill.style.width=`${v.soc}%`;
    batteryValue.textContent=`${v.soc}%`;
    battery.setAttribute("aria-label",`${tr("Akun varaustaso","Battery state of charge")} ${v.soc}%`);
    const counters=card.querySelectorAll(".v07-energy-counters > div strong");
    if (counters[0]) counters[0].textContent=`${v.toVehicle.toFixed(1)} kWh`;
    if (counters[1]) counters[1].textContent=`${v.toGrid.toFixed(1)} kWh`;
    if (counters[2]) counters[2].textContent=`${v.net>=0?"+":""}${v.net.toFixed(1)} kWh`;
    if (counters[3]) counters[3].textContent=`€${v.credit.toFixed(2)}`;
    const progress=card.querySelector(".v07-cycle-progress > div");
    if (progress) progress.style.width=`${v.progress}%`;
    return true;
  }

  async function start(replay) {
    if (running) return;
    const adapter=window.PULSE_CHARGING?.adapter;
    if (!adapter || typeof adapter.runReferenceCycle !== "function") {
      runError=tr("Mock-jaksoa ei ole saatavilla tässä backend-tilassa.","Reference cycle is not available in this backend mode."); render(); return;
    }
    runError=""; running=true;
    const next=document.querySelector("[data-action='next']"); if(next) next.disabled=true;
    if (!replay) {
      const legacy=document.querySelector(".cycle-card [data-action='run-cycle']");
      if (legacy && !legacy.disabled) legacy.click();
    }
    render();
    try { await adapter.runReferenceCycle(); }
    catch (e) { runError=e?.message || tr("Jakso epäonnistui.","Cycle failed."); running=false; render(); }
  }

  function ensure() {
    const old=document.querySelector(".v07-cycle-card");
    if (!old) return;
    old.hidden=true;
    let card=document.querySelector(".v1-adapter-cycle");
    if (!card) {
      card=document.createElement("section"); card.className="v1-adapter-cycle";
      old.insertAdjacentElement("beforebegin",card);
      render();
    }
    if (running) { const next=document.querySelector("[data-action='next']"); if(next) next.disabled=true; }
  }

  window.addEventListener("pulse:charging-snapshot",e=>{
    lastSnapshot=e.detail;
    running=["CHARGING","V2G_AVAILABLE","V2G_ACTIVE","RECHARGING","PAUSED"].includes(lastSnapshot?.state);
    if(lastSnapshot?.state === "READY_TO_DEPART") running=false;
    ensure();
    if (!patchLiveValues(lastSnapshot)) render();
    if(lastSnapshot?.state === "READY_TO_DEPART") { const next=document.querySelector("[data-action='next']"); if(next) next.disabled=false; }
  });
  window.addEventListener("pulse:charging-ready",()=>{lastSnapshot=window.PULSE_CHARGING_LAST_SNAPSHOT||lastSnapshot;ensure();render();});
  if(screen){let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensure();});}).observe(screen,{childList:true,subtree:false});ensure();}
}
