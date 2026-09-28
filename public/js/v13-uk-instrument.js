// Draft Oxfordshire workshop probes. Preview-only; not a validated scale or
// part of the research-v1.3 submission contract.
export const UK_TASK_ITEMS = Object.freeze([
  { key: "uk_positioning_independence", label: "I could use the positioning guidance while keeping the house entrance route clear.", hypothesis: "UK-W2", construct: "independent accessible positioning" },
  { key: "uk_recovery_clarity", label: "After parking stopped, I understood what to check before moving again.", hypothesis: "UK-W3", construct: "recovery intelligibility" },
  { key: "uk_manual_arrows", label: "The arrow controls made each manual correction clear enough to follow.", hypothesis: "UK-W3", construct: "manual fallback clarity", onlyIfManual: true },
  { key: "uk_morning_reserve", label: "I could choose a morning battery minimum that protects the journey I need.", hypothesis: "UK-H1", construct: "mobility reserve control" },
  { key: "uk_energy_direction", label: "I could tell when the car was charging and when it was supplying the house.", hypothesis: "UK-H2", construct: "energy-state intelligibility" },
  { key: "uk_household_value", label: "I could see how much energy reached the house in this example.", hypothesis: "UK-H1", construct: "household benefit intelligibility" },
  { key: "uk_override_control", label: "I could find the control to stop home energy sharing.", hypothesis: "UK-H2", construct: "accessible override" },
  { key: "uk_support_responsibility", label: "I know whom I would contact if this home energy service failed.", hypothesis: "UK-H3", construct: "support responsibility clarity" }
]);

export const ukTaskItems = manualUsed => UK_TASK_ITEMS.filter(item => !item.onlyIfManual || manualUsed);

export const UK_COMPREHENSION = Object.freeze([
  ["What should happen before parking resumes after an obstacle stop?", [["review", "Check that the obstacle and entrance route are clear"], ["ignore", "Ignore the warning and continue"], ["remote", "Wait for the car to move without a check"], ["unsure", "Not sure"]]],
  ["What limits how much battery energy the car may send to the house?", [["minimum", "The chosen morning battery minimum"], ["price", "Only the example electricity price"], ["time", "Only the parking time"], ["unsure", "Not sure"]]],
  ["Where does energy drawn for V2H go in this example?", [["home", "To the house"], ["export", "To the grid"], ["charge", "Back into the car"], ["unsure", "Not sure"]]],
  ["Who can stop home energy sharing in this example?", [["driver", "The participant using Stop home support"], ["operator", "Only the provider"], ["automatic", "Nobody until morning"], ["unsure", "Not sure"]]]
]);
