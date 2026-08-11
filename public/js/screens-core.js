import { variants, roleLabel } from "./copy.js";
import { actions, esc, likert, progress, radioGroup, t } from "./ui.js";

function alignmentVisual(language, citizen=false) {
  return `<div class="bay-visual" role="img" aria-label="${language === "fi" ? "Jakeluauto kohdistettuna langattoman latausalustan päälle" : "Delivery van aligned above a wireless charging pad"}">
    <div class="weather-chip">❄ ${language === "fi" ? "Tampere · talvi" : "Tampere · winter"}</div>
    <div class="van">🚐</div>
    <div class="alignment-line"></div>
    <div class="charge-pad">⌁⌁⌁</div>
    <div class="alignment-status">✓ ${language === "fi" ? "Kohdistus havaittu" : "Alignment detected"}</div>
    ${citizen ? `<div class="public-note">${language === "fi" ? "Latausalusta on kadun pinnassa — kaapelia ei tarvitse käsitellä." : "The charging pad is in the street surface — no cable handling is required."}</div>` : ""}
  </div>`;
}

function batteryVisual(language, state, citizen=false) {
  const departure = Math.max(Number(state.minimum_soc) || 65, 75);
  return `<div class="session-visual">
    <div class="battery-ring"><span>${departure}%</span><small>${language === "fi" ? "arvio lähdössä" : "estimated at departure"}</small></div>
    <div class="energy-flow"><span>⚡ ${language === "fi" ? "verkko" : "grid"}</span><b>→</b><span>🚐 ${citizen ? (language === "fi" ? "jakeluauto" : "delivery van") : (language === "fi" ? "ajoneuvo" : "vehicle")}</span></div>
    <div class="session-stats">
      <div><strong>+18 kW</strong><span>${language === "fi" ? "langaton lataus" : "wireless charging"}</span></div>
      <div><strong>72%</strong><span>${language === "fi" ? "uusiutuva osuus" : "renewable share"}</span></div>
      <div><strong>≥95%</strong><span>${language === "fi" ? "käynnistystavoite" : "start target"}</span></div>
    </div>
  </div>`;
}

