const v071Params = new URLSearchParams(location.search);
if ((v071Params.get("variant") || "fi-fleet") === "fi-fleet") {
  document.body.classList.add("v071-fi-fleet");
  const screen = document.querySelector("#screen");
  const fi = () => document.documentElement.lang === "fi";
  const tr = (fiText, enText) => fi() ? fiText : enText;
  let replayTimer = null;

  const replaySlots = [
    {time:"15:30",demand:["keskitaso","moderate"],res:["paljon","high"]},
    {time:"15:45",demand:["nouseva","rising"],res:["paljon","high"]},
    {time:"16:00",demand:["korkea","high"],res:["vähemmän","lower"]},
    {time:"16:15",demand:["korkea","high"],res:["vähemmän","lower"]},
    {time:"16:30",demand:["laskeva","easing"],res:["keskitaso","moderate"]},
    {time:"16:45",demand:["keskitaso","moderate"],res:["keskitaso","moderate"]}
  ];

  function headingText() { return document.querySelector("#screen h1")?.textContent || ""; }
  function isAgreement() { return /Millä ehdoilla ajoneuvo|Under what conditions can the vehicle|V2G ennen latausjaksoa|V2G decision before|Sopiiko lyhyt V2G/i.test(headingText()); }
  function isCycle() { return /Seuraa latausta, V2G-aktivointia|Follow charging, V2G activation|Seuraa yksi virtuaalinen lataus|Run one virtual charging/i.test(headingText()); }
  function isFault() { return /Lumimyrsky keskeyttää|Snowstorm interrupts|Talviolosuhde keskeyttää|Winter conditions interrupt/i.test(headingText()); }

  function simplifyAgreement() {
    if (!isAgreement()) { document.body.classList.remove("v071-agreement-active"); return; }
    document.body.classList.add("v071-agreement-active");
    const h1 = document.querySelector("#screen h1");
    if (h1) h1.textContent = tr("Millä ehdoilla ajoneuvo voi osallistua V2G:hen?", "Under what conditions can the vehicle participate in V2G?");
    const lead = h1?.nextElementSibling;
    if (lead?.classList.contains("lead")) lead.textContent = tr(
      "Kaluston V2G-sopimus on tässä skenaariossa jo hyväksytty. Tarkista neljä keskeistä takuuta ja arvioi sen jälkeen, kuka hyväksyy yksittäisen V2G-aktivoinnin.",
      "The fleet V2G agreement is already in place in this scenario. Review the four key guarantees, then decide who should authorise an individual V2G activation."
    );

    const card = document.querySelector(".v07-agreement-card");
    if (!card) return;
    const badge = card.querySelector(".scenario-badge");
    if (badge) badge.textContent = tr("Työpajaskenaario · kaluston V2G-sopimus on voimassa", "Workshop scenario · fleet V2G agreement is in place");
    card.querySelector(".v07-contract-level")?.setAttribute("hidden", "");
    card.querySelector(".v07-contract-rule")?.setAttribute("hidden", "");
    card.querySelector(".v07-activation-level")?.setAttribute("hidden", "");
    card.querySelector(".v07-tech-note")?.setAttribute("hidden", "");

    const grid = card.querySelector(".v07-contract-grid");
    if (grid) {
      const tiles = [...grid.children];
      const availability = tiles.find(el => /Käytettävyysikkuna|Availability window/i.test(el.textContent || ""));
      const label = availability?.querySelector("span");
      if (label) label.textContent = tr("Ajoneuvo käytettävissä", "Vehicle available");
      if (!card.querySelector(".v071-agreement-summary")) {
        const summary = document.createElement("div");
        summary.className = "v071-agreement-summary";
        summary.innerHTML = `<strong>${tr("Sopimuksen neljä takuuta", "Four agreement guarantees")}</strong><span>${tr("Liikkumistarve ja akun suojaus menevät aina verkkopalvelun edelle.", "Mobility needs and battery protection always take priority over grid service.")}</span>`;
        grid.insertAdjacentElement("beforebegin", summary);
      }
    }

    const compensationNote = card.querySelector(".v07-comp-rule small");
    if (compensationNote) compensationNote.textContent = tr("Kuvitteellinen työpajasopimus — ei markkinahinta eikä Tampereen lopullinen korvausmalli.", "Illustrative workshop contract — not a market price or final Tampere compensation model.");

    document.querySelector(".v06-v2g-condition")?.setAttribute("hidden", "");
    [...document.querySelectorAll("#screen > .guarantee")].forEach(el => {
      if (/Liikkuminen etusijalla|Mobility first/i.test(el.textContent || "")) el.setAttribute("hidden", "");
    });

    const legends = [...document.querySelectorAll("#screen fieldset legend")];
    const auth = legends.find(el => /Miten V2G pitäisi|yksittäinen V2G-aktivointi|How should V2G normally|individual V2G activation/i.test(el.textContent || ""));
    if (auth) auth.textContent = tr("Kuka hyväksyy yksittäisen V2G-aktivoinnin?", "Who should authorise an individual V2G activation?");
    const acceptance = legends.find(el => /Kuinka hyväksyttävä tämä V2G|Kuinka hyväksyttävät nämä V2G|How acceptable would this V2G|How acceptable would these V2G/i.test(el.textContent || ""));
    if (acceptance) acceptance.textContent = tr("Kuinka hyväksyttävät nämä V2G-ehdot olisivat omassa työroolissasi?", "How acceptable would these V2G conditions be in your work role?");
  }

  function replaySnapshot(minute) {
    if (minute >= 70) return {time:"16:40",phase:tr("Valmis seuraavaan toimitukseen","Ready for next delivery"),sub:tr("Ajoneuvo vapautuu käyttöön","Vehicle released for service"),soc:70,toVehicle:12.6,toGrid:3.6,net:9.0,credit:0.90,direction:"done",explanation:tr("Lähtövaraustakuu säilyi ja ajoneuvo on valmis seuraavaan toimitukseen.","The departure-reserve guarantee remained protected and the vehicle is ready for the next delivery.")};
    if (minute >= 45) { const p=Math.min(1,(minute-45)/25); return {time:clock(minute),phase:tr("Ladataan lähtöä varten","Charging for departure"),sub:tr("V2G päättyi · palautetaan lähtöpuskuri","V2G ended · restoring departure buffer"),soc:Math.round(66+4*p),toVehicle:Number((10.2+2.4*p).toFixed(1)),toGrid:3.6,net:Number((6.6+2.4*p).toFixed(1)),credit:0.90,direction:"charge",explanation:tr("Verkkopalvelu päättyi. Energia kulkee jälleen verkosta ajoneuvoon.","The grid-service activation ended. Energy is flowing from the grid to the vehicle again.")}; }
    if (minute >= 30) { const p=Math.min(1,(minute-30)/15); const exported=Number((3.6*p).toFixed(1)); return {time:clock(minute),phase:tr("V2G AKTIIVINEN","V2G ACTIVE"),sub:tr("Energiaa ajoneuvosta sähköverkkoon","Energy from vehicle to grid"),soc:Math.round(72-6*p),toVehicle:10.2,toGrid:exported,net:Number((10.2-exported).toFixed(1)),credit:Number((exported*0.25).toFixed(2)),direction:"export",explanation:tr("Verkon joustotarve on korkeampi. Sovittu V2G-aktivointi palauttaa energiaa verkkoon.","Grid flexibility need is higher. The agreed V2G activation returns energy to the grid.")}; }
    const p=minute/30; return {time:clock(minute),phase:tr("LADATAAN","CHARGING"),sub:tr("Energiaa sähköverkosta ajoneuvoon","Energy from grid to vehicle"),soc:Math.round(55+17*p),toVehicle:Number((10.2*p).toFixed(1)),toGrid:0,net:Number((10.2*p).toFixed(1)),credit:0,direction:"charge",explanation:minute>=20?tr("65 % lähtövaraustakuu on saavutettu. Latausta jatketaan ennen mahdollista V2G-aktivointia.","The 65% departure reserve has been reached. Charging continues before possible V2G activation."):tr("Ajoneuvo ladataan ensin, jotta seuraava toimitus turvataan.","The vehicle charges first so the next delivery is protected.")};
  }

  function clock(minute) { const total=15*60+30+minute; return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`; }

  function replayFlow(direction) {
    if (direction === "done") return `<div class="v07-flow-done">✓</div>`;
    const left = direction === "export" ? "🔋" : "⚡";
    const right = direction === "export" ? "⚡" : "🔋";
    return `<div class="v07-flow ${direction}"><div class="v07-flow-node">${left}</div><div class="v07-flow-lane" aria-hidden="true">${[0,1,2,3,4].map(i=>`<span style="--i:${i}">●</span>`).join("")}<b>→</b></div><div class="v07-flow-node">${right}</div></div>`;
  }

  function paintReplay(minute) {
    const card = document.querySelector(".v07-cycle-card");
    if (!card) return;
    const s = replaySnapshot(minute);
    const topTime = card.querySelector(".v07-cycle-top > div:first-child strong"); if (topTime) topTime.textContent=s.time;
    const main = card.querySelector(".v07-cycle-main"); if (main) main.className=`v07-cycle-main ${s.direction}`;
    const phase = card.querySelector(".v07-phase strong"); if (phase) phase.textContent=s.phase;
    const sub = card.querySelector(".v07-phase span"); if (sub) sub.textContent=s.sub;
    const battery = card.querySelector(".v07-battery"); if (battery) battery.setAttribute("aria-label",`${tr("Akun varaustaso","Battery state of charge")} ${s.soc}%`);
    const fill = card.querySelector(".v07-battery-fill"); if (fill) fill.style.width=`${s.soc}%`;
    const batteryValue = card.querySelector(".v07-battery > strong"); if (batteryValue) batteryValue.textContent=`${s.soc}%`;
    const flow = card.querySelector(".v07-flow, .v07-flow-done");
    if (flow && ((s.direction === "done" && !flow.classList.contains("v07-flow-done")) || (s.direction !== "done" && !flow.classList.contains(s.direction)))) flow.outerHTML=replayFlow(s.direction);
    const counters=[...card.querySelectorAll(".v07-energy-counters > div strong")];
    if(counters[0]) counters[0].textContent=`${s.toVehicle.toFixed(1)} kWh`; if(counters[1]) counters[1].textContent=`${s.toGrid.toFixed(1)} kWh`; if(counters[2]) counters[2].textContent=`+${s.net.toFixed(1)} kWh`; if(counters[3]) counters[3].textContent=`€${s.credit.toFixed(2)}`;
    const progress=card.querySelector(".v07-cycle-progress > div"); if(progress) progress.style.width=`${Math.min(100,Math.round(minute/70*100))}%`;
    const explanation=card.querySelector(".v07-explanation"); if(explanation) explanation.textContent=s.explanation;
    const slots=[...card.querySelectorAll(".v07-market-slot")]; const active=Math.max(0,Math.min(5,Math.floor(minute/15))); slots.forEach((el,i)=>el.classList.toggle("active",i===active));
    const finish=card.querySelector(".v07-cycle-finish"); if(finish) finish.style.display=minute>=70?"grid":"none";
  }

  function replayCycle(button) {
    if (replayTimer) return;
    button.disabled=true;
    const next=document.querySelector("[data-action='next']"); if(next) next.disabled=true;
    let minute=0; paintReplay(0);
    replayTimer=setInterval(()=>{
      minute+=1; paintReplay(minute);
      if(minute>=70){ clearInterval(replayTimer); replayTimer=null; button.disabled=false; if(next) next.disabled=false; }
    },300);
  }

  function ensureReplay() {
    if (!isCycle()) return;
    const finish=document.querySelector(".v07-cycle-finish");
    if(!finish){ document.querySelector(".v071-replay-wrap")?.remove(); return; }
    let wrap=document.querySelector(".v071-replay-wrap");
    if(!wrap){
      wrap=document.createElement("div"); wrap.className="v071-replay-wrap";
      wrap.innerHTML=`<button type="button" class="secondary v071-replay">↻ ${tr("Katso jakso uudelleen","Replay the cycle")}</button><small>${tr("Uusinta ei muuta vastauksiasi — se näyttää saman simulaation uudelleen.","Replay does not change your answers — it only shows the same simulation again.")}</small>`;
      document.querySelector(".v07-cycle-card")?.insertAdjacentElement("afterend",wrap);
      wrap.querySelector(".v071-replay")?.addEventListener("click",e=>replayCycle(e.currentTarget));
    }
  }

  function refineFault() {
    if(!isFault()) return;
    const h1=document.querySelector("#screen h1"); if(h1) h1.textContent=tr("Talviolosuhde keskeyttää langattoman latauksen","Winter conditions interrupt wireless charging");
    const fault=document.querySelector(".fault-card");
    if(fault){
      const strong=fault.querySelector("strong"); if(strong) strong.textContent=tr("Langaton lataus keskeytyi turvallisesti","Wireless charging stopped safely");
      const p=fault.querySelector("p"); if(p) p.textContent=tr("Voimakas lumisade ja loska peittävät osan latausalueesta. Järjestelmä ei pysty enää varmistamaan latausalueen tunnistusta ja turvallista energiansiirtoa, joten lataus pysähtyy.","Heavy snow and slush cover part of the charging area. The system can no longer verify the charging area and safe energy transfer, so charging stops.");
      if(!document.querySelector(".v071-fault-metrics")){
        const metrics=document.createElement("div"); metrics.className="v071-fault-metrics";
        metrics.innerHTML=`<div><span>${tr("Akun varaus nyt","Battery now")}</span><strong>67%</strong></div><div><span>${tr("Taattu lähtövaraus","Protected reserve")}</span><strong>65%</strong></div><div><span>${tr("Aikaa lähtöön","Time to departure")}</span><strong>25 min</strong></div>`;
        fault.insertAdjacentElement("afterend",metrics);
      }
    }
    const badge=[...document.querySelectorAll("#screen .scenario-badge")].find(el=>/Työpajaskenaario|Workshop scenario/i.test(el.textContent||"")); if(badge) badge.textContent=tr("Työpajaskenaario · turvallinen keskeytys","Workshop scenario · safe interruption");
    const labels={
      retry:tr("Tarkista latausalue, kohdista uudelleen ja yritä kerran uudelleen — arvio +3 min","Check the charging area, realign and retry once — estimated +3 min"),
      override:tr("Lähde seuraavaan toimitukseen nyt ilman uutta latausyritystä","Leave for the next delivery now without another charging attempt"),
      support:tr("Pidä auto paikallaan ja ota yhteys ajojärjestelyyn / tukeen","Keep the vehicle parked and contact dispatch / support"),
      alternative:tr("Jatka reittiä ja suunnittele seuraava lataus varikolle","Continue the route and plan the next charge at the depot")
    };
    Object.entries(labels).forEach(([value,text])=>{ const input=document.querySelector(`input[name='fault_decision'][value='${value}']`); const span=input?.closest("label")?.querySelector("span"); if(span) span.textContent=text; });
  }

  function apply(){ simplifyAgreement(); ensureReplay(); refineFault(); }
  if(screen){ const observer=new MutationObserver(()=>queueMicrotask(apply)); observer.observe(screen,{childList:true}); queueMicrotask(apply); }
}
