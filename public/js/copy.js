export const APP_VERSION = "0.2.0";

export const variants = {
  "fi-fleet": {
    badge: "Finland · wireless V2G · fleet",
    title: { en: "Wireless charging + V2G for delivery fleets", fi: "Langaton lataus + V2G jakelukalustolle" },
    intro: {
      en: "Try a short delivery-van charging task. We are testing whether the service is understandable, controllable and usable — not your technical knowledge.",
      fi: "Kokeile lyhyt jakeluauton lataustehtävä. Testaamme palvelun ymmärrettävyyttä, hallittavuutta ja käytettävyyttä — emme teknistä osaamistasi."
    },
    groups: ["fleet_driver", "dispatcher", "fleet_manager", "other"]
  },
  "fi-citizen": {
    badge: "Finland · citizen/accessibility review",
    title: { en: "Understand and test the PULSE charging app", fi: "Ymmärrä ja testaa PULSE-lataussovellusta" },
    intro: {
      en: "Walk through the same fictional delivery-van flow as a citizen, nearby user or accessibility reviewer. We want to know whether the information and controls are understandable without fleet expertise.",
      fi: "Käy läpi sama kuvitteellinen jakeluauton käyttökulku kansalaisen, lähialueen käyttäjän tai saavutettavuuden arvioijan näkökulmasta. Haluamme tietää, ovatko tiedot ja ohjaimet ymmärrettäviä ilman kalusto-osaamista."
    },
    groups: ["citizen", "accessibility_representative", "road_user", "other"]
  },
  "uk-v2h": {
    badge: "UK · wireless V2H · accessible home",
    title: { en: "Wireless charging + Vehicle-to-Home", fi: "Langaton lataus + Vehicle-to-Home" },
    intro: {
      en: "Try an accessible home-charging scenario where the vehicle can support the home while keeping enough charge for the next trip.",
      fi: "Kokeile saavutettavaa kotilatausskenaariota, jossa auto voi tukea kodin sähkönkäyttöä ja säilyttää samalla riittävän varauksen seuraavaa matkaa varten."
    },
    groups: ["citizen", "accessibility_representative", "other"]
  }
};

export const copy = {
  en: {
    continue: "Continue", back: "Back", submit: "Submit anonymous response",
    agree: "I have read the workshop information shown to me and agree to continue.",
    notReal: "I understand this is a simulation, not a real charging service.",
    privacy: "Do not enter names, email addresses, phone numbers, employer names or precise addresses.",
    done: "Thank you — response recorded.", demoDone: "Demo complete — no research data were sent.",
    stronglyDisagree: "Strongly disagree", stronglyAgree: "Strongly agree"
  },
  fi: {
    continue: "Jatka", back: "Takaisin", submit: "Lähetä anonyymi vastaus",
    agree: "Olen lukenut minulle näytetyt työpajan tiedot ja suostun jatkamaan.",
    notReal: "Ymmärrän, että tämä on simulaatio eikä oikea latauspalvelu.",
    privacy: "Älä kirjoita nimiä, sähköpostiosoitteita, puhelinnumeroita, työnantajan nimeä tai tarkkoja osoitteita.",
    done: "Kiitos — vastaus tallennettiin.", demoDone: "Demo valmis — tutkimusdataa ei lähetetty.",
    stronglyDisagree: "Täysin eri mieltä", stronglyAgree: "Täysin samaa mieltä"
  },
  el: {
    continue: "Συνέχεια", back: "Πίσω", submit: "Υποβολή ανώνυμης απάντησης",
    agree: "Έχω διαβάσει τις πληροφορίες του εργαστηρίου που μου παρουσιάστηκαν και συμφωνώ να συνεχίσω.",
    notReal: "Κατανοώ ότι πρόκειται για προσομοίωση και όχι για πραγματική υπηρεσία φόρτισης.",
    privacy: "Μην εισάγετε ονόματα, διευθύνσεις email, αριθμούς τηλεφώνου, εργοδότη ή ακριβείς διευθύνσεις.",
    done: "Ευχαριστούμε — η απάντηση καταγράφηκε.", demoDone: "Η επίδειξη ολοκληρώθηκε — δεν στάλθηκαν ερευνητικά δεδομένα.",
    stronglyDisagree: "Διαφωνώ απόλυτα", stronglyAgree: "Συμφωνώ απόλυτα"
  }
};

