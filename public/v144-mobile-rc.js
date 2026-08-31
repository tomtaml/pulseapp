const mobileRcStyle = document.createElement("style");
mobileRcStyle.textContent = `
@media (max-width: 520px) {
  .topbar .badge,
  .topbar .status-badge {
    display: none !important;
  }

  .topbar {
    align-items: center;
    padding-top: .55rem;
    padding-bottom: .55rem;
  }

  .footer {
    position: static;
    padding: .7rem 1rem calc(.7rem + env(safe-area-inset-bottom));
  }

  .shell {
    padding-bottom: 1rem;
  }

  .actions {
    bottom: .25rem;
  }

  .v06-positioning {
    gap: .55rem;
  }

  .v06-power-status {
    margin-bottom: 0;
  }

  .v06-assist-panel {
    gap: .45rem;
  }

  .v06-manual-title {
    margin-top: .05rem;
  }

  .v06-dpad {
    margin-top: 0;
  }
}
`;
document.head.appendChild(mobileRcStyle);

function compactPositioningControls() {
  const wrap = document.querySelector(".v06-positioning");
  if (!wrap) return;

  const power = wrap.querySelector(".v06-power-status");
  const assist = wrap.querySelector(".v06-assist-panel");
  const condition = wrap.querySelector(".v06-condition");

  if (power && assist && power.nextElementSibling !== assist) {
    power.insertAdjacentElement("afterend", assist);
  }

  if (!assist) return;
  const title = assist.querySelector(".v06-manual-title");
  const dpad = assist.querySelector(".v06-dpad");
  const feedback = assist.querySelector(".v06-move-feedback");
  const failure = assist.querySelector(".v06-assist-failure");

  if (title && dpad) {
    if (assist.firstElementChild !== title) assist.prepend(title);
    if (title.nextElementSibling !== dpad) title.insertAdjacentElement("afterend", dpad);
    if (feedback && dpad.nextElementSibling !== feedback) dpad.insertAdjacentElement("afterend", feedback);
    if (failure && feedback && feedback.nextElementSibling !== failure) feedback.insertAdjacentElement("afterend", failure);
  }

  if (condition && assist.nextElementSibling !== condition) {
    assist.insertAdjacentElement("afterend", condition);
  }
}

function scrollToTopAfterPageChange(event) {
  const control = event.target.closest?.('[data-action="next"], [data-action="back"]');
  if (!control) return;
  const beforeHeading = document.querySelector("#screen h1")?.textContent || "";
  window.setTimeout(() => {
    const afterHeading = document.querySelector("#screen h1")?.textContent || "";
    if (afterHeading && afterHeading !== beforeHeading) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, 30);
}

document.addEventListener("click", scrollToTopAfterPageChange);

const mobileRcObserver = new MutationObserver(() => compactPositioningControls());
const mobileRcScreen = document.querySelector("#screen");
if (mobileRcScreen) {
  mobileRcObserver.observe(mobileRcScreen, { childList: true, subtree: true });
  compactPositioningControls();
}
