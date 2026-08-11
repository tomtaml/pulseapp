import { susItems } from "./copy.js";
import { actions, esc, likert, progress, radioGroup, t } from "./ui.js";

function cycleVisual(language, state, citizen=false) {
  const completed = !!state.cycle_completed;
  return `<div class="cycle-card" aria-label="${language === "fi" ? "Simuloitu langaton lataus- ja V2G-jakso" : "Simulated wireless charging and V2G cycle"}">
    <div class="scenario-badge">${language === "fi" ? "Simuloidut työpaja-arvot" : "Simulated workshop values"}</div>
    <div class="cycle-status"><span id="cyclePhase" class="pill">${completed ? (language === "fi" ? "Valmis lähtöön" : "Ready to leave") : (language === "fi" ? "Valmis aloittamaan" : "Ready to start")}</span><strong id="cycleSoc">${completed ? "70" : state.current_soc}%</strong><small>${language === "fi" ? "akun varaus" : "battery"}</small></div>
    <div id="cycleFlow" class="cycle-flow"><span class="flow-node">⚡<small>${language === "fi" ? "verkko" : "grid"}</small></span><span id="cycleArrow" class="flow-arrow">→</span><span class="flow-node">🚐<small>${language === "fi" ? "ajoneuvo" : "vehicle"}</small></span></div>
    <div class="cycle-meter"><div id="cycleMeterFill" style="width:${completed ? 100 : 0}%"></div></div>
    <div class="session-stats cycle-stats">
      <div><strong id="energyVehicle">${completed ? "16.4" : "0.0"} kWh</strong><span>${language === "fi" ? "ajoneuvoon" : "to vehicle"}</span></div>
      <div><strong id="energyGrid">${completed ? "4.8" : "0.0"} kWh</strong><span>${language === "fi" ? "verkkoon" : "to grid"}</span></div>
      <div><strong id="energyNet">${completed ? "+11.6" : "0.0"} kWh</strong><span>${language === "fi" ? "netto akkuun" : "net to battery"}</span></div>
    </div>
    <div class="cycle-timeline"><span>${language === "fi" ? "1. Lataus" : "1. Charge"}</span><span>${language === "fi" ? "2. V2G" : "2. V2G"}</span><span>${language === "fi" ? "3. Lähtövalmius" : "3. Ready"}</span></div>
    <div class="cycle-controls"><button class="primary" data-action="run-cycle" ${completed ? "disabled" : ""}>${completed ? (language === "fi" ? "Jakso suoritettu" : "Cycle completed") : (language === "fi" ? "Käynnistä simuloitu jakso" : "Run simulated cycle")}</button><button class="secondary danger-outline" data-action="override-cycle">${language === "fi" ? "Lähde nyt / keskeytä V2G" : "Leave now / stop V2G"}</button></div>
    <div id="cycleMessage" class="notice">${completed ? (language === "fi" ? "Jakso päättyi: lähtövaraus suojattiin ja auto on valmis seuraavaan toimitukseen." : "Cycle complete: departure reserve was protected and the vehicle is ready for the next delivery.") : (language === "fi" ? "Seuraa, milloin energia kulkee verkosta autoon ja milloin autosta takaisin verkkoon." : "Watch when energy flows from the grid to the vehicle and when it returns from the vehicle to the grid.")}</div>
  </div>`;
}

