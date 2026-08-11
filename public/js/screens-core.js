import { variants, roleLabel } from "./copy.js";
import { actions, esc, likert, progress, radioGroup, t } from "./ui.js";

function alignmentVisual(language, state, citizen=false) {
  const aligned = !!state.alignment_completed;
  const guided = state.alignment_stage === "guided";
  const offset = aligned ? 0 : guided ? -18 : -42;
  const score = aligned ? 96 : guided ? 82 : 62;
  const instruction = aligned
    ? (language === "fi" ? "Kohdistus hyväksytty" : "Alignment accepted")
    : guided
      ? (language === "fi" ? "Vielä 15 cm oikealle" : "15 cm further right")
      : (language === "fi" ? "35 cm oikealle" : "35 cm to the right");
  return `<div class="bay-visual interactive-bay ${aligned ? "aligned" : "misaligned"}" role="img" aria-label="${language === "fi" ? "Jakeluauto lähestyy langatonta latausalustaa talvisessa Tampereessa" : "Delivery van approaching a wireless charging pad in winter Tampere"}">
    <div class="weather-chip">❄ ${language === "fi" ? "Tampere · talviskenaario" : "Tampere · winter scenario"}</div>
    <div class="snowbank" aria-hidden="true"></div>
    <div class="van moving-van" style="transform:translateX(${offset}px)">🚐</div>
    <div class="alignment-line"></div>
    <div class="charge-pad">⌁⌁⌁</div>
    <div class="alignment-readout"><strong>${score}%</strong><span>${instruction}</span></div>
    ${citizen ? `<div class="public-note visible">${language === "fi" ? "Latausalusta on kadun pinnassa — käyttäjän ei tarvitse käsitellä kaapelia." : "The charging pad is in the street surface — the user does not need to handle a cable."}</div>` : ""}
  </div>`;
}

function fleetScenarioCard(language, state) {
  return `<div class="route-card" aria-label="${language === "fi" ? "Seuraavan toimituksen työpajaskenaario" : "Workshop scenario for the next delivery"}">
    <div class="scenario-badge">${language === "fi" ? "Työpajaskenaario · kuvitteelliset arvot" : "Workshop scenario · illustrative values"}</div>
    <div class="route-head"><span>📦</span><div><strong>${language === "fi" ? "Seuraava toimitus" : "Next delivery"}</strong><small>${language === "fi" ? "14 km · lähtö viimeistään 17:00" : "14 km · leave by 17:00"}</small></div></div>
    <div class="scenario-grid">
      <div><span>${language === "fi" ? "Akun varaus nyt" : "Battery now"}</span><strong>${state.current_soc}%</strong></div>
      <div><span>${language === "fi" ? "Taattu lähtövaraus" : "Guaranteed departure SoC"}</span><strong>${state.minimum_soc}%</strong></div>
      <div><span>${language === "fi" ? "Pysähdys" : "Planned stop"}</span><strong>${state.dwell_minutes} min</strong></div>
      <div><span>${language === "fi" ? "Lähtö" : "Departure"}</span><strong>${state.departure_time}</strong></div>
    </div>
    <div class="guarantee">🛡️ <strong>${language === "fi" ? "Liikkumistakuu" : "Mobility guarantee"}</strong><span>${language === "fi" ? "Auto voidaan ottaa ajoon aiemmin. V2G ei saa alittaa taattua lähtövarausta." : "The vehicle can be taken back into service earlier. V2G must not go below the guaranteed departure reserve."}</span></div>
  </div>`;
}

