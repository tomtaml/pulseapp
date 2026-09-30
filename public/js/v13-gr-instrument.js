// Draft cognitive-pretest items. Responses stay in page memory: no scores,
// analytics events or research submissions. Match T1.2 wording before field use.
export const GR_ALIGNMENT_ITEM = Object.freeze({
  key: "gr_alignment_ease", label: "How easy or difficult was it to position the car?",
  choices: [["1", "Very difficult"], ["2", "Difficult"], ["3", "Neither easy nor difficult"], ["4", "Easy"], ["5", "Very easy"], ["unsure", "Cannot judge"]]
});
export function grCheckpointItem(page, reserve = 65) {
  if (page === "gr_arrival") return GR_ALIGNMENT_ITEM;
  if (page === "energy") return {
    key: "gr_reserve_understanding", label: `Can V2G reduce the battery below the ${reserve}% minimum you selected?`,
    choices: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]]
  };
  return null;
}
export const GR_CLOSING_ITEMS = Object.freeze([
  { key: "gr_gross_understanding", label: "Does the displayed gross V2G payment include battery wear and all fees?", choices: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] },
  { key: "gr_choice_reason", label: "What most influenced your choice of V2G plan or charging only?", choices: [["payment", "Payment offered"], ["control", "Control over energy sharing"], ["trip", "Energy needed for the next trip"], ["battery", "Battery wear or other costs"], ["information", "Not enough information"], ["other", "Another reason"], ["unsure", "Not sure"]] }
]);
// Same wording and 1–5 ratings as the shared module; cannot-judge is a separate
// category, never treated as a midpoint. These are individual draft indicators.
export const GR_SHARED_KEYS = Object.freeze(["service_confidence_1", "service_confidence_2", "wpt_intention_t1", "v2g_intention_t1", "fairness_item", "actor_trust_item"]);
export const GR_FAULT_FOLLOWUP = Object.freeze({
  key: "gr_fault_willingness", label: "How did the separate start-delay exercise change your willingness to allow V2G?",
  choices: [["less", "Less willing"], ["same", "No change"], ["more", "More willing"], ["unsure", "Not sure"]]
});
export function grSharedItems(common, outcomes) {
  return GR_SHARED_KEYS.map(key => [key, common.find(([id]) => id === key)?.[1] || outcomes[key]]);
}
export function grAnswerValue(name, value) {
  return (GR_SHARED_KEYS.includes(name) || name === GR_ALIGNMENT_ITEM.key || /^sus_\d\d$/.test(name)) && /^[1-5]$/.test(value) ? Number(value) : value;
}
