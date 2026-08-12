const p=new URLSearchParams(location.search);
if((p.get("variant")||"fi-fleet")==="fi-fleet"){
  const screen=document.querySelector("#screen");
  const workshop=(p.get("workshop")||"DEMO").replace(/[^A-Za-z0-9_-]/g,"").slice(0,32)||"DEMO";
  const ROLE_KEY=`pulse-v08-role-${workshop}`;
  const tr=(fi,en)=>document.documentElement.lang==="fi"?fi:en;
  const dispatcher=()=>sessionStorage.getItem(ROLE_KEY)==="dispatcher"||document.querySelector('input[name="participant_group"]:checked')?.value==="dispatcher";
  const heading=()=>screen?.querySelector("h1")?.textContent||"";
  const agreement=()=>/V2G-aktivoinnin hallinta|V2G activation control/i.test(heading());
  const fault=()=>/Lataus keskeytyi — tee operatiivinen päätös|Charging stopped — make an operational decision/i.test(heading());
  const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text;};

  function compactAgreement(){
    if(!dispatcher()||!agreement())return;
    document.body.classList.add("v081-dispatcher-agreement");
    document.querySelector(".v07-agreement-card")?.setAttribute("hidden","");
    document.querySelector(".v06-v2g-condition")?.setAttribute("hidden","");
    [...document.querySelectorAll("#screen > .guarantee")].forEach(el=>{if(/Liikkuminen etusijalla|Mobility first/i.test(el.textContent||""))el.setAttribute("hidden","");});
    if(document.querySelector(".v081-dispatcher-contract"))return;
    const card=document.createElement("section");
    card.className="v081-dispatcher-contract";
    card.innerHTML=`
      <div class="v081-contract-head"><strong>${tr("Kaluston V2G-sopimus on voimassa","Fleet V2G agreement is active")}</strong><span>${tr("Organisaatiotason sopimusta ei hyväksytä uudelleen jokaisella pysähdyksellä.","The organisation-level agreement is not re-approved at every stop.")}</span></div>
      <div class="v081-guarantees">
        <div><span>${tr("Suojattu lähtövaraus","Protected departure reserve")}</span><strong>65%</strong></div>
        <div><span>${tr("Aikaisempi käyttöönotto","Early recall")}</span><strong>${tr("sallittu","allowed")}</strong></div>
        <div><span>${tr("Akun suojaus","Battery protection")}</span><strong>${tr("sovituissa rajoissa","within agreed limits")}</strong></div>
        <div><span>${tr("Seuraava toimitus","Next delivery")}</span><strong>${tr("ei saa viivästyä","must not be delayed")}</strong></div>
      </div>
      <div class="v081-credit"><span><strong>${tr("Esimerkkihyvitys","Illustrative credit")}</strong><small>${tr("Kuvitteellinen työpajasopimus — ei markkinahinta eikä Tampereen lopullinen korvausmalli.","Illustrative workshop contract — not a market price or final Tampere compensation model.")}</small></span><b>0,25 €/kWh</b></div>
      <div class="v081-activation"><strong>${tr("Yksittäinen aktivointi","Individual activation")}</strong><span>${tr("Kun ajoneuvo on pysäköitynä ja käytettävissä, järjestelmä voi pyytää V2G-joustoa vain näiden rajojen sisällä.","When the vehicle is parked and available, the system may request V2G flexibility only within these limits.")}</span></div>`;
    const firstField=screen.querySelector("fieldset");
    firstField?.insertAdjacentElement("beforebegin",card);
  }

  function refineFault(){
    if(!dispatcher()||!fault())return;
    const labels={
      retry:tr("Tarkista latausalue, kohdista uudelleen ja yritä kerran uudelleen — arvio +3 min","Check the charging area, realign and retry once — estimated +3 min"),
      support:tr("Pidä ajoneuvo paikallaan ja eskaloi tekniseen tukeen","Keep the vehicle parked and escalate to technical support")
    };
    Object.entries(labels).forEach(([value,text])=>setText(document.querySelector(`input[name='fault_decision'][value='${value}']`)?.closest("label")?.querySelector("span"),text));
    if(!document.querySelector(".v081-reserve-note")){
      const metrics=document.querySelector(".v071-fault-metrics");
      if(metrics){
        const note=document.createElement("div");
        note.className="v081-reserve-note";
        note.textContent=tr("Tässä skenaariossa 65 % lähtövaraus riittää seuraavaan osoitettuun toimitukseen.","In this scenario, the 65% departure reserve is sufficient for the next assigned delivery.");
        metrics.insertAdjacentElement("afterend",note);
      }
    }
  }

  function apply(){
    if(!dispatcher()){document.body.classList.remove("v081-dispatcher-agreement");return;}
    compactAgreement();
    refineFault();
  }
  if(screen){const observer=new MutationObserver(()=>queueMicrotask(apply));observer.observe(screen,{childList:true});queueMicrotask(apply);}
}
