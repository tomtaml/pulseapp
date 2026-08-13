const q09f=new URLSearchParams(location.search);
if((q09f.get("variant")||"fi-fleet")==="fi-fleet"){
  const screen=document.querySelector("#screen");
  const workshop=(q09f.get("workshop")||"DEMO").replace(/[^A-Za-z0-9_-]/g,"").slice(0,32)||"DEMO";
  const ROLE_KEY=`pulse-v09-role-${workshop}`;
  const tr=(fi,en)=>document.documentElement.lang==="fi"?fi:en;
  let alignPending=false;
  let applyQueued=false;

  const H=()=>screen?.querySelector("h1")?.textContent?.trim()||"";
  const has=re=>re.test(H());
  const is={
    welcome:()=>has(/Langaton lataus \+ V2G|Wireless charging \+ V2G/i),
    role:()=>has(/Mistä näkökulmasta|Which perspective/i),
    align:()=>has(/Aja langattomalle|Aja latausalueelle|Approach the wireless|Ajoneuvo saapui|Vehicle arrived|Palveluvaatimukset|Service requirements/i),
    limits:()=>has(/Seuraava toimitus määrittää|next delivery sets|Operatiiviset rajat|Operational limits|Palvelutaso|service level/i),
    agreement:()=>has(/Millä ehdoilla ajoneuvo|Under what conditions can the vehicle|V2G-aktivoinnin hallinta|V2G activation control|V2G-sopimuksen/i),
    cycle:()=>has(/Seuraa latausta, V2G-aktivointia|Follow charging, V2G activation|Ajoneuvon käytettävyys energiajakson aikana|vehicle availability during the energy session|palvelujakson suorituskyky|service session performance/i),
    fault:()=>has(/Talviolosuhde keskeyttää|Winter conditions interrupt|Lataus keskeytyi|Charging stopped|Talvihäiriö/i),
    comp:()=>has(/Ymmärtämisen tarkistus|Comprehension check/i),
    sus:()=>has(/Käytettävyys \(SUS\)|Usability \(SUS\)/i),
    trust:()=>has(/Luottamus ja hyväksyttävyys|Trust and acceptability/i)
  };

  const checkedRole=()=>document.querySelector('input[name="participant_group"]:checked')?.value||"";
  const role=()=>checkedRole()||sessionStorage.getItem(ROLE_KEY)||"";
  const manager=()=>role()==="fleet_manager";
  const field=name=>document.querySelector(`input[name="${name}"]`)?.closest("fieldset");
  const legend=name=>field(name)?.querySelector("legend");
  const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text;};
  const setHeading=(fi,en)=>setText(screen?.querySelector("h1"),tr(fi,en));
  const setLead=(fi,en)=>{const h=screen?.querySelector("h1"),lead=h?.nextElementSibling;if(lead?.classList.contains("lead"))setText(lead,tr(fi,en));};
  const relabelByIndex=(name,texts)=>{const labels=field(name)?.querySelectorAll("label span")||[];texts.forEach((pair,i)=>setText(labels[i],tr(pair[0],pair[1])));};

  function rolePage(){
    if(!is.role())return;
    document.querySelectorAll('input[name="participant_group"]').forEach(input=>{
      if(input.dataset.v09FixedBound)return;
      input.dataset.v09FixedBound="1";
      input.addEventListener("change",()=>{
        sessionStorage.setItem(ROLE_KEY,input.value);
        scheduleApply();
      });
    });
    const current=checkedRole();
    if(current)sessionStorage.setItem(ROLE_KEY,current);
    const existing=document.querySelector(".v09-role-preview");
    if(current!=="fleet_manager"){
      if(existing)existing.remove();
      return;
    }
    if(existing)return;
    const box=document.createElement("div");
    box.className="v09-role-preview";
    box.innerHTML=`<strong>${tr("Hankinta- ja sopimusreitti","Procurement and contract route")}</strong><span>${tr("Palvelutaso, lähtö- ja akkutakuut, V2G-ehdot, korvaus, talviriski, vastuut ja käyttöönotto.","Service level, mobility and battery guarantees, V2G terms, compensation, winter risk, accountability and deployment.")}</span>`;
    document.querySelector(".actions")?.insertAdjacentElement("beforebegin",box);
  }

  function syncAlignment(){
    if(!manager()||!is.align()||field("alignment_clarity")||alignPending)return;
    const guided=document.querySelector('.alignment-controls [data-align="guided"]');
    if(!guided)return;
    alignPending=true;
    setTimeout(()=>{alignPending=false;guided.click();},60);
  }

  function serviceRequirements(){
    if(!manager()||!is.align())return;
    syncAlignment();
    setHeading("Palveluvaatimukset ennen hankintapäätöstä","Service requirements before a procurement decision");
    setLead("Tarkastele samaa Tampereen N1-jakeluskenaariota organisaation näkökulmasta. Arvioi, mitä langattoman lataus- ja V2G-palvelun pitäisi vähintään taata kalustolle.","Review the same Tampere N1 delivery scenario from the organisation's perspective. Judge what the wireless charging and V2G service should at minimum guarantee for the fleet.");
    document.querySelector(".v06-positioning")?.remove();
    document.querySelector(".v06-fallback-rating")?.remove();
    let card=document.querySelector(".v09-service-card");
    if(!card){
      card=document.createElement("section");card.className="v09-service-card";
      card.innerHTML=`<div class="v09-card-head"><strong>${tr("Tampere · N1-jakelukalusto","Tampere · N1 delivery fleet")}</strong><span>${tr("Työpajaskenaario","Workshop scenario")}</span></div><div class="v09-guarantee-grid"><div><strong>🛡 ${tr("Liikkuminen","Mobility")}</strong><span>${tr("Seuraava toimitus ja suojattu lähtövaraus menevät verkkopalvelun edelle.","The next delivery and protected departure reserve take priority over grid service.")}</span></div><div><strong>🔋 ${tr("Akun suojaus","Battery protection")}</strong><span>${tr("V2G toimii vain ennalta sovituissa akku- ja käyttörajoissa.","V2G operates only within agreed battery and operating limits.")}</span></div><div><strong>❄ ${tr("Talvikäyttö","Winter operation")}</strong><span>${tr("Häiriötilanteelle on turvallinen keskeytys ja toimiva vararatkaisu.","Winter faults have a safe stop and workable fallback process.")}</span></div><div><strong>📋 ${tr("Todennettavuus","Verifiability")}</strong><span>${tr("Lähtövalmius, energiasiirto, ohitukset ja häiriöt voidaan todentaa palveluraportista.","Departure readiness, energy transfer, overrides and faults can be verified from service records.")}</span></div></div>`;
      screen?.querySelector("h1")?.nextElementSibling?.insertAdjacentElement("afterend",card);
    }
    const clarity=field("alignment_clarity");
    if(clarity){clarity.hidden=false;setText(clarity.querySelector("legend"),tr("Ovatko nämä perusvaatimukset riittävän selkeät palvelun arvioimiseksi?","Are these baseline requirements clear enough to evaluate the service?"));}
    if(!document.querySelector('input[name="alignment_fallback_acceptability"]')){
      const compat=document.createElement("input");compat.type="radio";compat.name="alignment_fallback_acceptability";compat.value="3";compat.checked=true;compat.hidden=true;screen.appendChild(compat);
    }
    [...screen.children].forEach(el=>{if(el.matches(".progress,.step-label,h1,.lead,.actions,.v09-service-card")||el===clarity||el.matches('input[name="alignment_fallback_acceptability"]'))return;el.hidden=true;});
  }

  function serviceLevel(){
    if(!manager()||!is.limits())return;
    setHeading("Määritä palvelutason operatiiviset rajat","Define the operational service level");
    setLead("Sopimuksen pitäisi suojata päivittäinen liikennöinti mutta jättää riittävästi joustoa lataukselle ja V2G:lle. Käytä seuraavaa toimitusta konkreettisena esimerkkinä.","The contract should protect daily operations while leaving useful flexibility for charging and V2G. Use the next delivery as a concrete example.");
    setText(legend("constraint_owner"),tr("Miten suojattu lähtövaraus pitäisi normaalisti määrittää?","How should the protected departure reserve normally be governed?"));
    relabelByIndex("constraint_owner",[["Kalusto-organisaatio määrittää sopimustason säännön","Fleet organisation defines the contractual rule"],["Ajojärjestely säätää päivittäisen tarpeen sopimusrajoissa","Operations adjusts daily needs within contract limits"],["Kuljettaja voi muuttaa rajaa sovituissa poikkeuksissa","Driver may adjust the reserve in agreed exceptions"],["Jaettu sääntö: sopimusrajat + operoinnin tilannepäätös","Shared rule: contract limits + operational decision"]]);
    setText(legend("constraint_clarity"),tr("Riittävätkö nämä tiedot palvelutason ja liikkumistakuun määrittämiseen?","Is this information sufficient to define the service level and mobility guarantee?"));
  }

  function contractPage(){
    if(!manager()||!is.agreement())return;
    setHeading("Mitä V2G-sopimuksen pitäisi taata?","What should the V2G agreement guarantee?");
    setLead("Kalusto-organisaatio hyväksyy palvelun periaatteet ennen käyttöönottoa. Tarkastele tässä sopimusmallia — yksittäisiä pysähdyksiä ei neuvotella uudelleen.","The fleet organisation approves the service principles before deployment. Review the contract model here — individual stops are not renegotiated.");
    [".v07-agreement-card",".v06-v2g-condition"].forEach(sel=>document.querySelector(sel)?.setAttribute("hidden",""));
    [...document.querySelectorAll("#screen > .guarantee")].forEach(el=>el.setAttribute("hidden",""));
    let card=document.querySelector(".v09-contract-card");
    if(!card){
      card=document.createElement("section");card.className="v09-contract-card";
      card.innerHTML=`<div class="v09-card-head"><strong>${tr("Kaluston V2G-palvelusopimus","Fleet V2G service agreement")}</strong><span>${tr("Kuvitteellinen työpajamalli","Illustrative workshop model")}</span></div><div class="v09-contract-grid"><div><span>${tr("Suojattu lähtövaraus","Protected departure reserve")}</span><strong>65%</strong></div><div><span>${tr("Vaikutus toimitukseen","Delivery impact")}</span><strong>0 min</strong></div><div><span>${tr("Aikaisempi käyttöönotto","Early recall")}</span><strong>${tr("sallittu","allowed")}</strong></div><div><span>${tr("Akun suojaus","Battery protection")}</span><strong>${tr("sovituissa rajoissa","agreed limits")}</strong></div></div><div class="v09-contract-rule"><strong>${tr("Hallinta ja vastuu","Control and accountability")}</strong><span>${tr("Aktivointi, ohitus, häiriöt ja vastuut kirjataan niin, että palvelutaso voidaan todentaa.","Activations, overrides, faults and accountability are recorded so the service level can be verified.")}</span></div><div class="v09-comp"><div><span>${tr("Esimerkkihyvitys","Illustrative compensation")}</span><strong>0,25 €/kWh</strong></div><small>${tr("Vain käyttöliittymätestin sopimusärsyke — ei markkinahinta eikä Tampereen lopullinen korvausmalli.","A contract stimulus for UI testing only — not a market price or final Tampere compensation model.")}</small></div>`;
      field("v2g_authorisation")?.insertAdjacentElement("beforebegin",card);
    }
    setText(legend("v2g_authorisation"),tr("Millä mallilla yksittäiset V2G-aktivoinnit pitäisi toteuttaa sopimuksen sisällä?","How should individual V2G activations be governed within the agreement?"));
    relabelByIndex("v2g_authorisation",[["Kuljettaja vahvistaa jokaisen aktivoinnin","Driver confirms every activation"],["Kalusto-organisaatio hyväksyy ennalta rajat, joiden sisällä V2G on sallittu","Fleet organisation pre-approves the limits within which V2G is allowed"],["Ajojärjestely vahvistaa yksittäisen aktivoinnin","Operations confirms each activation"],["Automaattinen sovituissa rajoissa, kuljettajalla/operoinnilla ohitus","Automatic within agreed limits, with driver/operations override"]]);
    setText(legend("preuse_v2g_acceptance"),tr("Kuinka hyväksyttävä tämä sopimus- ja hallintamalli olisi organisaatiosi näkökulmasta?","How acceptable would this contract and control model be from your organisation's perspective?"));
  }

  function evidencePage(){
    if(!manager()||!is.cycle())return;
    setHeading("Arvioi yhden palvelujakson suorituskyky","Review one service session's performance");
    setLead("Seuraa yhtä nopeutettua lataus–V2G–latausjaksoa. Organisaation näkökulmasta kysymys on siitä, näkyykö raportista riittävästi palvelutason todentamiseen — yksi onnistunut jakso ei vielä osoita pitkäaikaista luotettavuutta.","Follow one accelerated charge–V2G–recharge session. From the organisation's perspective, the question is whether the record contains enough evidence to verify service performance — one successful session does not establish long-term reliability.");
    if(!document.querySelector(".v09-evidence-note")){
      const note=document.createElement("div");note.className="v09-evidence-note";note.innerHTML=`<strong>${tr("SLA-tarkistuksessa pitäisi näkyä","An SLA check should show")}</strong><span>${tr("lähtövaraus ja lähtöaika · energia ajoneuvoon/verkkoon · V2G-aktivointi ja ohitukset · häiriö- ja palautumistiedot","departure reserve and readiness · energy to/from vehicle · V2G activation and overrides · fault and recovery records")}</span>`;document.querySelector(".v07-cycle-card")?.insertAdjacentElement("afterend",note);
    }
    setText(legend("energy_flow_clarity"),tr("Olisiko tällainen raportointi riittävän selkeä yksittäisen session palvelutason tarkistamiseen?","Would this reporting be clear enough to verify the service level of an individual session?"));
  }

  function winterRisk(){
    if(!manager()||!is.fault())return;
    setHeading("Talvihäiriö — mitä palvelusopimuksen pitäisi edellyttää?","Winter fault — what should the service agreement require?");
    const fault=document.querySelector(".fault-card");
    setText(fault?.querySelector("strong"),tr("Langaton lataus keskeytyi turvallisesti","Wireless charging stopped safely"));
    setText(fault?.querySelector("p"),tr("Lumi ja loska estävät latausalueen turvallisen tunnistuksen. Ajoneuvon varaus on 67 %, suojattu lähtövaraus 65 % ja seuraavaan toimitukseen on 25 minuuttia. Tässä skenaariossa 65 % riittää seuraavaan suunniteltuun toimitukseen.","Snow and slush prevent safe verification of the charging area. Battery is 67%, the protected reserve is 65%, and 25 minutes remain until the next delivery. In this scenario, 65% is sufficient for the assigned delivery."));
    setText(legend("fault_decision"),tr("Minkä toimintaperiaatteen pitäisi olla palvelusopimuksessa ensisijainen tällaisessa häiriössä?","Which operating rule should take priority in the service agreement for this type of fault?"));
    relabelByIndex("fault_decision",[["Salli yksi ohjattu uudelleenyritys aikarajan sisällä, sitten vararatkaisu","Allow one guided retry within the time budget, then use fallback"],["Keskeytä langaton palvelu tältä pysähdykseltä ja turvaa seuraava toimitus","End wireless service for this stop and protect the next delivery"],["Avaa tekninen incidentti palveluntarjoajalle ja kirjaa häiriö SLA-seurantaan","Open a provider technical incident and log the fault for SLA monitoring"],["Siirrä lataus varikolle ja merkitse langaton sessio epäonnistuneeksi","Move charging to the depot and record the wireless session as unsuccessful"]]);
    setText(legend("fault_owner"),tr("Kenen pitäisi kantaa päävastuu toistuvan teknisen häiriön ratkaisemisesta palvelutasolla?","Who should carry primary accountability for resolving repeated technical faults at service level?"));
    relabelByIndex("fault_owner",[["Latauspalvelun / toimittajan tekninen vastuutaho","Charging-service / supplier technical owner"],["Kalusto-organisaatio","Fleet organisation"],["Jaettu vastuu ennalta sovitun rajapinnan mukaan","Shared responsibility under an agreed interface"],["Palvelusopimuksessa nimetty SLA-vastuutaho","SLA owner named in the service agreement"]]);
  }

  function comprehension(){
    if(!manager()||!is.comp())return;
    setLead("Tämä ei ole koe. Tarkistamme, välittikö sopimus- ja palvelunäkymä keskeiset liikkumis- ja V2G-takuut selkeästi.","This is not a test. We are checking whether the contract and service view communicated the key mobility and V2G guarantees clearly.");
    setText(legend("c1"),tr("Voidaanko ajoneuvo ottaa takaisin käyttöön ennen suunniteltua lähtöaikaa?","Can the vehicle be recalled before its planned departure time?"));
    setText(legend("c2"),tr("Voiko V2G jatkua, jos akun varaus uhkaa laskea alle suojatun 65 % lähtövarauksen?","Can V2G continue if the battery is about to fall below the protected 65% departure reserve?"));
    setText(legend("c3"),tr("Milloin yksittäinen V2G-aktivointi on tämän sopimusmallin mukaan sallittu?","When is an individual V2G activation allowed under this contract model?"));
    relabelByIndex("c3",[["Aina kun ajoneuvo on pysäköitynä","Whenever the vehicle is parked"],["Vain kun suojattu lähtövaraus ja seuraavan toimituksen aikaraja voidaan säilyttää","Only when the protected reserve and next-delivery deadline can remain protected"],["Vasta kun akku on ladattu täyteen","Only after the battery is fully charged"],["En ole varma","Not sure"]]);
  }

  function sus(){
    if(!manager()||!is.sus())return;
    const lead=screen?.querySelector("h1")?.nextElementSibling;
    if(lead?.classList.contains("lead"))setText(lead,tr("Arvioi juuri käyttämääsi kalusto-organisaation palvelu- ja sopimusprototyyppiä. SUS-väittämät pysyvät standardimuodossa.","Rate the fleet-organisation service and contract prototype you just used. The SUS statements remain in their standard form."));
  }

  function trust(){
    if(!manager()||!is.trust())return;
    const labels={trust_reliability:["Voisin harkita palvelua hankintaan, jos se osoittaa sovitun luotettavuuden myös talviolosuhteissa.","I could consider procuring the service if it demonstrates the agreed reliability under winter conditions."],trust_predictability:["Sopimus ja raportointi tekisivät latauksen ja V2G:n vaikutukset ajoneuvojen käytettävyyteen riittävän ennakoitaviksi.","The agreement and reporting would make charging and V2G impacts on vehicle availability sufficiently predictable."],control_confidence:["Organisaatiolla olisi riittävä hallinta lähtövaraukseen, aktivointirajoihin ja V2G:n ohitukseen.","The organisation would have sufficient control over departure reserve, activation limits and V2G override."],failure_recovery_confidence:["Vastuut, vararatkaisu ja eskalointi olisivat riittävän selkeät teknisen häiriön aikana.","Accountability, fallback and escalation would be sufficiently clear during a technical fault."],wireless_use_intention:["Voisin harkita langattoman latauksen käyttöönottoa jakelukalustossa, jos palvelutaso osoitetaan käytännössä.","I could consider deploying wireless charging for the delivery fleet if the service level is demonstrated in practice."],v2g_acceptance_under_guarantees:["Voisin hyväksyä V2G:n kalustosopimukseen, jos liikkumistakuu, akun suojaus, korvaus ja vastuut määritellään selkeästi.","I could accept V2G in a fleet agreement if mobility protection, battery safeguards, compensation and accountability are clearly defined."]};
    Object.entries(labels).forEach(([name,[fi,en]])=>setText(legend(name),tr(fi,en)));
  }

  function apply(){
    if(is.welcome()){sessionStorage.removeItem(ROLE_KEY);document.body.classList.remove("v09-manager");return;}
    if(is.role()){document.body.classList.remove("v09-manager");rolePage();return;}
    document.body.classList.toggle("v09-manager",manager());
    if(!manager())return;
    serviceRequirements();serviceLevel();contractPage();evidencePage();winterRisk();comprehension();sus();trust();
  }

  function scheduleApply(){
    if(applyQueued)return;
    applyQueued=true;
    requestAnimationFrame(()=>{applyQueued=false;apply();});
  }

  if(screen){
    const observer=new MutationObserver(scheduleApply);
    observer.observe(screen,{childList:true});
    document.addEventListener("change",e=>{if(e.target instanceof HTMLInputElement&&e.target.name==="participant_group")scheduleApply();},true);
    scheduleApply();
  }
}