function v2gOffer(language, state, citizen=false) {
  return `<div class="v2g-card offer-card">
    <div class="scenario-badge">${language === "fi" ? "Työpajaskenaario · ei oikea tarjous" : "Workshop scenario · not a real offer"}</div>
    <div class="v2g-flow"><span class="flow-node">🚐<small>${language === "fi" ? "ajoneuvo" : "vehicle"}</small></span><span class="flow-arrow">→</span><span class="flow-node">⚡<small>${language === "fi" ? "sähköverkko" : "grid"}</small></span></div>
    <div class="metric"><span>${language === "fi" ? "V2G-ikkuna" : "V2G window"}</span><strong>15:45–16:15</strong></div>
    <div class="metric"><span>${language === "fi" ? "Enintään verkkoon" : "Maximum export"}</span><strong>6 kWh</strong></div>
    <div class="metric"><span>${language === "fi" ? "Taattu lähtövaraus" : "Guaranteed departure reserve"}</span><strong>${state.minimum_soc}%</strong></div>
    <div class="metric"><span>${language === "fi" ? "Vaikutus lähtöaikaan" : "Departure-time impact"}</span><strong>0 min</strong></div>
    <div class="metric"><span>${citizen ? (language === "fi" ? "Keskeytys" : "Override") : (language === "fi" ? "Arvioitu hyvitys kalustolle" : "Estimated fleet compensation")}</span><strong>${citizen ? (language === "fi" ? "milloin vain" : "any time") : "€3.60"}</strong></div>
  </div>`;
}