export const susItems = {
  en: [
    "I think that I would like to use this system frequently.",
    "I found the system unnecessarily complex.",
    "I thought the system was easy to use.",
    "I think that I would need the support of a technical person to be able to use this system.",
    "I found the various functions in this system were well integrated.",
    "I thought there was too much inconsistency in this system.",
    "I would imagine that most people would learn to use this system very quickly.",
    "I found the system very cumbersome to use.",
    "I felt very confident using the system.",
    "I needed to learn a lot of things before I could get going with this system."
  ],
  // Finnish workshop wording supplied for PULSE. Validate/back-translate before cross-country comparative use if required by the study protocol.
  fi: [
    "Uskon, että haluaisin käyttää tätä järjestelmää usein.",
    "Pidin järjestelmää tarpeettoman monimutkaisena.",
    "Järjestelmää oli mielestäni helppo käyttää.",
    "Luulen, että tarvitsisin teknisen henkilön tukea pystyäkseni käyttämään tätä järjestelmää.",
    "Järjestelmän eri toiminnot oli mielestäni integroitu hyvin toisiinsa.",
    "Mielestäni järjestelmässä oli liikaa epäjohdonmukaisuuksia.",
    "Voisin kuvitella, että useimmat ihmiset oppisivat käyttämään tätä järjestelmää erittäin nopeasti.",
    "Pidin järjestelmää erittäin hankalakäyttöisenä.",
    "Tunsin oloni erittäin varmaksi järjestelmää käyttäessäni.",
    "Minun piti oppia paljon asioita ennen kuin pääsin alkuun tämän järjestelmän kanssa."
  ],
  // Greek workshop wording supplied for PULSE. Native-language review / validation status should be recorded before comparative SUS use.
  el: [
    "Πιστεύω ότι θα ήθελα να χρησιμοποιώ αυτό το σύστημα συχνά.",
    "Βρήκα το σύστημα άσκοπα πολύπλοκο.",
    "Πιστεύω ότι το σύστημα ήταν εύκολο στη χρήση.",
    "Πιστεύω ότι θα χρειαζόμουν την υποστήριξη ενός τεχνικού για να μπορέσω να χρησιμοποιήσω αυτό το σύστημα.",
    "Βρήκα ότι οι διάφορες λειτουργίες αυτού του συστήματος ήταν καλά ενσωματωμένες.",
    "Πιστεύω ότι υπήρχε μεγάλη ασυνέπεια σε αυτό το σύστημα.",
    "Φαντάζομαι ότι οι περισσότεροι άνθρωποι θα μάθαιναν να χρησιμοποιούν αυτό το σύστημα πολύ γρήγορα.",
    "Βρήκα το σύστημα πολύ δύσχρηστο στη χρήση.",
    "Ένιωσα μεγάλη αυτοπεποίθηση χρησιμοποιώντας το σύστημα.",
    "Χρειάστηκε να μάθω πολλά πράγματα πριν μπορέσω να αρχίσω να χρησιμοποιώ αυτό το σύστημα."
  ]
};

export function roleLabel(value, language) {
  const labels = {
    fleet_driver: ["Fleet driver", "Kuljettaja"],
    dispatcher: ["Dispatcher / operations", "Ajojärjestelijä / operointi"],
    fleet_manager: ["Fleet manager", "Kalustopäällikkö"],
    citizen: ["Citizen / nearby user", "Kansalainen / lähialueen käyttäjä"],
    accessibility_representative: ["Accessibility / vulnerable-group perspective", "Saavutettavuus / haavoittuvan ryhmän näkökulma"],
    road_user: ["Other road user", "Muu tienkäyttäjä"],
    other: ["Other", "Muu"]
  };
  return labels[value][language === "fi" ? 1 : 0];
}
