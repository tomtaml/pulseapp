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

  .v07-cycle-top {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: .3rem;
  }

  .v07-cycle-top > div {
    min-width: 0;
    padding: .42rem .28rem;
    gap: .08rem;
    text-align: center;
    border-radius: 10px;
  }

  .v07-cycle-top span {
    font-size: .66rem;
    line-height: 1.12;
    overflow-wrap: anywhere;
  }

  .v07-cycle-top strong {
    font-size: .9rem;
    line-height: 1.15;
    white-space: nowrap;
  }
}
`;
document.head.appendChild(mobileRcStyle);

function compactPositioningControls() {
  if (!window.matchMedia("(max-width: 520px)").matches) return;

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

const mobileRcScreen = document.querySelector("#screen");
let navigationArmed = false;
let navigationSignature = "";
let navigationTimer = null;

function pageSignature() {
  if (!mobileRcScreen) return "";
  const heading = mobileRcScreen.querySelector("h1")?.textContent?.trim() || "";
  const step = mobileRcScreen.querySelector(".step-label")?.textContent?.trim() || "";
  return `${step}|${heading}`;
}

function forcePageTop() {
  const reset = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  };
  reset();
  requestAnimationFrame(() => {
    reset();
    requestAnimationFrame(reset);
  });
  window.setTimeout(reset, 80);
}

document.addEventListener("click", event => {
  const control = event.target.closest?.('[data-action="next"], [data-action="back"]');
  if (!control || !mobileRcScreen) return;
  navigationArmed = true;
  navigationSignature = pageSignature();
  window.clearTimeout(navigationTimer);
  navigationTimer = window.setTimeout(() => {
    navigationArmed = false;
  }, 1500);
}, true);

const mobileRcObserver = new MutationObserver(() => {
  compactPositioningControls();
  if (!navigationArmed) return;
  const currentSignature = pageSignature();
  if (!currentSignature || currentSignature === navigationSignature) return;
  navigationArmed = false;
  window.clearTimeout(navigationTimer);
  forcePageTop();
});

if (mobileRcScreen) {
  mobileRcObserver.observe(mobileRcScreen, { childList: true, subtree: true });
  compactPositioningControls();
}
