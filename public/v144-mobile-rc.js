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

  .v1-adapter-cycle {
    scroll-margin-top: 4.5rem;
  }

  .v07-cycle-main {
    gap: .55rem;
    padding: .7rem;
    border-radius: 16px;
  }

  .v07-phase {
    gap: .08rem;
  }

  .v07-phase strong {
    font-size: 1.15rem;
  }

  .v07-phase span {
    font-size: .84rem;
    line-height: 1.25;
  }

  .v1-run-adapter-cycle,
  .v07-run-cycle {
    width: 100%;
    margin: .1rem 0;
  }

  .v07-battery-row {
    grid-template-columns: minmax(0, 1fr) 108px !important;
    gap: .5rem;
  }

  .v07-battery {
    height: 62px;
    border-width: 4px;
    border-radius: 14px;
  }

  .v07-battery:after {
    right: -10px;
    top: 18px;
    width: 8px;
    height: 22px;
  }

  .v07-battery strong {
    font-size: 1.85rem;
  }

  .v07-battery-status {
    gap: .12rem;
    padding: .38rem .25rem;
    border-radius: 11px;
  }

  .v07-battery-status span {
    font-size: .68rem;
    line-height: 1.1;
  }

  .v07-battery-status strong {
    font-size: 1.15rem;
  }

  .v07-flow {
    grid-template-columns: 42px 1fr 42px !important;
    gap: .25rem;
  }

  .v07-flow-node {
    font-size: 1.7rem !important;
  }

  .v07-flow-lane {
    height: 36px;
  }

  .v07-flow-lane b {
    font-size: 1.8rem;
  }

  .v07-flow-lane span {
    top: 11px;
  }

  .v07-energy-counters {
    gap: .3rem;
  }

  .v07-energy-counters > div {
    gap: .08rem;
    padding: .42rem .25rem;
    border-radius: 10px;
  }

  .v07-energy-counters span {
    font-size: .68rem;
    line-height: 1.1;
  }

  .v07-energy-counters strong {
    font-size: .92rem;
  }

  .v07-cycle-progress {
    height: 8px;
  }

  .v07-explanation {
    padding: .55rem .65rem;
    font-size: .84rem;
    line-height: 1.35;
  }

  .v07-market {
    gap: .38rem;
    padding: .55rem;
  }

  .v07-market-head {
    gap: .5rem;
  }

  .v07-market-head strong {
    font-size: .85rem;
  }

  .v07-market-head small,
  .v07-market-foot {
    font-size: .67rem;
    line-height: 1.2;
  }

  .v07-market-slots {
    gap: .25rem;
  }

  .v07-market-slot {
    padding: .35rem .2rem;
    font-size: .65rem;
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

function compactCycleControls() {
  if (!window.matchMedia("(max-width: 520px)").matches) return;
  const main = document.querySelector(".v1-adapter-cycle .v07-cycle-main");
  if (!main) return;
  const run = main.querySelector(".v1-run-adapter-cycle, .v07-run-cycle");
  const phase = main.querySelector(".v07-phase");
  if (run && phase && phase.nextElementSibling !== run) {
    phase.insertAdjacentElement("afterend", run);
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

function focusCycleAnimation() {
  if (!window.matchMedia("(max-width: 520px)").matches) return;
  const target = document.querySelector(".v1-adapter-cycle .v07-cycle-main");
  if (!target) return;
  target.scrollIntoView({ block: "start", behavior: "auto" });
}

document.addEventListener("click", event => {
  const control = event.target.closest?.('[data-action="next"], [data-action="back"]');
  if (control && mobileRcScreen) {
    navigationArmed = true;
    navigationSignature = pageSignature();
    window.clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => {
      navigationArmed = false;
    }, 1500);
  }

  const cycleStart = event.target.closest?.(".v1-run-adapter-cycle, .v07-run-cycle");
  if (cycleStart) {
    window.setTimeout(focusCycleAnimation, 40);
    window.setTimeout(focusCycleAnimation, 140);
  }
}, true);

const mobileRcObserver = new MutationObserver(() => {
  compactPositioningControls();
  compactCycleControls();
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
  compactCycleControls();
}
