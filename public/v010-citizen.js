const q010 = new URLSearchParams(location.search);
if ((q010.get("variant") || "fi-fleet") === "fi-citizen") {
  const screen = document.querySelector("#screen");
  const workshop = (q010.get("workshop") || "DEMO").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || "DEMO";
  const ROLE_KEY = `pulse-v010-citizen-role-${workshop}`;
  const SPACE_CLARITY_KEY = `pulse-v010-public-space-clarity-${workshop}`;
  const tr = (fi, en) => document.documentElement.lang === "fi" ? fi : en;
  let applyQueued = false;

  const heading = () => screen?.querySelector("h1")?.textContent?.trim() || "";
  const substep = () => screen?.querySelector(".step-label")?.textContent?.trim() || "";
  const isRole = () => /Mistä näkökulmasta|Which perspective/i.test(heading());
  const isSus = () => /Käytettävyys \(SUS\)|Usability \(SUS\)/i.test(heading());
  const isTrust = () => /Luottamus ja hyväksyttävyys|Trust and acceptability|Luottamus, saavutettavuus/i.test(heading());
  const isWelcome = () => !substep() && !isRole() && !isSus() && !isTrust() && !!screen?.querySelector("#consent");
  const checkedRole = () => document.querySelector('input[name="participant_group"]:checked')?.value || "";
  const role = () => checkedRole() || sessionStorage.getItem(ROLE_KEY) || "citizen";
  const field = name => document.querySelector(`input[name="${name}"]`)?.closest("fieldset");
  const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
  const setHeading = (fi, en) => setText(screen?.querySelector("h1"), tr(fi, en));
  const setLead = (fi, en) => {
    const h = screen?.querySelector("h1");
    const lead = h?.nextElementSibling;
    if (lead?.classList.contains("lead")) setText(lead, tr(fi, en));
  };
  const relabel = (name, labels) => {
    const spans = field(name)?.querySelectorAll("label span") || [];
    labels.forEach((pair, i) => setText(spans[i], tr(pair[0], pair[1])));
  };

  function likertMarkup(name, selected = "") {
    return `<div class="likert-anchors"><span>${tr("Täysin eri mieltä", "Strongly disagree")}</span><span>${tr("Täysin samaa mieltä", "Strongly agree")}</span></div><div class="likert" role="radiogroup" aria-label="${name}">${[1,2,3,4,5].map(v => `<label class="likert-option"><input type="radio" name="${name}" value="${v}" ${String(selected) === String(v) ? "checked" : ""}><span>${v}</span></label>`).join("")}</div>`;
  }

  function welcome() {
    if (!isWelcome()) return;
    sessionStorage.removeItem(ROLE_KEY);
    setHeading("Langaton lataus ja V2G julkisessa tilassa", "Wireless charging and V2G in public space");
    setLead(
      "Käy läpi lyhyt Tampereen katutilan skenaario. Tarkastele latauspaikkaa, energian suuntaa, talvihäiriötä ja sitä, ovatko tiedot ymmärrettäviä ja saavutettavia. Et tarvitse sähköauto- tai kalusto-osaamista.",
      "Walk through a short Tampere public-street scenario. Review the charging bay, energy direction, a winter disruption and whether the information is understandable and accessible. No EV or fleet expertise is needed."
    );
  }

  function rolePage() {
    if (!isRole()) return;
    const current = checkedRole();
    if (current) sessionStorage.setItem(ROLE_KEY, current);
    document.querySelectorAll('input[name="participant_group"]').forEach(input => {
      if (input.dataset.v010Bound) return;
      input.dataset.v010Bound = "1";
      input.addEventListener("change", () => {
        sessionStorage.setItem(ROLE_KEY, input.value);
        queueApply();
      });
    });

    let preview = document.querySelector(".v010-role-preview");
    if (!preview) {
      preview = document.createElement("div");
      preview.className = "v010-role-preview";
      document.querySelector(".actions")?.insertAdjacentElement("beforebegin", preview);
    }
    const r = checkedRole();
    if (!r) { preview.hidden = true; return; }
    preview.hidden = false;
    const copy = {
      citizen: ["Julkisen tilan kansalaisreitti", "Public-space citizen route", "Latauspaikan ymmärrettävyys, energian suunta, turvallisuus, vastuut ja hyväksyttävyys.", "Charging-bay clarity, energy direction, safety, responsibility and acceptability."],
      accessibility_representative: ["Saavutettavuusreitti", "Accessibility review route", "Kokeile näkymää mahdollisimman itsenäisesti. Arvioi erityisesti selkeyttä, kulkureittiä, tekstin luettavuutta ja sitä, tarvitaanko apua.", "Try the interface as independently as possible. Focus on clarity, the accessible route, readable information and whether assistance is needed."],
      road_user: ["Tienkäyttäjän julkisen tilan reitti", "Road-user public-space route", "Arvioi latausalueen näkyvyyttä, kulkureittiä, turvallisuutta ja sitä, onko toiminta ymmärrettävää sivulliselle.", "Review visibility, the travel path, safety and whether the system is understandable to someone nearby."],
      other: ["Julkisen tilan arviointireitti", "Public-space review route", "Arvioi latauspaikan ymmärrettävyyttä, turvallisuutta, saavutettavuutta ja vastuita.", "Review the charging site's clarity, safety, accessibility and responsibility information."]
    }[r] || null;
    if (!copy) { preview.hidden = true; return; }
    const html = `<strong>${tr(copy[0], copy[1])}</strong><span>${tr(copy[2], copy[3])}</span>`;
    if (preview.innerHTML !== html) preview.innerHTML = html;
  }

  function publicBay() {
    if (substep() !== "1 / 6") return;
    setHeading("Miten langaton lataus näkyy katutilassa?", "What does wireless charging look like in public space?");
    setLead(
      "Tarkastele paikkaa lähialueen käyttäjän näkökulmasta. Sinun ei tarvitse ohjata ajoneuvoa — arvioi, onko latausalue ja vapaa kulkureitti helppo ymmärtää.",
      "Look at the site from the perspective of someone nearby. You do not need to control the vehicle — judge whether the charging area and the clear travel path are easy to understand."
    );
    document.querySelector(".bay-visual")?.setAttribute("hidden", "");
    document.querySelector(".explain-grid")?.setAttribute("hidden", "");

    let card = document.querySelector(".v010-public-space-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "v010-public-space-card";
      card.innerHTML = `<div class="v010-card-head"><strong>❄ ${tr("Tampere · talviskenaario", "Tampere · winter scenario")}</strong><span>${tr("Julkisen tilan näkymä", "Public-space view")}</span></div>
        <div class="v010-street-scene" role="img" aria-label="${tr("Ylhäältä kuvattu jakeluauto langattoman latausalustan päällä. Jalkakäytävä ja esteetön kulkureitti jatkuvat latausalueen vieressä ilman latauskaapelia.", "Top view of a delivery van over an embedded wireless charging pad. The footway and accessible route continue beside the bay without a charging cable.")}">
          <div class="v010-sidewalk"><span>♿ 🚶</span><strong>${tr("Jalkakäytävä / kulkureitti", "Footway / travel path")}</strong></div>
          <div class="v010-road"><div class="v010-pad"><span>${tr("langaton latausalusta", "wireless charging pad")}</span></div><div class="v010-van">🚐</div><div class="v010-snow">❄</div></div>
        </div>
        <div class="v010-public-points">
          <div><strong>✓ ${tr("Alusta on kadun pinnassa", "Pad is embedded in the street")}</strong><span>${tr("Kulkureitille ei vedetä latauskaapelia.", "No charging cable crosses the travel path.")}</span></div>
          <div><strong>✓ ${tr("Lataus alkaa vasta vahvistuksen jälkeen", "Charging starts only after verification")}</strong><span>${tr("Järjestelmä tarkistaa ajoneuvon sijainnin ennen energiansiirtoa.", "The system checks vehicle position before energy transfer.")}</span></div>
          <div><strong>✓ ${tr("Kulkureitti pidetään vapaana", "Travel path remains clear")}</strong><span>${tr("Lumi, merkinnät tai laitteet eivät saa tehdä kulusta epäselvää.", "Snow, markings or equipment should not make the route unclear.")}</span></div>
        </div>`;
      const clarity = field("alignment_clarity");
      clarity?.insertAdjacentElement("beforebegin", card);
    }
    const clarity = field("alignment_clarity");
    if (clarity) setText(clarity.querySelector("legend"), tr("Onko selvää, missä latausalue on ja mikä osa kulkureitistä jää vapaaksi?", "Is it clear where the charging area is and which part of the travel path remains clear?"));

    let note = document.querySelector(".v010-accessibility-note");
    if (role() === "accessibility_representative") {
      if (!note) {
        note = document.createElement("div");
        note.className = "v010-accessibility-note";
        note.innerHTML = `<strong>${tr("Saavutettavuushavainto", "Accessibility observation")}</strong><span>${tr("Kokeile näkymää ensin ilman fasilitaattorin selitystä. Voit käyttää A+ ja kontrastipainiketta, jos käyttäisit niitä normaalisti.", "Try the screen first without facilitator explanation. You may use A+ and the contrast control if you would normally use them.")}</span>`;
        card?.insertAdjacentElement("afterend", note);
      }
      note.hidden = false;
    } else if (note) note.hidden = true;
  }

  function publicPrinciples() {
    if (substep() !== "2 / 6") return;
    setHeading("Mitä julkisessa latauspaikassa pitäisi suojata?", "What should a public charging site protect?");
    setLead(
      "Langattoman latauksen pitää toimia niin, ettei lähellä olevan ihmisen tarvitse ymmärtää kaluston operointia. Arvioi, ovatko tärkeimmät julkisen tilan periaatteet selkeitä.",
      "Wireless charging should work without requiring people nearby to understand fleet operations. Review whether the key public-space principles are clear."
    );
    document.querySelector(".route-card")?.setAttribute("hidden", "");
    document.querySelector(".v07-availability-note")?.setAttribute("hidden", "");

    let card = document.querySelector(".v010-principles-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "v010-principles-card";
      card.innerHTML = `<div class="v010-card-head"><strong>${tr("Neljä julkisen tilan periaatetta", "Four public-space principles")}</strong><span>${tr("Työpajaskenaario", "Workshop scenario")}</span></div>
        <div class="v010-principles-grid">
          <div><strong>♿ ${tr("Esteetön kulku", "Accessible movement")}</strong><span>${tr("Kulkureitti ei saa estyä latauskaapelista tai huonosti sijoitetusta laitteesta.", "The travel path should not be blocked by a charging cable or poorly placed equipment.")}</span></div>
          <div><strong>🛡 ${tr("Turvallinen energiansiirto", "Safe energy transfer")}</strong><span>${tr("Energiansiirto alkaa vain, kun järjestelmä on varmistanut turvallisen tilanteen.", "Energy transfer starts only after the system verifies a safe condition.")}</span></div>
          <div><strong>↔ ${tr("Näkyvä energian suunta", "Visible energy direction")}</strong><span>${tr("Lataus ja V2G pitää pystyä erottamaan toisistaan.", "Charging and V2G should be distinguishable from one another.")}</span></div>
          <div><strong>ℹ ${tr("Selkeä vastuu", "Clear responsibility")}</strong><span>${tr("Häiriössä pitää näkyä, mitä tapahtui ja mistä saa apua tai lisätietoa.", "During a fault it should be clear what happened and where to get help or information.")}</span></div>
        </div>`;
      document.querySelector(".actions")?.insertAdjacentElement("beforebegin", card);
    }

    let f = field("constraint_clarity");
    if (!f) {
      f = document.createElement("fieldset");
      f.className = "v010-public-clarity";
      const selected = sessionStorage.getItem(SPACE_CLARITY_KEY) || "";
      f.innerHTML = `<legend>${tr("Ovatko nämä periaatteet riittävän selkeät julkisen latauspaikan arvioimiseksi?", "Are these principles clear enough to evaluate a public charging site?")}</legend>${likertMarkup("constraint_clarity", selected)}`;
      document.querySelector(".actions")?.insertAdjacentElement("beforebegin", f);
      f.addEventListener("change", e => {
        if (e.target instanceof HTMLInputElement && e.target.name === "constraint_clarity") {
          sessionStorage.setItem(SPACE_CLARITY_KEY, e.target.value);
          const next = document.querySelector('[data-action="next"]');
          if (next) next.disabled = false;
        }
      });
    }
    const selected = document.querySelector('input[name="constraint_clarity"]:checked');
    const next = document.querySelector('[data-action="next"]');
    if (next) next.disabled = !selected;
  }

  function v2gExplanation() {
    if (substep() !== "3 / 6") return;
    setHeading("Mitä tapahtuu, kun auto antaa sähköä takaisin verkkoon?", "What happens when the vehicle sends electricity back to the grid?");
    setLead(
      "V2G on eri vaihe kuin tavallinen lataus. Tässä kansalaisnäkymässä sinun ei tarvitse hyväksyä kalustosopimusta — arvioi vain, näkyykö energian suunta ja toiminnan tarkoitus ymmärrettävästi.",
      "V2G is a different phase from ordinary charging. In this citizen view you do not approve the fleet agreement — simply judge whether the energy direction and purpose are understandable."
    );
    document.querySelector(".v2g-card")?.setAttribute("hidden", "");
    [...document.querySelectorAll("#screen > .guarantee")].forEach(el => el.setAttribute("hidden", ""));

    let card = document.querySelector(".v010-v2g-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "v010-v2g-card";
      card.innerHTML = `<div class="v010-card-head"><strong>${tr("Lataus ja V2G ovat eri energiasuuntia", "Charging and V2G use opposite energy directions")}</strong><span>${tr("Kuvitteellinen selitysnäkymä", "Illustrative explanation")}</span></div>
        <div class="v010-energy-phases">
          <div><span class="v010-phase-icon">⚡ → 🚐</span><strong>${tr("1. Lataus", "1. Charging")}</strong><small>${tr("Sähköverkosta ajoneuvoon", "Grid to vehicle")}</small></div>
          <div class="accent"><span class="v010-phase-icon">🚐 → ⚡</span><strong>${tr("2. V2G", "2. V2G")}</strong><small>${tr("Ajoneuvosta takaisin sähköverkkoon", "Vehicle back to grid")}</small></div>
          <div><span class="v010-phase-icon">🔋 ✓</span><strong>${tr("3. Valmis", "3. Ready")}</strong><small>${tr("Ajoneuvon sovittu lähtövaraus säilyy", "The agreed departure reserve remains protected")}</small></div>
        </div>
        <div class="v010-info-strip"><strong>${tr("Kuka päättää V2G:stä?", "Who decides on V2G?")}</strong><span>${tr("Kalusto-organisaation ja operoinnin sovitut säännöt määrittävät aktivoinnin. Lähialueen käyttäjän ei tarvitse tehdä päätöstä.", "Agreed fleet and operations rules govern activation. A nearby member of the public does not need to make that decision.")}</span></div>`;
      field("preuse_v2g_acceptance")?.insertAdjacentElement("beforebegin", card);
    }
    const f = field("preuse_v2g_acceptance");
    if (f) setText(f.querySelector("legend"), tr("Onko sinusta selvää, että V2G on erillinen ja näkyvä vaihe eikä tavallista latausta?", "Is it clear that V2G is a separate, visible phase rather than ordinary charging?"));
  }

  function citizenCycle() {
    if (substep() !== "4 / 6") return;
    setHeading("Seuraa, mihin suuntaan sähkö kulkee", "Follow the direction of energy flow");
    setLead(
      "Käynnistä lyhyt havainnollistus. Tarkkaile vain kolmea asiaa: akun varausta, energian suuntaa ja sitä, milloin V2G-vaihe alkaa ja päättyy.",
      "Run the short illustration. Watch only three things: battery level, energy direction, and when the V2G phase starts and ends."
    );
    const card = document.querySelector(".cycle-card");
    if (card && !document.querySelector(".v010-cycle-purpose")) {
      const note = document.createElement("div");
      note.className = "v010-cycle-purpose";
      note.innerHTML = `<strong>${tr("Tässä näkymässä et ohjaa ajoneuvoa", "You are not controlling the vehicle here")}</strong><span>${tr("Tarkoitus on testata, pystyykö sivullinen ymmärtämään latauksen ja V2G:n eron.", "The purpose is to test whether someone nearby can understand the difference between charging and V2G.")}</span>`;
      card.insertAdjacentElement("beforebegin", note);
    }
    const run = document.querySelector('[data-action="run-cycle"]');
    if (run && !run.disabled) setText(run, tr("Käynnistä energian kulun havainnollistus", "Run energy-flow illustration"));
    const override = document.querySelector('[data-action="override-cycle"]');
    if (override) override.hidden = true;

    const completed = !!document.querySelector('[data-action="run-cycle"]:disabled') || /Valmis lähtöön|Ready to leave/i.test(document.querySelector("#cyclePhase")?.textContent || "");
    if (completed && card && !document.querySelector(".v010-cycle-result")) {
      const result = document.createElement("div");
      result.className = "v010-cycle-result";
      result.innerHTML = `<strong>✓ ${tr("Jakson kolme pääviestiä", "Three takeaways from the cycle")}</strong><div><span>⚡ → 🚐</span>${tr("Latauksessa energia kulki verkosta autoon.", "During charging, energy moved from the grid to the vehicle.")}</div><div><span>🚐 → ⚡</span>${tr("V2G-vaiheessa energia kulki autosta verkkoon.", "During V2G, energy moved from the vehicle to the grid.")}</div><div><span>🔋 ✓</span>${tr("Jakson lopussa ajoneuvon lähtövaraus oli edelleen suojattu.", "At the end, the vehicle's departure reserve remained protected.")}</div>`;
      card.insertAdjacentElement("afterend", result);
    }
    const f = field("energy_flow_clarity");
    if (f) setText(f.querySelector("legend"), tr("Kuinka selkeästi ymmärsit latauksen ja V2G:n energiasuunnat?", "How clearly did you understand the energy directions during charging and V2G?"));
  }

  function winterPublicSpace() {
    if (substep() !== "5 / 6") return;
    setHeading("Talvi häiritsee latauspaikkaa — mitä pitäisi näkyä?", "Winter disrupts the charging site — what should be shown?");
    const fault = document.querySelector(".fault-card");
    const strong = fault?.querySelector("strong");
    const p = fault?.querySelector("p");
    setText(strong, tr("Langaton lataus keskeytyi turvallisesti", "Wireless charging stopped safely"));
    setText(p, tr(
      "Lumi ja loska peittävät osan latausalueen merkinnöistä. Järjestelmä on pysäyttänyt energiansiirron. Ajoneuvo on paikallaan, ja jalankulun sekä esteettömän kulkureitin pitää säilyä selkeänä.",
      "Snow and slush cover some charging-area markings. The system has stopped energy transfer. The vehicle is stationary, and the pedestrian and accessible travel path should remain clear."
    ));

    let status = document.querySelector(".v010-fault-status");
    if (!status) {
      status = document.createElement("div");
      status.className = "v010-fault-status";
      status.innerHTML = `<div><strong>✓ ${tr("Energiansiirto pysäytetty", "Energy transfer stopped")}</strong><span>${tr("Järjestelmä ei jatka epävarmassa tilanteessa.", "The system does not continue in an uncertain condition.")}</span></div><div><strong>♿ ${tr("Kulkureitti tarkistettava", "Travel path must be checked")}</strong><span>${tr("Lumi tai laitteet eivät saa estää kulkua.", "Snow or equipment should not block movement.")}</span></div><div><strong>ℹ ${tr("Vastuutieto näkyville", "Responsibility information visible")}</strong><span>${tr("Käyttäjän pitäisi tietää, minne ongelmasta ilmoitetaan.", "People should know where to report a problem.")}</span></div>`;
      fault?.insertAdjacentElement("afterend", status);
    }
    const f = field("fault_decision");
    if (f) setText(f.querySelector("legend"), tr("Mikä tieto pitäisi näyttää ensimmäisenä tällaisessa julkisen tilan häiriössä?", "What information should be shown first during this kind of public-space fault?"));
    relabel("fault_decision", [
      ["Lataus on pysähtynyt turvallisesti", "Charging has stopped safely"],
      ["Onko kulkureitti esteetön ja turvallinen", "Whether the travel path is accessible and safe"],
      ["Kuka vastaa latauspaikasta ja kunnossapidosta", "Who is responsible for the charging site and maintenance"],
      ["Mistä saa lisätietoa tai voi ilmoittaa ongelmasta", "Where to get more information or report a problem"]
    ]);
  }

  function comprehension() {
    if (substep() !== "6 / 6") return;
    setLead(
      "Tämä ei ole koe. Tarkistamme, välittikö prototyyppi julkisen latauspaikan ja V2G:n perusidean riittävän selkeästi.",
      "This is not a test. We are checking whether the prototype communicated the basic public-space charging and V2G concepts clearly enough."
    );
    const c1 = field("c1"), c2 = field("c2"), c3 = field("c3");
    if (c1) setText(c1.querySelector("legend"), tr("Voiko langaton lataus alkaa vasta, kun järjestelmä on vahvistanut ajoneuvon olevan oikeassa paikassa?", "Can wireless charging start only after the system has confirmed that the vehicle is correctly positioned?"));
    if (c2) setText(c2.querySelector("legend"), tr("Tarkoittaako tavallinen latausvaihe sitä, että energia kulkee autosta sähköverkkoon?", "During ordinary charging, does energy flow from the vehicle to the grid?"));
    if (c3) setText(c3.querySelector("legend"), tr("Missä virtuaalisen jakson vaiheessa sähköä siirtyi ajoneuvosta sähköverkkoon?", "During which phase did electricity move from the vehicle to the grid?"));
  }

  function susPage() {
    if (!isSus()) return;
    const lead = screen?.querySelector("h1")?.nextElementSibling;
    if (lead?.classList.contains("lead")) setText(lead, tr(
      "Arvioi juuri käyttämääsi kansalais- ja saavutettavuusnäkymää. SUS-väittämät ovat standardimuodossa ja koskevat koko juuri käyttämääsi käyttöliittymää.",
      "Rate the citizen and accessibility interface you just used. The SUS statements remain in standard form and refer to the full interface you just used."
    ));
  }

  function trustPage() {
    if (!isTrust()) return;
    setHeading("Luottamus, saavutettavuus ja hyväksyttävyys", "Trust, accessibility and acceptability");
    setLead(
      "Arvioi nyt, oliko julkisen latauspaikan toiminta ymmärrettävää ja hyväksyttävää omasta näkökulmastasi.",
      "Now rate whether the public charging site's operation was understandable and acceptable from your perspective."
    );
    const labels = {
      trust_1: ["Ymmärtäisin yhdellä silmäyksellä, lataako ajoneuvo vai syöttääkö se sähköä takaisin verkkoon.", "I could tell at a glance whether the vehicle is charging or sending electricity back to the grid."],
      trust_2: ["Tietäisin, kuka vastaa ja mistä saa apua, jos latauspaikassa on ongelma.", "I would know who is responsible and where to get help if there is a problem at the charging site."],
      trust_3: ["Luottaisin siihen, että energiansiirto pysähtyy, jos järjestelmä ei pysty varmistamaan turvallista tilannetta.", "I would trust the system to stop energy transfer if it cannot verify a safe condition."],
      accessibility_understanding: role() === "accessibility_representative"
        ? ["Pystyisin ymmärtämään tämän näkymän keskeiset tiedot ja ohjaimet ilman toisen henkilön apua.", "I could understand the key information and controls in this interface without another person's assistance."]
        : ["Pystyisin ymmärtämään tämän näkymän keskeiset tiedot ja ohjaimet ilman erityistä teknistä osaamista.", "I could understand the key information and controls in this interface without specialist technical knowledge."],
      wireless_acceptance: ["Langaton lataus olisi hyväksyttävä Tampereen julkisessa tilassa, jos kulkureitti pysyy esteettömänä ja turvallisena.", "Wireless charging would be acceptable in Tampere public space if the travel path remains accessible and safe."],
      bidirectional_participation: ["V2G olisi hyväksyttävää tässä julkisen tilan tilanteessa, jos energian suunta, rajat, vastuut ja julkinen hyöty ovat selkeät.", "V2G would be acceptable in this public-space setting if energy direction, limits, responsibilities and public benefit are clear."]
    };
    Object.entries(labels).forEach(([name, pair]) => {
      const f = field(name);
      if (f) setText(f.querySelector("legend"), tr(pair[0], pair[1]));
    });
  }

  function apply() {
    if (!screen) return;
    welcome();
    rolePage();
    publicBay();
    publicPrinciples();
    v2gExplanation();
    citizenCycle();
    winterPublicSpace();
    comprehension();
    susPage();
    trustPage();
  }

  function queueApply() {
    if (applyQueued) return;
    applyQueued = true;
    requestAnimationFrame(() => { applyQueued = false; apply(); });
  }

  if (screen) {
    const observer = new MutationObserver(queueApply);
    observer.observe(screen, { childList: true, subtree: false });
    document.addEventListener("change", e => {
      if (e.target instanceof HTMLInputElement && e.target.name === "participant_group") queueApply();
    }, true);
    queueApply();
  }
}