export function renderCoreScreen(step, ctx) {
  const { language, variant, state, config, workshopCode, isDemo, collectionStatus } = ctx;
  const citizen = variant === "fi-citizen";
  const fleet = variant === "fi-fleet";

  if (step === 0) return `${progress(step)}
    <div class="eyebrow">${citizen ? (language === "fi" ? "Kansalais- ja saavutettavuustestaus" : "Citizen & accessibility review") : (language === "fi" ? "Kuljettaja- ja kalustotestaus" : "Driver & fleet review")}</div>
    <h1>${esc(variants[variant].title[language])}</h1>
    <p class="lead">${esc(variants[variant].intro[language])}</p>
    <div class="feature-row"><span>⚡ ${language === "fi" ? "langaton" : "wireless"}</span><span>↔ V2G</span><span>🧪 ${language === "fi" ? "simulaatio" : "simulation"}</span></div>
    <div class="notice">${esc(t(language,"privacy"))}</div>
    <div class="status-panel"><strong>${esc(collectionStatus())}</strong><span>${esc(workshopCode)} · v${esc(state.app_version)}</span></div>
    ${!config.collection_enabled && !isDemo ? `<div class="warning">${language === "fi" ? "Tämä versio on käyttöliittymän kuivaharjoittelu: tutkimusaineiston tallennus on teknisesti estetty." : "This build is a UI dry run: research-data storage is technically disabled."}</div>` : ""}
    <fieldset><legend>${language === "fi" ? "Ennen jatkamista" : "Before continuing"}</legend>
      <label class="option"><input id="consent" type="checkbox" ${state.consent_confirmed ? "checked" : ""}><span>${t(language,"agree")}</span></label>
      <label class="option"><input id="disclaimer" type="checkbox" ${state.prototype_disclaimer_confirmed ? "checked" : ""}><span>${t(language,"notReal")}</span></label>
    </fieldset>${actions(language,step,t(language,"continue"),false)}`;

  if (step === 1) return `${progress(step)}<h1>${language === "fi" ? "Mistä näkökulmasta osallistut?" : "Which perspective are you bringing?"}</h1><p class="lead">${language === "fi" ? "Valitse vain laaja rooliryhmä. Emme pyydä työnantajaa tai henkilötietoja." : "Choose only a broad role group. We do not ask for employer or identifying details."}</p>${radioGroup("participant_group",variants[variant].groups.map(v => [v,roleLabel(v,language)]),state.participant_group)}${actions(language,step)}`;

  if (step === 2) return `${progress(step)}<div class="step-label">1 / 6</div><h1>${citizen ? (language === "fi" ? "Miltä langaton lataus näyttää?" : "What does wireless charging look like?") : (language === "fi" ? "Aja langattomalle latauspaikalle" : "Approach the wireless charging bay")}</h1>
    <p class="lead">${citizen ? (language === "fi" ? "Katso, miten auto ja kadun pintaan asennettu latausalusta tunnistavat oikean sijainnin." : "See how the vehicle and in-road charging pad indicate the correct position.") : (language === "fi" ? "Lumivalli kaventaa ruutua ja auto on aluksi sivussa alustasta. Kokeile, millaista ohjausta haluaisit työtilanteessa." : "A snowbank narrows the bay and the van starts off-centre. Try the guidance you would want during a real delivery stop.")}</p>
    ${alignmentVisual(language,state,citizen)}
    ${fleet ? `<fieldset><legend>${language === "fi" ? "Pinta tässä skenaariossa" : "Surface in this scenario"}</legend>${radioGroup("winter_condition",[["clear",language === "fi" ? "Kuiva / selkeä" : "Clear / dry"],["snow",language === "fi" ? "Luminen" : "Snow-covered"],["slush",language === "fi" ? "Loskainen" : "Slushy"]],state.winter_condition)}</fieldset>
    <div class="alignment-controls"><button class="secondary" data-align="guided">${language === "fi" ? "Näytä ajo-ohje" : "Show manoeuvre guidance"}</button><button class="primary" data-align="auto">${language === "fi" ? "Kokeile automaattista kohdistusta" : "Try automatic alignment"}</button></div>
    ${state.alignment_completed ? `<fieldset><legend>${language === "fi" ? "Kuinka selkeää kohdistus ja sen vahvistus olivat?" : "How clear were the alignment guidance and confirmation?"}</legend>${likert(language,"alignment_clarity",state.alignment_clarity)}</fieldset>` : `<div class="notice">${language === "fi" ? "Kohdista auto ensin. Seuraava vaihe avautuu, kun järjestelmä näyttää kohdistuksen hyväksytyksi." : "Align the vehicle first. Continue after the system confirms alignment."}</div>`}` : `<div class="explain-grid"><div><strong>1</strong><span>${language === "fi" ? "Katumerkintä näyttää latausalueen" : "Street marking shows the charging area"}</span></div><div><strong>2</strong><span>${language === "fi" ? "Sovellus näyttää kohdistuksen" : "The app shows alignment"}</span></div><div><strong>3</strong><span>${language === "fi" ? "Lataus alkaa vasta kun järjestelmä on valmis" : "Charging starts only when the system is ready"}</span></div></div><fieldset><legend>${language === "fi" ? "Onko selvää, missä auton pitäisi olla ja milloin lataus voi alkaa?" : "Is it clear where the vehicle should be and when charging can start?"}</legend>${likert(language,"alignment_clarity",state.alignment_clarity)}</fieldset>`}
    ${actions(language,step)}`;

  if (step === 3) {
    if (citizen) return `${progress(step)}<div class="step-label">2 / 6</div><h1>${language === "fi" ? "Mitä sovellus suojaa?" : "What does the app protect?"}</h1><p class="lead">${language === "fi" ? "Seuraat samaa kuvitteellista Tampereen jakeluautoa. Sovellus suojaa sovitun lähtöajan ja vähimmäisvarauksen." : "You are following the same fictional Tampere delivery van. The app protects its agreed departure time and minimum battery reserve."}</p>${fleetScenarioCard(language,state)}${actions(language,step)}`;
    return `${progress(step)}<div class="step-label">2 / 6</div><h1>${language === "fi" ? "Seuraava toimitus määrittää rajat" : "The next delivery sets the limits"}</h1><p class="lead">${language === "fi" ? "Näitä arvoja käytetään seuraavassa V2G-päätöksessä. Ne ovat tämän työpajan kuvitteellisia skenaarioarvoja, eivät ajoneuvon oikeaa dataa." : "These values define the next V2G decision. They are illustrative workshop values, not live vehicle data."}</p>${fleetScenarioCard(language,state)}
      <fieldset><legend>${language === "fi" ? "Kenen pitäisi normaalisti määrittää taattu lähtövaraus?" : "Who should normally set the guaranteed departure reserve?"}</legend>${radioGroup("constraint_owner",[["fleet_policy",language === "fi" ? "Kalustopolitiikka / ennalta sovittu sääntö" : "Fleet policy / predefined rule"],["dispatcher",language === "fi" ? "Ajojärjestely / operointi" : "Dispatcher / operations"],["driver",language === "fi" ? "Kuljettaja" : "Driver"],["shared",language === "fi" ? "Yhdistelmä tilanteen mukaan" : "Shared / depends on situation"]],state.constraint_owner)}</fieldset>
      <fieldset><legend>${language === "fi" ? "Ovatko nämä tiedot riittävät V2G-päätöksen ymmärtämiseen?" : "Is this information sufficient to understand the upcoming V2G decision?"}</legend>${likert(language,"constraint_clarity",state.constraint_clarity)}</fieldset>${actions(language,step)}`;
  }

  if (step === 4) return `${progress(step)}<div class="step-label">3 / 6</div><h1>${citizen ? (language === "fi" ? "Mitä V2G tarkoittaa tässä paikassa?" : "What does V2G mean at this site?") : (language === "fi" ? "V2G ennen latausjaksoa" : "V2G decision before the charging cycle")}</h1><p class="lead">${citizen ? (language === "fi" ? "Jos kalusto ja kuljettaja sallivat sen, pysäköity auto voi hetkellisesti palauttaa sähköä verkkoon. Lähtöraja ja keskeytys pysyvät suojattuina." : "If the fleet and driver allow it, the parked vehicle can briefly return electricity to the grid. Departure reserve and override remain protected.") : (language === "fi" ? "Ennen virtuaalista latausta päätetään, millä luvalla auto voi osallistua lyhyeen V2G-jaksoon." : "Before the virtual charging cycle, decide under what permission the vehicle may join a short V2G period.")}</p>${v2gOffer(language,state,citizen)}<div class="guarantee">🛡️ <strong>${language === "fi" ? "Liikkuminen etusijalla" : "Mobility first"}</strong><span>${language === "fi" ? "V2G pysähtyy ennen taattua minimivarausta ja ajoneuvo voidaan ottaa käyttöön aiemmin." : "V2G stops before the guaranteed reserve and the vehicle can be taken back into service earlier."}</span></div>
    ${fleet ? `<fieldset><legend>${language === "fi" ? "Miten V2G pitäisi normaalisti hyväksyä tässä kalustossa?" : "How should V2G normally be authorised for this fleet?"}</legend>${radioGroup("v2g_authorisation",[["driver_each",language === "fi" ? "Kuljettaja vahvistaa jokaisen kerran" : "Driver confirms each time"],["fleet_preapproved",language === "fi" ? "Kalustopolitiikka sallii V2G:n sovituissa rajoissa" : "Fleet policy pre-authorises V2G within agreed limits"],["dispatcher",language === "fi" ? "Ajojärjestely vahvistaa tilanteen" : "Dispatcher authorises the situation"],["automatic_override",language === "fi" ? "Automaattinen sovituissa rajoissa, kuljettajalla aina ohitus" : "Automatic within agreed limits, always with driver override"]],state.v2g_authorisation)}</fieldset><fieldset><legend>${language === "fi" ? "Kuinka hyväksyttävä tämä V2G-järjestely olisi omassa työroolissasi näillä takuilla?" : "How acceptable would this V2G arrangement be in your work role with these guarantees?"}</legend>${likert(language,"preuse_v2g_acceptance",state.preuse_v2g_acceptance)}</fieldset>` : `<fieldset><legend>${language === "fi" ? "Onko sinusta tärkeää, että V2G:n lupa ja keskeytys näkyvät selkeästi?" : "Is it important that V2G permission and override are clearly visible?"}</legend>${likert(language,"preuse_v2g_acceptance",state.preuse_v2g_acceptance)}</fieldset>`}
    ${actions(language,step)}`;

  return null;
}
