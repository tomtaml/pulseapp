// Optional, unscored workshop prompts for the Trikala prototype. Wording and
// Greek translation need site and ethics review before a research instrument.
export const GR_TASK_ITEMS = Object.freeze([
  { key: "gr_bay_clarity", label: "I could tell when the car was aligned and ready to start wireless charging." },
  { key: "gr_window_clarity", label: "I could distinguish the example charging price from the renewable-availability signal." },
  { key: "gr_trip_protection", label: "I could tell whether the selected window would protect my next trip." },
  { key: "gr_export_control", label: "I could distinguish the fictional contract choice from giving permission for this session, and stop export when I wanted." },
  { key: "gr_value_clarity", label: "I could distinguish my charging cost from the gross V2G payment and identify missing battery costs." },
  { key: "gr_recovery_access", label: "I could understand what to do if the session was delayed, including an assisted route without the app." }
]);

export const GR_COMPREHENSION = Object.freeze([
  ["Does choosing a charging time or an illustrative V2G offer alone enable this session's export?", [["yes", "Yes"], ["no", "No; accepting the limits and enabling this stop is separate"], ["unsure", "Not sure"]]],
  ["Does a higher renewable-availability signal prove which electricity reached the car?", [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]]],
  ["When a later window cannot meet the departure margin, what should the app do?", [["earlier", "Offer an earlier feasible charging window"], ["export", "Start exporting the car's energy"], ["ignore", "Ignore the departure"], ["unsure", "Not sure"]]],
  ["Does the example gross export payment include battery wear and all fees?", [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]]]
]);
