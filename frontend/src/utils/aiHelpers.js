// src/utils/aiHelpers.js
import { getInstrumentCfg } from "./calculations";

// ── Behavioral trade labeling ─────────────────────────────────────────────
export const labelTrade = (t, allTrades) => {
  const labels = [];
  const idx = allTrades.indexOf(t);
  const prevTrade = idx > 0 ? allTrades[idx - 1] : null;

  if (prevTrade && !prevTrade.isWin && t.date && prevTrade.date) {
    const gap = (new Date(t.date) - new Date(prevTrade.date)) / 60000;
    if (gap <= 15 && (t.lotSize || 0) > (prevTrade.lotSize || 0))
      labels.push("revenge_trade");
  }
  if (["FOMO","Anxious","Excited"].includes(t.emotionBefore)) labels.push("impulse_trade");
  if (["Greedy","Fearful","Frustrated"].includes(t.emotionBefore)) labels.push("high_emotion_trade");
  if (t.followedPlan === false) labels.push("rule_break");
  if (t.rr && t.rr < 0.5) labels.push("chasing_trade");
  if (t.isWin && t.followedPlan === true && t.rr && t.rr >= 1.5) labels.push("A+_setup");
  if (!t.isWin && t.followedPlan === false) labels.push("bad_execution");
  return labels;
};

// ── XAU pip: 1920.10 → 1920.20 = 1 pip (pipMult=10) ─────────────────────
const calcXAUPips = (entry, exit, direction) => {
  const diff = direction === "BUY" ? exit - entry : entry - exit;
  return parseFloat((diff * 10).toFixed(1));
};