function fleetTrust(language, state) {
  const items = language === "fi" ? [
    ["trust_reliability","Voisin luottaa tähän palveluun ilman, että seuraava toimitus vaarantuu."],
    ["trust_predictability","Ymmärtäisin etukäteen, mitä akun varaukselle tapahtuu ennen lähtöä."],
    ["control_confidence","Minulla olisi riittävä hallinta keskeyttää lataus tai V2G ja lähteä työn niin vaatiessa."],
    ["failure_recovery_confidence","Tietäisin, mitä tehdä ja kuka vastaa, jos lataus ei käynnisty tai keskeytyy."],
    ["wireless_use_intention","Käyttäisin langatonta latausta jakelupysähdyksillä, jos palvelu olisi käytettävissä."],
    ["v2g_acceptance_under_guarantees","Hyväksyisin V2G:n sopivilla jakelupysähdyksillä, jos lähtövaraus, aikarajat ja ohitus toimivat kuten tässä skenaariossa."]
  ] : [
    ["trust_reliability","I could rely on this service without jeopardising the next delivery."],
    ["trust_predictability","I would understand in advance what happens to the battery before departure."],
    ["control_confidence","I would have sufficient control to stop charging or V2G and leave when work requires it."],
    ["failure_recovery_confidence","I would know what to do and who is responsible if charging fails or stops."],
    ["wireless_use_intention","I would use wireless charging during delivery stops if the service were available."],
    ["v2g_acceptance_under_guarantees","I would accept V2G during suitable delivery stops if the departure reserve, timing and override guarantees worked as shown here."]
  ];
  return items.map(([name,label]) => `<fieldset><legend>${label}</legend>${likert(language,name,state[name])}</fieldset>`).join("");
}

function citizenTrust(language, state) {
  const items = language === "fi" ? [
    ["trust_1","Luottaisin siihen, että sovellus kertoo langattoman latauksen ja V2G:n tilan ymmärrettävästi."],
    ["trust_2","Ymmärtäisin, kuka vastaa ongelmatilanteessa."],
    ["trust_3","Luottaisin siihen, että V2G voidaan keskeyttää selkeästi ja energiaa ei siirretä huomaamatta."],
    ["accessibility_understanding","Pystyisin ymmärtämään tämän sovelluksen keskeiset tiedot ja ohjaimet ilman apua."],
    ["wireless_acceptance","Langaton lataus olisi hyväksyttävä tässä Tampereen julkisen katutilan jakelutilanteessa."],
    ["bidirectional_participation","V2G olisi hyväksyttävää tässä julkisen tilan jakelutilanteessa, jos rajat, suostumus ja vastuut ovat selkeät."]
  ] : [
    ["trust_1","I would trust the app to communicate the status of wireless charging and V2G clearly."],
    ["trust_2","I would understand who is responsible if something goes wrong."],
    ["trust_3","I would trust that V2G can be stopped clearly and that energy is not exported without being visible."],
    ["accessibility_understanding","I could understand the key information and controls in this app without assistance."],
    ["wireless_acceptance","Wireless charging would be acceptable in this Tampere public-street delivery setting."],
    ["bidirectional_participation","I would find V2G acceptable in this public-space delivery setting if the limits, consent and responsibilities are clear."]
  ];
  return items.map(([name,label]) => `<fieldset><legend>${label}</legend>${likert(language,name,state[name] ?? state[`${name}`])}</fieldset>`).join("");
}

