const q091=new URLSearchParams(location.search);
if((q091.get("variant")||"fi-fleet")==="fi-fleet"){
  const screen=document.querySelector("#screen");
  const workshop=(q091.get("workshop")||"DEMO").replace(/[^A-Za-z0-9_-]/g,"").slice(0,32)||"DEMO";
  const ROLE_KEY=`pulse-v09-role-${workshop}`;
  const tr=(fi,en)=>document.documentElement.lang==="fi"?fi:en;
  const checkedRole=()=>document.querySelector('input[name="participant_group"]:checked')?.value||"";
  const manager=()=>((checkedRole()||sessionStorage.getItem(ROLE_KEY)||"")==="fleet_manager");
  const h=()=>screen?.querySelector("h1")?.textContent||"";
  const field=name=>document.querySelector(`input[name="${name}"]`)?.closest("fieldset");
  const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text;};
  const relabel=(name,labels)=>{const nodes=field(name)?.querySelectorAll("label span")||[];labels.forEach((pair,i)=>setText(nodes[i],tr(pair[0],pair[1])));};
  let raf=0;

  function agreement(){
    const active=manager()&&/Mitä V2G-sopimuksen pitäisi taata|What should the V2G agreement guarantee/i.test(h());
    document.body.classList.toggle("v091-manager-contract",active);
    if(!active)return;
    // Older v0.7/v0.8 explanation blocks are intentionally hidden by v091.css.
    const lead=screen?.querySelector("h1")?.nextElementSibling;
    if(lead?.classList.contains("lead"))setText(lead,tr(
      "Kalusto-organisaatio hyväksyy palvelun ehdot ennen käyttöönottoa. Arvioi sopimuksen keskeiset takuut ja sen jälkeen yksittäisten V2G-aktivointien hallintamalli.",
      "The fleet organisation approves the service terms before deployment. Review the core guarantees, then the governance model for individual V2G activations."
    ));
  }

  function cycleSummary(){
    if(!manager()||!/Arvioi yhden palvelujakson suorituskyky|Review one service session/i.test(h()))return;
    const finish=document.querySelector(".v07-cycle-finish");
    if(!finish||getComputedStyle(finish).display==="none")return;
    if(document.querySelector(".v091-sla-summary"))return;
    const summary=document.createElement("section");
    summary.className="v091-sla-summary";
    summary.innerHTML=`<div class="v091-sla-head"><strong>${tr("Session SLA-yhteenveto","Session SLA summary")}</strong><span>${tr("Työpajaskenaario","Workshop scenario")}</span></div>
      <div class="v091-sla-grid">
        <div><span>${tr("Lähtövaraus","Departure reserve")}</span><strong>✓ 70% ≥ 65%</strong></div>
        <div><span>${tr("Lähtövalmius","Ready by required time")}</span><strong>✓ 16:40</strong></div>
        <div><span>${tr("V2G verkkoon","V2G exported")}</span><strong>3.6 kWh</strong></div>
        <div><span>${tr("V2G-hyvitys","V2G credit")}</span><strong>€0.90</strong></div>
        <div><span>${tr("Ohitukset","Overrides")}</span><strong>${tr("ei","none")}</strong></div>
        <div><span>${tr("Häiriöt","Faults")}</span><strong>${tr("ei","none")}</strong></div>
      </div>
      <small>${tr("Yksi onnistunut sessio osoittaa vain tämän skenaarion tuloksen — pitkäaikainen luotettavuus vaatii useiden sessioiden SLA-seurantaa.","One successful session shows only this scenario result — long-term reliability requires SLA monitoring across many sessions.")}</small>`;
    const note=document.querySelector(".v09-evidence-note");
    (note||document.querySelector(".v07-cycle-card"))?.insertAdjacentElement("afterend",summary);
  }

  function fault(){
    if(!manager()||!/Talvihäiriö — mitä palvelusopimuksen pitäisi edellyttää|Winter fault — what should the service agreement require/i.test(h()))return;
    const decision=field("fault_decision");
    if(decision){
      setText(decision.querySelector("legend"),tr("Mikä olisi ensisijainen toimintatapa tässä tilanteessa?","What should be the primary operating response in this situation?"));
      relabel("fault_decision",[
        ["Yksi ohjattu uudelleenyritys, enintään +3 min; sen jälkeen ajoneuvo vapautetaan","One guided retry, maximum +3 min; then release the vehicle"],
        ["Ajoneuvo vapautetaan heti seuraavaan toimitukseen","Release the vehicle immediately for the next delivery"],
        ["Ajoneuvo pidetään paikallaan vain, jos operointi hyväksyy lisäviiveen","Keep the vehicle at the site only if operations approves additional delay"],
        ["Langaton sessio lopetetaan ja lataus siirretään varikolle","End the wireless session and move charging to the depot"]
      ]);
    }
    if(decision&&!document.querySelector(".v091-sla-fault-note")){
      const note=document.createElement("div");note.className="v091-sla-fault-note";
      note.innerHTML=`<strong>${tr("SLA-seuranta","SLA monitoring")}</strong><span>${tr("Epäonnistunut langaton sessio kirjataan automaattisesti häiriöksi riippumatta valitusta operatiivisesta vararatkaisusta.","An unsuccessful wireless session is automatically logged as a service fault regardless of the operational fallback selected.")}</span>`;
      decision.insertAdjacentElement("afterend",note);
    }
    const owner=field("fault_owner");
    if(owner){
      setText(owner.querySelector("legend"),tr("Kenen pitäisi kantaa päävastuu toistuvan teknisen häiriön ratkaisemisesta palvelutasolla?","Who should carry primary accountability for resolving repeated technical faults at service level?"));
      relabel("fault_owner",[
        ["Palveluntarjoaja / tekninen toimittaja sopimuksen mukaan","Service provider / technical supplier under the agreement"],
        ["Kalusto-organisaatio","Fleet organisation"],
        ["Jaettu vastuu ennalta määritellyn rajapinnan mukaan","Shared responsibility under a predefined interface"],
        ["Vastuu määräytyy vian lähteen mukaan, mutta yksi nimetty taho johtaa eskalointia","Responsibility follows the fault source, with one named owner leading escalation"]
      ]);
    }
  }

  function apply(){
    agreement();cycleSummary();fault();
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;apply();});}
  if(screen){
    const observer=new MutationObserver(schedule);observer.observe(screen,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class","hidden"]});
    document.addEventListener("change",schedule,true);
    schedule();
  }
}