// ── Compute full advanced summary metrics ─────────────────────────────────
export const computeAdvancedSummary = (closedTrades) => {
  const t = closedTrades;
  if (!t.length) return null;

  const wins   = t.filter(x => x.isWin);
  const losses = t.filter(x => !x.isWin);
  const grossW = wins.reduce((a, x) => a + x.pl, 0);
  const grossL = Math.abs(losses.reduce((a, x) => a + x.pl, 0));
  const rrT    = t.filter(x => x.rr);
  const avgRR  = rrT.length ? rrT.reduce((a,x)=>a+x.rr,0)/rrT.length : 0;
  const winPct = t.length ? wins.length / t.length : 0;
  const lossPct = 1 - winPct;
  const avgWin  = wins.length   ? grossW / wins.length   : 0;
  const avgLoss = losses.length ? grossL / losses.length : 0;
  const expectancy   = (winPct * avgWin) - (lossPct * avgLoss);
  const profitFactor = grossL > 0 ? grossW / grossL : grossW > 0 ? 999 : 0;

  let peak = 0, equity = 0, maxDD = 0;
  t.forEach(x => {
    equity += x.pl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
  });

  const durations = t.filter(x => x.date && x.exitDate).map(x =>
    Math.abs(new Date(x.exitDate) - new Date(x.date)) / 60000
  );
  const avgDuration = durations.length ? durations.reduce((a,v)=>a+v,0)/durations.length : 0;

  const sessionMap = {};
  t.forEach(x => {
    const s = x.session || "Others";
    if (!sessionMap[s]) sessionMap[s] = { trades:0, wins:0, pl:0 };
    sessionMap[s].trades++; sessionMap[s].pl += x.pl;
    if (x.isWin) sessionMap[s].wins++;
  });
  const sessionStats  = Object.entries(sessionMap).map(([s,d]) => ({
    session: s, trades: d.trades,
    winRate: d.trades ? `${(d.wins/d.trades*100).toFixed(1)}%` : "—",
    totalPL: d.pl.toFixed(2),
    expectancy: (d.pl / d.trades).toFixed(2),
  }));
  const sortedSessions = [...sessionStats].sort((a,b)=>parseFloat(b.totalPL)-parseFloat(a.totalPL));

  const setupMap = {};
  t.forEach(x => {
    const s = x.setupType || "Other";
    if (!setupMap[s]) setupMap[s] = { trades:0, wins:0, pl:0, rrs:[] };
    setupMap[s].trades++; setupMap[s].pl += x.pl;
    if (x.isWin) setupMap[s].wins++;
    if (x.rr) setupMap[s].rrs.push(x.rr);
  });
  const setupStats = Object.entries(setupMap).map(([s,d]) => ({
    setup: s, trades: d.trades,
    winRate: d.trades ? `${(d.wins/d.trades*100).toFixed(1)}%` : "—",
    totalPL: d.pl.toFixed(2),
    avgRR: d.rrs.length ? (d.rrs.reduce((a,v)=>a+v,0)/d.rrs.length).toFixed(2) : "—",
  }));

  const emotionMap = {};
  t.forEach(x => {
    const e = x.emotionBefore || "Neutral";
    if (!emotionMap[e]) emotionMap[e] = { trades:0, wins:0, pl:0 };
    emotionMap[e].trades++; emotionMap[e].pl += x.pl;
    if (x.isWin) emotionMap[e].wins++;
  });
  const emotionStats = Object.entries(emotionMap).map(([e,d]) => ({
    emotion: e, trades: d.trades,
    winRate: d.trades ? `${(d.wins/d.trades*100).toFixed(1)}%` : "—",
    totalPL: d.pl.toFixed(2),
  }));

  const dowMap = {};
  t.forEach(x => {
    const dow = x.date
      ? new Date(x.date).toLocaleDateString("en-US",{weekday:"short",timeZone:"Asia/Kolkata"})
      : "Unknown";
    if (!dowMap[dow]) dowMap[dow] = { trades:0, wins:0, pl:0 };
    dowMap[dow].trades++; dowMap[dow].pl += x.pl;
    if (x.isWin) dowMap[dow].wins++;
  });
  const dayStats = Object.entries(dowMap).map(([d,v]) => ({
    day: d, trades: v.trades, totalPL: v.pl.toFixed(2),
    winRate: v.trades ? `${(v.wins/v.trades*100).toFixed(1)}%` : "—",
  }));

  const pairMap = {};
  t.forEach(x => {
    const p = x.pair || "Unknown";
    if (!pairMap[p]) pairMap[p] = { trades:0, wins:0, pl:0, pips:0 };
    pairMap[p].trades++; pairMap[p].pl += x.pl;
    if (x.isWin) pairMap[p].wins++;
    if (x.entry && x.exit) {
      const cfg  = getInstrumentCfg(p);
      const diff = x.direction==="BUY" ? x.exit-x.entry : x.entry-x.exit;
      pairMap[p].pips += diff * cfg.pipMultiplier;
    }
  });
  const pairStats = Object.entries(pairMap).map(([p,d]) => ({
    pair: p, trades: d.trades,
    winRate: d.trades ? `${(d.wins/d.trades*100).toFixed(1)}%` : "—",
    totalPL: d.pl.toFixed(2),
    totalPips: d.pips.toFixed(1),
  }));

  const revengeCount = t.filter((x,i) => {
    if (i===0) return false;
    const prev = t[i-1];
    if (!prev || prev.isWin) return false;
    const gap = (new Date(x.date)-new Date(prev.date))/60000;
    return gap <= 15 && (x.lotSize||0) > (prev.lotSize||0);
  }).length;

  const fridayTrades = t.filter(x => x.date && new Date(x.date).getDay()===5);
  const fridayWR     = fridayTrades.length
    ? (fridayTrades.filter(x=>x.isWin).length/fridayTrades.length*100).toFixed(1)
    : null;

  const planAdherence  = t.filter(x=>x.followedPlan===true).length / t.length * 100;
  const ruleBreaks     = t.filter(x=>x.followedPlan===false).length;
  const ruleBreakLoss  = t.filter(x=>x.followedPlan===false && !x.isWin).reduce((a,x)=>a+Math.abs(x.pl),0);

  const dateCounts = {};
  t.forEach(x => { if (x.date) { const d = x.date.slice(0,10); dateCounts[d]=(dateCounts[d]||0)+1; } });
  const tradingDays     = Object.keys(dateCounts).length || 1;
  const avgTradesPerDay = t.length / tradingDays;
  const overtradingScore = Math.min(100, Math.round((avgTradesPerDay / 5) * 100));

  const impulsiveCount = t.filter(x=>["FOMO","Anxious","Excited"].includes(x.emotionBefore)).length;
  const impulsiveScore = Math.round(impulsiveCount/t.length*100);

  const costOfRevenge   = t.filter((x,i)=>{ if(i===0)return false; const p=t[i-1]; return p&&!p.isWin&&(new Date(x.date)-new Date(p.date))/60000<=15&&(x.lotSize||0)>(p.lotSize||0)&&!x.isWin; }).reduce((a,x)=>a+Math.abs(x.pl),0);
  const costOfRuleBreak = ruleBreakLoss;
  const costOfLowRR     = t.filter(x=>x.rr&&x.rr<1&&!x.isWin).reduce((a,x)=>a+Math.abs(x.pl),0);
  const costOfBadSession = sortedSessions.length ? Math.abs(parseFloat(sortedSessions[sortedSessions.length-1]?.totalPL||0)) : 0;

  const xauTrades = t.filter(x => (x.pair||"").toUpperCase() === "XAUUSD");
  const xauStats  = xauTrades.length ? {
    count:    xauTrades.length,
    winRate:  `${(xauTrades.filter(x=>x.isWin).length/xauTrades.length*100).toFixed(1)}%`,
    totalPL:  xauTrades.reduce((a,x)=>a+x.pl,0).toFixed(2),
    totalPips: xauTrades.reduce((a,x)=>a+(x.entry&&x.exit?calcXAUPips(x.entry,x.exit,x.direction):0),0).toFixed(1),
    note:     "1 pip XAUUSD = $0.10 price move. 1920.10→1920.20 = 1 pip. pipMultiplier=10.",
  } : null;

  const largestWin  = Math.max(0, ...t.map(x=>x.pl));
  const largestLoss = Math.min(0, ...t.map(x=>x.pl));

  let maxWinStreak=0, maxLossStreak=0, curW=0, curL=0;
  t.forEach(x=>{
    if(x.isWin){curW++;curL=0;maxWinStreak=Math.max(maxWinStreak,curW);}
    else{curL++;curW=0;maxLossStreak=Math.max(maxLossStreak,curL);}
  });

  return {
    totalTrades: t.length, tradingDays,
    wins: wins.length, losses: losses.length,
    winRate:  `${(winPct*100).toFixed(1)}%`,
    lossRate: `${(lossPct*100).toFixed(1)}%`,
    avgRR: avgRR.toFixed(2),
    avgWin: avgWin.toFixed(2), avgLoss: avgLoss.toFixed(2),
    grossProfit: grossW.toFixed(2), grossLoss: grossL.toFixed(2),
    profitFactor: grossL > 0 ? profitFactor.toFixed(2) : "∞",
    expectancy:  expectancy.toFixed(2),
    maxDrawdown: maxDD.toFixed(2),
    largestWin:  largestWin.toFixed(2),
    largestLoss: largestLoss.toFixed(2),
    maxWinStreak, maxLossStreak,
    avgDuration: avgDuration.toFixed(0),
    avgTradesPerDay: avgTradesPerDay.toFixed(1),
    overtradingScore, impulsiveScore,
    planAdherence: planAdherence.toFixed(1), ruleBreaks,
    revengeTradeCount: revengeCount,
    fridayWinRate: fridayWR,
    sessionStats, sortedSessions,
    bestSession:  sortedSessions[0]?.session || "—",
    worstSession: sortedSessions[sortedSessions.length-1]?.session || "—",
    setupStats, emotionStats, dayStats, pairStats,
    costOfMistakes: {
      revenge:    costOfRevenge.toFixed(2),
      ruleBreak:  costOfRuleBreak.toFixed(2),
      lowRR:      costOfLowRR.toFixed(2),
      badSession: costOfBadSession.toFixed(2),
      total: (costOfRevenge+costOfRuleBreak+costOfLowRR).toFixed(2),
    },
    xauStats,
    totalPL: t.reduce((a,x)=>a+x.pl,0).toFixed(2),
  };
};

