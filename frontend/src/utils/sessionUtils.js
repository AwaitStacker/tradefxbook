// src/utils/sessionUtils.js

/**
 * Classifies a trade datetime into a trading session (IST timezone).
 * Asian:  05:30–08:30 IST
 * London: 11:30–14:00 IST
 * NYC:    17:00–20:30 IST
 * Others: everything else
 */
export const getSession = (dateStr) => {
  const d = new Date(dateStr);
  const ist = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const h = ist.getHours(), m = ist.getMinutes();
  const mins = h * 60 + m;
  if (mins >= 330  && mins < 510)  return "Asian";
  if (mins >= 690  && mins < 840)  return "London";
  if (mins >= 1020 && mins < 1230) return "NYC";
  return "Others";
};