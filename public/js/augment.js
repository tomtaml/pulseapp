// Small progressive enhancement kept separate from the core renderer so study
// instruments can be iterated without rewriting the whole screen module.

const screen = document.querySelector("#screen");

function addThirdTrustItem() {
  if (!screen || screen.querySelector('[name="trust_3"]')) return;
  const trust2 = screen.querySelector('[name="trust_2"]');
  if (!trust2) return;

  const isFi = document.documentElement.lang === "fi";
  const fieldset = document.createElement("fieldset");
  fieldset.dataset.augmentation = "fault-trust";
  fieldset.innerHTML = `
    <legend>${isFi ? "Tietäisin, mitä tehdä, jos lataus ei käynnisty tai keskeytyy." : "I would know what to do if charging failed or stopped."}</legend>
    <div class="likert-anchors"><span>${isFi ? "Täysin eri mieltä" : "Strongly disagree"}</span><span>${isFi ? "Täysin samaa mieltä" : "Strongly agree"}</span></div>
    <div class="likert" role="radiogroup" aria-label="trust_3">
      ${[1,2,3,4,5].map(v => `<label class="likert-option"><input type="radio" name="trust_3" value="${v}" ${v === 3 ? "checked" : ""}><span>${v}</span></label>`).join("")}
    </div>`;

  const trust2Fieldset = trust2.closest("fieldset");
  trust2Fieldset?.insertAdjacentElement("afterend", fieldset);
}

const observer = new MutationObserver(addThirdTrustItem);
observer.observe(screen, { childList:true, subtree:true });
addThirdTrustItem();