// ── Normalize trade data for AI ────────────────────────────────────────────
export const prepareAIData = (closedTrades) => {
  return closedTrades.slice(-100).map(t => {
    const labels = labelTrade(t, closedTrades);
    const cfg    = getInstrumentCfg(t.pair);
    const diff   = t.entry && t.exit ? (t.direction==="BUY" ? t.exit-t.entry : t.entry-t.exit) : 0;
    const pips   = diff * cfg.pipMultiplier;
    const pipNote = (t.pair||"").toUpperCase()==="XAUUSD"
      ? `XAU pip check: diff=${diff.toFixed(2)}, pips=${(diff*10).toFixed(1)} (1pip=$0.10 move, pipMult=10)`
      : undefined;
    return {
      pair: t.pair||"—", direction: t.direction||"—",
      session: t.session||"Others",
      date: t.date ? new Date(t.date).toISOString().slice(0,16) : "—",
      dayOfWeek: t.date ? new Date(t.date).toLocaleDateString("en-US",{weekday:"short",timeZone:"Asia/Kolkata"}) : "—",
      entry: t.entry??0, exit: t.exit??0, stopLoss: t.stopLoss??null, takeProfit: t.takeProfit??null,
      pips: parseFloat(pips.toFixed(1)), pipNote,
      rr: t.rr??null, lotSize: t.lotSize??null, pl: t.pl??0, isWin: !!t.isWin,
      emotionBefore: t.emotionBefore||"—", emotionAfter: t.emotionAfter||"—",
      setupType: t.setupType||"—",
      followedPlan: t.followedPlan??null,
      mistakeTags: t.mistakeTags||[],
      preAnalysis: !!t.preAnalysis, postReview: !!t.postReview,
      behaviorLabels: labels,
    };
  });
};

