import { useEffect, useState } from "react";

export const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const padTwo = (n) => String(n).padStart(2, "0");

/** Returns IST clock object: { time, date, short } */
export const getISTClock = () => {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const h = ist.getHours(), m = ist.getMinutes(), s = ist.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return {
    time:  `${padTwo(h12)}:${padTwo(m)}:${padTwo(s)} ${ampm}`,
    date:  `${DAY_NAMES[ist.getDay()]}, ${MONTH_NAMES[ist.getMonth()]} ${ist.getDate()} ${ist.getFullYear()}`,
    short: `${DAY_NAMES[ist.getDay()]}, ${MONTH_NAMES[ist.getMonth()]} ${ist.getDate()}`,
  };
};

export const fmtDateIST = (dateStr, opts = {}) =>
  new Date(dateStr).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

export const fmtTimeIST = (dateStr, opts = {}) =>
  new Date(dateStr).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

export function useClock() {
  const [clock, setClock] = useState(() => getISTClock());
  useEffect(() => {
    const timer = setInterval(() => setClock(getISTClock()), 1000);
    return () => clearInterval(timer);
  }, []);
  return clock;
}