export function renderEvalScreen(step, ctx) {
  const { language, variant, state, config, isDemo } = ctx;
  const citizen = variant === "fi-citizen";
  const fleet = variant === "fi-fleet";

  if (step === 5) return `${progress(step)}<div class="step-label">4 / 6</div><h1>${language === "fi" ? "Seuraa yksi virtuaalinen lataus- ja V2G-jakso" : "Run one virtual charging and V2G cycle"}</h1><p class="lead">${language === "fi" ? "Jakso nopeutetaan muutamaan sekuntiin. Tarkkaile erityisesti energian suuntaa, akun varausta ja sitä, säilyykö lähtöraja." : "The cycle is compressed into a few seconds. Watch the direction of energy flow, battery level and whether the departure reserve remains protected."}</p>${cycleVisual(language,state,citizen)}${state.cycle_completed ? `<fieldset><legend>${language === "fi" ? "Kuinka selkeästi ymmärsit energian suunnan ja jakson vaiheet?" : "How clearly did you understand the energy direction and cycle phases?"}</legend>${likert(language,"energy_flow_clarity",state.energy_flow_clarity)}</fieldset>` : ""}${actions(language,step)}`;

  if (step === 6) {
    if (citizen) return `${progress(step)}<div class="step-label">5 / 6</div><h1>${language === "fi" ? "Kun talvi häiritsee latausta" : "When winter disrupts charging"}</h1><div class="fault-card"><div class="fault-icon">!</div><div><strong>${language === "fi" ? "Lataus keskeytyi" : "Charging interrupted"}</strong><p>${language === "fi" ? "Voimakas lumisade heikensi kohdistusta. Auto on turvallisesti paikallaan, mutta lataus ei jatku ennen uutta kohdistusta." : "Heavy snowfall reduced alignment. The vehicle is safely parked, but charging will not continue until it is realigned."}</p></div></div><fieldset><legend>${language === "fi" ? "Minkä tiedon pitäisi näkyä ensin?" : "What information should be shown first?"}</legend>${radioGroup("fault_decision",[["retry",language === "fi" ? "Miten kohdistus korjataan" : "How to correct alignment"],["override",language === "fi" ? "Miten lataus keskeytetään ja auto lähtee" : "How to stop charging and leave"],["support",language === "fi" ? "Kuka vastaa ja mistä saa apua" : "Who is responsible and where to get help"],["alternative",language === "fi" ? "Missä voi ladata vaihtoehtoisesti" : "Where alternative charging is available"]],state.fault_decision)}</fieldset>${actions(language,step)}`;
    return `${progress(step)}<div class="step-label">5 / 6</div><h1>${language === "fi" ? "Lumimyrsky keskeyttää latauksen" : "Snowstorm interrupts charging"}</h1><div class="fault-card"><div class="fault-icon">!</div><div><strong>${language === "fi" ? "Kohdistus menetetty" : "Alignment lost"}</strong><p>${language === "fi" ? "Voimakas lumisade ja loska peittävät osan latausalueesta. Seuraava toimitus lähtee 25 minuutin kuluttua." : "Heavy snow and slush cover part of the charging area. The next delivery leaves in 25 minutes."}</p></div></div><div class="scenario-badge">${language === "fi" ? "Työpajaskenaario · arvioidut vaikutukset" : "Workshop scenario · estimated impacts"}</div><fieldset><legend>${language === "fi" ? "Mitä tekisit tässä tilanteessa?" : "What would you do in this situation?"}</legend>${radioGroup("fault_decision",[["retry",language === "fi" ? "Uudelleenkohdista ja yritä uudelleen — arvio +3 min" : "Realign and retry — estimated +3 min"],["override",language === "fi" ? "Keskeytä lataus ja jatka reittiä nyt" : "Stop charging and continue the route now"],["support",language === "fi" ? "Ota yhteys ajojärjestelyyn / tukeen" : "Contact dispatch / support"],["alternative",language === "fi" ? "Jatka reittiä ja lataa myöhemmin varikolla" : "Continue the route and charge later at the depot"]],state.fault_decision)}</fieldset><fieldset><legend>${language === "fi" ? "Kenen pitäisi normaalisti tehdä tällainen päätös?" : "Who should normally make this kind of decision?"}</legend>${radioGroup("fault_owner",[["driver",language === "fi" ? "Kuljettaja" : "Driver"],["dispatcher",language === "fi" ? "Ajojärjestely" : "Dispatcher"],["automatic",language === "fi" ? "Järjestelmä automaattisesti sovituissa rajoissa" : "System automatically within agreed limits"],["fleet_policy",language === "fi" ? "Ennalta määritetty kalustopolitiikka" : "Predefined fleet policy"]],state.fault_owner)}</fieldset>${actions(language,step)}`;
  }

  if (step === 7) return `${progress(step)}<div class="step-label">6 / 6</div><h1>${language === "fi" ? "Ymmärtämisen tarkistus" : "Comprehension check"}</h1><p class="lead">${language === "fi" ? "Tämä ei ole koe. Tarkistamme, selittikö prototyyppi juuri nähdyn skenaarion riittävän selkeästi." : "This is not a test of you. It checks whether the prototype explained the scenario you just saw clearly enough."}</p>
    <fieldset><legend>${language === "fi" ? "Voiko ajoneuvon ottaa käyttöön ennen suunniteltua lähtöaikaa?" : "Can the vehicle be taken back into service before the planned departure time?"}</legend>${radioGroup("c1",[["yes",language === "fi" ? "Kyllä" : "Yes"],["no",language === "fi" ? "Ei" : "No"],["unsure",language === "fi" ? "En ole varma" : "Not sure"]],state.c1)}</fieldset>
    <fieldset><legend>${language === "fi" ? "Voiko V2G laskea akun alle taatun minimivaraustason?" : "Can V2G reduce the battery below the guaranteed minimum reserve?"}</legend>${radioGroup("c2",[["yes",language === "fi" ? "Kyllä" : "Yes"],["no",language === "fi" ? "Ei" : "No"],["unsure",language === "fi" ? "En ole varma" : "Not sure"]],state.c2)}</fieldset>
    <fieldset><legend>${language === "fi" ? "Missä virtuaalisen jakson vaiheessa sähköä siirtyi autosta sähköverkkoon?" : "During which phase of the virtual cycle did energy move from the vehicle to the grid?"}</legend>${radioGroup("c3",[["charging",language === "fi" ? "Ensimmäisessä latausvaiheessa" : "During the initial charging phase"],["v2g",language === "fi" ? "V2G-vaiheessa" : "During the V2G phase"],["ready",language === "fi" ? "Kun auto oli jo lähtövalmis" : "After the vehicle was ready to leave"],["unsure",language === "fi" ? "En ole varma" : "Not sure"]],state.c3)}</fieldset>${actions(language,step)}`;

  if (step === 8) return `${progress(step)}<h1>${language === "fi" ? "Käytettävyys (SUS)" : "Usability (SUS)"}</h1><p class="lead">${language === "fi" ? "Arvioi koko juuri käyttämääsi prototyyppiä. Vastaa jokaiseen väittämään asteikolla 1–5 (1 = täysin eri mieltä, 5 = täysin samaa mieltä)." : "Rate the full prototype you just used. Answer every statement on the 1–5 scale (1 = strongly disagree, 5 = strongly agree)."}</p><div class="sus-form">${susItems[language].map((item,i) => `<fieldset><legend>${i + 1}. ${esc(item)}</legend>${likert(language,`sus_${i + 1}`,state.sus_values[i])}</fieldset>`).join("")}</div>${actions(language,step)}`;

  if (step === 9) {
    const endLabel = (isDemo || !config.collection_enabled) ? (language === "fi" ? "Viimeistele demo" : "Finish demo") : t(language,"submit");
    return `${progress(step)}<h1>${language === "fi" ? "Luottamus ja hyväksyttävyys" : "Trust and acceptability"}</h1><p class="lead">${fleet ? (language === "fi" ? "Arvioi nyt palvelua nimenomaan jakelutyön ja kaluston näkökulmasta." : "Now rate the service specifically from the delivery-work and fleet perspective.") : (language === "fi" ? "Arvioi ymmärrettävyyttä, luottamusta ja hyväksyttävyyttä." : "Rate understanding, trust and acceptability.")}</p>${fleet ? fleetTrust(language,state) : citizenTrust(language,state)}${config.free_text_enabled ? `<label class="block"><span>${language === "fi" ? "Valinnainen huomio (älä kirjoita henkilötietoja)" : "Optional note (do not include personal information)"}</span><textarea id="optional_note" maxlength="500" rows="3">${esc(state.optional_note)}</textarea></label>` : `<div class="notice">${language === "fi" ? "Vapaateksti ei ole tässä mobiiliversiossa käytössä. Työpajan laadulliset havainnot kirjataan erilliseen SRF Issue Response Logiin." : "Free text is disabled in this mobile build. Qualitative workshop observations are captured separately in the SRF Issue Response Log."}</div>`}<div id="turnstile" class="turnstile-wrap" aria-live="polite"></div>${actions(language,step,endLabel)}`;
  }

  return null;
}