// ── AI response cleaning ───────────────────────────────────────────────────
export const cleanAIResponse = (text) =>
  text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

// ── Safe multi-attempt JSON parser ────────────────────────────────────────
export const safeParseJSON = (text) => {
  try { return JSON.parse(text); } catch (_) {}
  try {
    const fixed = text.replace(/:\s*"([^"\\]*(\\.[^"\\]*)*)$/, ':"$1"');
    return JSON.parse(fixed);
  } catch (_) {}
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}
  return null;
};

// ── Prompt builder ────────────────────────────────────────────────────────
export const buildPrompt = (summary, tradesData, coachMode) => {
  const coachPersona = {
    drill: "You are a brutally honest Senior Risk Manager at a Tier-1 Prop Firm. Prioritize mistakes ruthlessly. No sugarcoating.",
    quant: "You are a Quantitative Trading Analyst. Focus on statistics, probabilities, standard deviation, expectancy math. Use precise numbers.",
    zen:   "You are a trading performance coach focused on emotional discipline. Identify psychological patterns and emotional leaks. Be compassionate but precise.",
  }[coachMode] || "You are a professional trading performance coach.";

  const compactTrades = tradesData.slice(-50).map(t => ({
    p: t.pair, d: t.direction, s: t.session, dow: t.dayOfWeek,
    entry: t.entry, exit: t.exit, pips: t.pips,
    rr: t.rr, lot: t.lotSize, pl: t.pl, win: t.isWin,
    eb: t.emotionBefore, ea: t.emotionAfter,
    plan: t.followedPlan, setup: t.setupType, labels: t.behaviorLabels,
  }));

  return `${coachPersona}

XAU/USD PIP RULE: 1 pip = $0.10 price move. 1920.10→1920.20 = 1 pip (not 10). pipMultiplier=10.

SUMMARY: ${JSON.stringify({
  trades: summary.totalTrades, wr: summary.winRate, avgRR: summary.avgRR,
  pl: summary.totalPL, pf: summary.profitFactor, expectancy: summary.expectancy,
  maxDD: summary.maxDrawdown, planAdherence: summary.planAdherence,
  revenges: summary.revengeTradeCount, ruleBreaks: summary.ruleBreaks,
  overtradingScore: summary.overtradingScore, impulsiveScore: summary.impulsiveScore,
  bestSession: summary.bestSession, worstSession: summary.worstSession,
  sessions: summary.sessionStats, setups: summary.setupStats,
  emotions: summary.emotionStats, costOfMistakes: summary.costOfMistakes,
})}

TRADES (last ${compactTrades.length}): ${JSON.stringify(compactTrades)}

OUTPUT RULES:
- Return ONLY valid JSON. No explanation. No markdown. No backticks.
- All strings must be properly closed with double quotes.
- No newlines inside string values — use spaces instead.
- Keep each string value under 120 characters.

Return this EXACT JSON schema:
{"overallVerdict":"string","traderIdentity":"string","biggestLeak":"string","biggestEdge":"string","nonNegotiableRule":"string","focusRuleNext7Days":"string","mistakes":[{"title":"string","severity":"high","evidence":"string","impact":"string","action":"string"}],"patterns":[{"title":"string","evidence":"string","interpretation":"string"}],"strengths":[{"title":"string","evidence":"string","whyItMatters":"string"}],"weaknesses":[{"title":"string","evidence":"string","fix":"string"}],"humanBugs":{"revengeTrading":"string","fridayEffect":"string","equityCurveStress":"string","pipsVsPercentage":"string"},"actionPlan":{"stop":["string"],"reduce":["string"],"improve":["string"],"focus":["string"],"dailyChecklist":["string"],"hardRules":["string"],"habitsToKill":["string"],"habitsToBuild":["string"]},"costOfMistakes":{"totalEstimate":"string","revengeTrading":"string","ruleBreaking":"string","lowRRTrades":"string","badSession":"string"},"metrics":{"overtradingScore":0,"disciplineRating":0,"impulsiveEntryScore":0,"confidenceScore":0,"notes":"string"},"xauPipVerification":"string"}`;
};