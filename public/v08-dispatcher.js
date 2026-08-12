const v08Params = new URLSearchParams(location.search);
if ((v08Params.get("variant") || "fi-fleet") === "fi-fleet") {
  const screen = document.querySelector("#screen");
  const workshop = (v08Params.get("workshop") || "DEMO").replace(/[^A-Za-z0-9_-]/g, "").slice(0,32) || "DEMO";
  const ROLE_KEY = `pulse-v08-role-${workshop}`;
  const fi = () => document.documentElement.lang === "fi";
  const tr = (a,b) => fi() ? a : b;
  let alignSyncPending = false;

  function heading() { return document.querySelector("#screen h1")?.textContent?.trim() || ""; }
  function isWelcome() { return /Langaton lataus \+ V2G|Wireless charging \+ V2G/i.test(heading()); }
  function isRole() { return /Mistä näkökulmasta|Which perspective/i.test(heading()); }
  function isAlignment() { return /Aja langattomalle|Aja latausalueelle|Approach the wireless|Vehicle arrived at|Ajoneuvo saapui/i.test(heading()); }
  function isLimits() { return /Seuraava toimitus määrittää|The next delivery sets|Operatiiviset rajat|Operational limits/i.test(heading()); }
  function isAgreement() { return /Millä ehdoilla ajoneuvo|Under what conditions can the vehicle|V2G-aktivoinnin hallinta|V2G activation control/i.test(heading()); }
  function isCycle() { return /Seuraa latausta, V2G-aktivointia|Follow charging, V2G activation|Ajoneuvon käytettävyys energiajakson aikana|vehicle availability during the energy session/i.test(heading()); }
  function isFault() { return /Talviolosuhde keskeyttää|Winter conditions interrupt|Lataus keskeytyi — tee operatiivinen päätös|Charging stopped — make an operational decision/i.test(heading()); }
  function isComprehension() { return /Ymmärtämisen tarkistus|Comprehension check/i.test(heading()); }
  function isSus() { return /Käytettävyys \(SUS\)|Usability \(SUS\)/i.test(heading()); }
  function isTrust() { return /Luottamus ja hyväksyttävyys|Trust and acceptability/i.test(heading()); }

  function checkedRole() { return document.querySelector('input[name="participant_group"]:checked')?.value || ""; }
  function role() { return checkedRole() || sessionStorage.getItem(ROLE_KEY) || ""; }
  function dispatcher() { return role() === "dispatcher"; }

  function setText(el, text) { if (el && el.textContent !== text) el.textContent = text; }
  function setHeading(fiText,enText) { setText(document.querySelector("#screen h1"), tr(fiText,enText)); }
  function setLead(fiText,enText) { const h=document.querySelector("#screen h1"); const lead=h?.nextElementSibling; if (lead?.classList.contains("lead")) setText(lead,tr(fiText,enText)); }
  function legendFor(name) { return document.querySelector(`input[name='${name}']`)?.closest("fieldset")?.querySelector("legend"); }

  function roleScreen() {
    if (!isRole()) return;
    const current = checkedRole();
    if (current) sessionStorage.setItem(ROLE_KEY,current);
    document.querySelectorAll('input[name="participant_group"]').forEach(input => {
      if (input.dataset.v08RoleBound) return;
      input.dataset.v08RoleBound = "1";
      input.addEventListener("change", () => {
        sessionStorage.setItem(ROLE_KEY,input.value);
        document.body.classList.toggle("v08-dispatcher",input.value === "dispatcher");
        rolePreview();
      });
    });
    rolePreview();
  }

  function rolePreview() {
    if (!isRole()) return;
    document.querySelector(".v08-role-preview")?.remove();
    if (checkedRole() !== "dispatcher") return;
    const box=document.createElement("div");
    box.className="v08-role-preview";
    box.innerHTML=`<strong>${tr("Operoinnin reitti","Operations route")}</strong><span>${tr("Ajoneuvon käytettävyys, lähtövaraus, V2G-aktivointi, poikkeustilanne ja eskalointi. Et tee kuljettajan kohdistustehtävää.","Vehicle availability, departure reserve, V2G activation, exception handling and escalation. You will not perform the driver's alignment task.")}</span>`;
    document.querySelector(".actions")?.insertAdjacentElement("beforebegin",box);
  }

  function ensureDispatcherAligned() {
    if (!dispatcher() || !isAlignment()) return;
    if (document.querySelector('input[name="alignment_clarity"]')) return;
    if (alignSyncPending) return;
    const guided=document.querySelector('.alignment-controls [data-align="guided"]');
    if (!guided) return;
    alignSyncPending=true;
    setTimeout(() => { alignSyncPending=false; guided.click(); },70);
  }

  function dispatcherStatus() {
    if (!dispatcher() || !isAlignment()) return;
    ensureDispatcherAligned();
    setHeading("Ajoneuvo saapui langattomalle latauspaikalle","Vehicle arrived at the wireless charging bay");
    setLead("Kuljettaja on pysäköinyt ajoneuvon ja järjestelmä ilmoittaa kohdistuksen hyväksytyksi. Operoinnin tehtävä on arvioida, voidaanko ajoneuvo merkitä käytettäväksi lataukseen ja mahdolliseen V2G-joustoon.","The driver has parked the vehicle and the system reports accepted alignment. Operations now decides whether the vehicle can be treated as available for charging and possible V2G flexibility.");

    let card=document.querySelector(".v08-dispatcher-status");
    if (!card) {
      card=document.createElement("section");
      card.className="v08-dispatcher-status";
      const lead=document.querySelector("#screen h1")?.nextElementSibling;
      lead?.insertAdjacentElement("afterend",card);
    }
    card.innerHTML=`<div class="v08-status-head"><strong>${tr("Operoinnin tilannekuva","Operations status")}</strong><span>✓ ${tr("kohdistus hyväksytty","alignment accepted")}</span></div><div class="v08-status-grid"><div><span>${tr("Akun varaus","Battery")}</span><strong>55%</strong></div><div><span>${tr("Lähtövaraus","Protected reserve")}</span><strong>65%</strong></div><div><span>${tr("Ajoneuvo käytettävissä","Vehicle available")}</span><strong>15:30–16:45</strong></div><div><span>${tr("Seuraava lähtö","Next departure")}</span><strong>17:00</strong></div></div><div class="v08-status-note">❄ ${tr("Talviskenaario · latausalue on luminen, mutta järjestelmä raportoi ajoneuvon olevan turvallisesti latausvalmis.","Winter scenario · the charging area is snowy, but the system reports that the vehicle is safely ready to charge.")}</div>`;

    const clarity=document.querySelector('input[name="alignment_clarity"]')?.closest("fieldset");
    if (clarity) {
      clarity.hidden=false;
      setText(clarity.querySelector("legend"),tr("Ovatko nämä tiedot riittävän selkeät ajoneuvon käytettävyyden arvioimiseksi?","Is this information clear enough to assess vehicle availability?"));
    }
    [...screen.children].forEach(el => {
      if (el.matches(".progress,.step-label,h1,.lead,.actions,.v08-dispatcher-status")) return;
      if (el === clarity) return;
      el.hidden=true;
    });
  }

  function limitsScreen() {
    if (!dispatcher() || !isLimits()) return;
    setHeading("Määritä ajoneuvon operatiiviset rajat","Set the vehicle's operational limits");
    setLead("Seuraava toimitus määrittää, kuinka pitkään ajoneuvo voidaan pitää latauksessa tai V2G-joustossa. Tarkista varaus, aikaraja ja se, kuka saa muuttaa niitä päivän aikana.","The next delivery determines how long the vehicle can remain in charging or V2G flexibility. Review the reserve, timing and who may change them during operations.");
    setText(legendFor("constraint_owner"),tr("Kenen pitäisi voida muuttaa suojattua lähtövarausta päivän aikana?","Who should be able to change the protected departure reserve during operations?"));
    setText(legendFor("constraint_clarity"),tr("Pystytkö näiden tietojen perusteella arvioimaan, kuinka kauan ajoneuvo on käytettävissä energiajaksolle?","Can you use this information to judge how long the vehicle is available for the energy session?"));
  }

  function agreementScreen() {
    if (!dispatcher() || !isAgreement()) return;
    setHeading("V2G-aktivoinnin hallinta","V2G activation control");
    setLead("Kaluston V2G-sopimus on jo voimassa. Operoinnin näkökulmasta ratkaisevaa on, kuka saa käynnistää yksittäisen aktivoinnin ja pystytäänkö ajoneuvo palauttamaan ajoon nopeasti.","The fleet V2G agreement is already in place. For operations, the key questions are who may authorise an individual activation and whether the vehicle can be returned to service quickly.");
    setText(legendFor("v2g_authorisation"),tr("Kuka hyväksyy yksittäisen V2G-aktivoinnin?","Who should authorise an individual V2G activation?"));
    setText(legendFor("preuse_v2g_acceptance"),tr("Kuinka hyväksyttävä tämä hallintamalli olisi päivittäisessä ajojärjestelyssä?","How acceptable would this control model be in day-to-day dispatch operations?"));
  }

  function cycleScreen() {
    if (!dispatcher() || !isCycle()) return;
    setHeading("Seuraa ajoneuvon käytettävyyttä energiajakson aikana","Monitor vehicle availability during the energy session");
    setLead("Seuraa, milloin ajoneuvo latautuu, milloin V2G on aktiivinen ja milloin ajoneuvo voidaan varmasti palauttaa seuraavaan tehtävään. Operoinnin kannalta tärkeintä on lähtövalmiuden ennakoitavuus.","Follow when the vehicle is charging, when V2G is active and when it can safely be returned to the next job. For operations, predictable departure readiness is the main concern.");
    const badge=document.querySelector(".v07-cycle-main .scenario-badge");
    setText(badge,tr("Operoinnin näkymä · nopeutettu työpajasimulaatio","Operations view · accelerated workshop simulation"));
    setText(legendFor("energy_flow_clarity"),tr("Oliko näkymä riittävän selkeä sen arvioimiseksi, milloin ajoneuvo voidaan ottaa takaisin ajoon?","Was the view clear enough to judge when the vehicle can return to service?"));
  }

  function faultScreen() {
    if (!dispatcher() || !isFault()) return;
    setHeading("Lataus keskeytyi — tee operatiivinen päätös","Charging stopped — make an operational decision");
    const fault=document.querySelector(".fault-card");
    const p=fault?.querySelector("p");
    setText(p,tr("Kuljettaja ilmoittaa, että lumi ja loska estävät latausalueen turvallisen tunnistuksen ja langaton lataus on pysähtynyt. Ajoneuvon varaus on 67 %, suojattu lähtövaraus 65 % ja seuraavaan lähtöön on 25 minuuttia.","The driver reports that snow and slush prevent safe verification of the charging area and wireless charging has stopped. Battery is 67%, the protected reserve is 65%, and 25 minutes remain until departure."));
    setText(legendFor("fault_decision"),tr("Mitä ohjeistaisit kuljettajaa tekemään?","What would you instruct the driver to do?"));
    setText(legendFor("fault_owner"),tr("Kuka saa normaalisti tehdä tämän päätöksen ilman lisävarmistusta?","Who should normally be allowed to make this decision without further approval?"));
  }

  function comprehensionScreen() {
    if (!dispatcher() || !isComprehension()) return;
    setLead("Tämä ei ole koe. Tarkistamme, välittikö operoinnin näkymä ajoneuvon käytettävyyteen ja V2G-rajoihin liittyvät periaatteet selkeästi.","This is not a test of you. We are checking whether the operations view communicated vehicle availability and V2G limits clearly.");
    setText(legendFor("c1"),tr("Voiko ajojärjestely ottaa ajoneuvon takaisin käyttöön ennen suunniteltua lähtöaikaa?","Can operations recall the vehicle before its planned departure time?"));
    setText(legendFor("c2"),tr("Voiko V2G jatkua, jos akun varaus uhkaa laskea alle suojatun 65 % lähtövarauksen?","Can V2G continue if the battery is about to fall below the protected 65% departure reserve?"));
    const c3=legendFor("c3");
    setText(c3,tr("Milloin yksittäinen V2G-aktivointi on tämän skenaarion mukaan sallittu?","When is an individual V2G activation allowed in this scenario?"));
    const labels={
      charging:tr("Aina kun ajoneuvo on pysäköitynä, riippumatta seuraavasta tehtävästä","Whenever the vehicle is parked, regardless of its next job"),
      v2g:tr("Vain kun suojattu lähtövaraus ja seuraavan toimituksen aikaraja voidaan säilyttää","Only when the protected reserve and next-delivery deadline can remain protected"),
      ready:tr("Vasta kun akku on ladattu täyteen","Only after the battery is fully charged"),
      unsure:tr("En ole varma","Not sure")
    };
    Object.entries(labels).forEach(([value,text]) => {
      const input=document.querySelector(`input[name='c3'][value='${value}']`);
      const span=input?.closest("label")?.querySelector("span"); setText(span,text);
    });
  }

  function susScreen() {
    if (!dispatcher() || !isSus()) return;
    const h=document.querySelector("#screen h1"); const lead=h?.nextElementSibling;
    if (lead?.classList.contains("lead")) setText(lead,tr("Arvioi juuri käyttämääsi operoinnin prototyyppiä. SUS-väittämät pysyvät standardimuodossa.","Rate the operations prototype you just used. The SUS statements remain in their standard form."));
  }

  function trustScreen() {
    if (!dispatcher() || !isTrust()) return;
    const map={
      trust_reliability:["Voisin luottaa tähän näkymään ajoneuvon käytettävyyden hallinnassa ilman, että seuraavat toimitukset vaarantuvat.","I could rely on this view to manage vehicle availability without jeopardising upcoming deliveries."],
      trust_predictability:["Näkisin riittävän aikaisin, miten lataus ja V2G vaikuttavat akun varaukseen ja lähtövalmiuteen.","I would see early enough how charging and V2G affect battery state and departure readiness."],
      control_confidence:["Pystyisin palauttamaan ajoneuvon ajoon tai keskeyttämään V2G:n operatiivisen tarpeen muuttuessa.","I could return the vehicle to service or stop V2G when operational needs change."],
      failure_recovery_confidence:["Tietäisin, miten toimia ja kenelle eskaloida, jos langaton lataus keskeytyy.","I would know how to respond and where to escalate if wireless charging is interrupted."],
      wireless_use_intention:["Voisin käyttää tällaista näkymää langattomasti latautuvan kaluston päivittäisessä operoinnissa.","I could use a view like this in day-to-day operations of a wirelessly charged fleet."],
      v2g_acceptance_under_guarantees:["Hyväksyisin automaattisen V2G:n sovituissa rajoissa, jos lähtöraja, ohitus ja tilannetieto toimivat kuten tässä skenaariossa.","I would accept automatic V2G within agreed limits if departure protection, override and status information worked as shown here."]
    };
    Object.entries(map).forEach(([name,text]) => setText(legendFor(name),tr(text[0],text[1])));
  }

  function apply() {
    if (isWelcome()) {
      sessionStorage.removeItem(ROLE_KEY);
      document.body.classList.remove("v08-dispatcher");
      return;
    }
    roleScreen();
    document.body.classList.toggle("v08-dispatcher",dispatcher());
    if (!dispatcher()) return;
    dispatcherStatus();
    limitsScreen();
    agreementScreen();
    cycleScreen();
    faultScreen();
    comprehensionScreen();
    susScreen();
    trustScreen();
  }

  if (screen) {
    const observer=new MutationObserver(() => queueMicrotask(apply));
    observer.observe(screen,{childList:true});
    document.addEventListener("change", e => {
      if (e.target instanceof HTMLInputElement && e.target.name === "participant_group") queueMicrotask(apply);
    },true);
    queueMicrotask(apply);
  }
}