export function renderCoreScreen(step, ctx) {
  const { language, variant, state, config, workshopCode, isDemo, collectionStatus } = ctx;
  const citizen = variant === "fi-citizen";

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

  if (step === 2) return `${progress(step)}<div class="step-label">1 / 6</div><h1>${citizen ? (language === "fi" ? "Miltä langaton lataus näyttää?" : "What does wireless charging look like?") : (language === "fi" ? "Aja langattomalle latauspaikalle" : "Drive onto the wireless charging bay")}</h1>${alignmentVisual(language,citizen)}
    ${citizen ? `<div class="explain-grid"><div><strong>1</strong><span>${language === "fi" ? "Katumerkintä näyttää latausalueen" : "Street marking shows the charging area"}</span></div><div><strong>2</strong><span>${language === "fi" ? "Sovellus näyttää kohdistuksen" : "The app shows alignment"}</span></div><div><strong>3</strong><span>${language === "fi" ? "Lataus alkaa vasta kun järjestelmä on valmis" : "Charging starts only when the system is ready"}</span></div></div>` : `<fieldset><legend>${language === "fi" ? "Kuvittele, että pinta on:" : "Imagine the surface is:"}</legend>${radioGroup("winter_condition",[["clear",language === "fi" ? "Kuiva / selkeä" : "Clear / dry"],["snow",language === "fi" ? "Luminen" : "Snow-covered"],["slush",language === "fi" ? "Loskainen" : "Slushy"]],state.winter_condition || "snow")}</fieldset>`}
    <fieldset><legend>${citizen ? (language === "fi" ? "Onko sinulle selvää, missä auton pitäisi olla ja milloin lataus on käynnissä?" : "Is it clear where the vehicle should be and when charging is active?") : (language === "fi" ? "Kuinka selkeältä kohdistustehtävä vaikuttaa?" : "How clear does the alignment task feel?")}</legend>${likert(language,"alignment_clarity",state.alignment_clarity || 3)}</fieldset>${actions(language,step)}`;

  if (step === 3) {
    if (citizen) return `${progress(step)}<div class="step-label">2 / 6</div><h1>${language === "fi" ? "Mitä sovellus suojaa?" : "What does the app protect?"}</h1><p class="lead">${language === "fi" ? "Seuraat samaa kuvitteellista Tampereen jakeluautoa kuin kuljettajaversiossa. Sinun ei tarvitse tehdä kalustopäätöksiä." : "You are following the same fictional Tampere delivery van used in the driver version. You do not need to make fleet decisions."}</p><div class="scenario-card"><div class="metric"><span>${language === "fi" ? "Akun varaus nyt" : "Battery now"}</span><strong>55%</strong></div><div class="metric"><span>${language === "fi" ? "Vähintään lähdössä" : "Minimum at departure"}</span><strong>65%</strong></div><div class="metric"><span>${language === "fi" ? "Lähtö" : "Departure"}</span><strong>17:00</strong></div><div class="metric"><span>${language === "fi" ? "Pysäköintiaika" : "Planned stop"}</span><strong>90 min</strong></div></div><div class="notice"><strong>${language === "fi" ? "Periaate:" : "Principle:"}</strong> ${language === "fi" ? "V2G ei saa estää sovittua lähtöä eikä alittaa taattua varaustasoa." : "V2G must not prevent the agreed departure or reduce the vehicle below its guaranteed reserve."}</div>${actions(language,step)}`;
    return `${progress(step)}<div class="step-label">2 / 6</div><h1>${language === "fi" ? "Aseta työvuoron liikkumistarve" : "Set the operational mobility need"}</h1><p class="lead">${language === "fi" ? "Nämä tiedot muodostavat rajat, joiden sisällä lataus ja V2G saavat toimia." : "These values set the limits within which charging and V2G may operate."}</p><label class="block"><span>${language === "fi" ? "Akun varaustaso nyt (%)" : "Battery now (%)"}</span><input id="current_soc" type="number" min="5" max="100" value="${state.current_soc}"></label><label class="block"><span>${language === "fi" ? "Taattu minimivaraus lähdössä (%)" : "Guaranteed minimum at departure (%)"}</span><input id="minimum_soc" type="number" min="10" max="100" value="${state.minimum_soc}"></label><div class="two-col"><label class="block"><span>${language === "fi" ? "Lähtöaika" : "Departure time"}</span><input id="departure_time" type="time" value="${state.departure_time}"></label><label class="block"><span>${language === "fi" ? "Pysäköintiaika (min)" : "Dwell time (min)"}</span><input id="dwell_minutes" type="number" min="15" max="480" step="15" value="${state.dwell_minutes || 90}"></label></div><div class="guarantee">🛡️ <strong>${language === "fi" ? "Liikkumistakuu" : "Mobility guarantee"}</strong><span>${language === "fi" ? "Voit lähteä koska tahansa. V2G pysähtyy ennen minimivarausta." : "You can leave at any time. V2G stops before the minimum reserve."}</span></div>${actions(language,step)}`;
  }

  if (step === 4) return `${progress(step)}<div class="step-label">3 / 6</div><h1>${language === "fi" ? "Virtuaalinen lataus on käynnissä" : "Virtual charging is active"}</h1>${batteryVisual(language,state,citizen)}<div class="metric"><span>${language === "fi" ? "Arvioitu lähtövaraus" : "Estimated departure charge"}</span><strong>${Math.max(Number(state.minimum_soc) || 65,75)}%</strong></div><div class="metric"><span>${language === "fi" ? "Järjestelmän tila" : "System status"}</span><span class="pill success">✓ ${language === "fi" ? "Valmis / hallinnassa" : "Ready / controlled"}</span></div><fieldset><legend>${citizen ? (language === "fi" ? "Ymmärrätkö tämän näkymän perusteella, mitä autolle tapahtuu?" : "From this screen, do you understand what is happening to the vehicle?") : (language === "fi" ? "Ymmärrätkö, mitä tapahtuu ennen lähtöä?" : "Do you understand what will happen before departure?")}</legend>${likert(language,"plan_comprehension",state.plan_comprehension || 3)}</fieldset>${actions(language,step)}`;

  return null;
}
