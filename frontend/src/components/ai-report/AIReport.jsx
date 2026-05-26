import { useState } from "react";

// ─── Pure helper functions (no imports needed — self-contained) ────────────────

const INSTRUMENT_CONFIG = {
  EURUSD:{pipMultiplier:10000,lotValue:10,category:"forex"},
  GBPUSD:{pipMultiplier:10000,lotValue:10,category:"forex"},
  AUDUSD:{pipMultiplier:10000,lotValue:10,category:"forex"},
  NZDUSD:{pipMultiplier:10000,lotValue:10,category:"forex"},
  USDCAD:{pipMultiplier:10000,lotValue:10,category:"forex"},
  USDCHF:{pipMultiplier:10000,lotValue:10,category:"forex"},
  USDJPY:{pipMultiplier:100,lotValue:9.1,category:"forex"},
  EURJPY:{pipMultiplier:100,lotValue:9.1,category:"forex"},
  GBPJPY:{pipMultiplier:100,lotValue:9.1,category:"forex"},
  XAUUSD:{pipMultiplier:10,lotValue:100,category:"metal"},
  XAGUSD:{pipMultiplier:1000,lotValue:50,category:"metal"},
  BTCUSD:{pipMultiplier:1,lotValue:1,category:"crypto"},
  ETHUSD:{pipMultiplier:1,lotValue:1,category:"crypto"},
  US30:{pipMultiplier:1,lotValue:1,category:"index"},
  US500:{pipMultiplier:10,lotValue:1,category:"index"},
  NAS100:{pipMultiplier:10,lotValue:1,category:"index"},
};

const getInstrumentCfg = (pair) =>
  INSTRUMENT_CONFIG[pair?.toUpperCase()] || { pipMultiplier:10000, lotValue:10, category:"forex" };

// XAU pip: 1920.10→1920.20 = 1 pip (diff 0.10 × pipMult 10 = 1 pip)
const calcXAUPips = (entry, exit, direction) => {
  const diff = direction === "BUY" ? exit - entry : entry - exit;
  return parseFloat((diff * 10).toFixed(1));
};

const labelTrade = (t, allTrades) => {
  const labels = [];
  const idx = allTrades.indexOf(t);
  const prev = idx > 0 ? allTrades[idx - 1] : null;
  if (prev && !prev.isWin && t.date && prev.date) {
    const gap = (new Date(t.date) - new Date(prev.date)) / 60000;
    if (gap <= 15 && (t.lotSize || 0) > (prev.lotSize || 0)) labels.push("revenge_trade");
  }
  if (["FOMO","Anxious","Excited"].includes(t.emotionBefore)) labels.push("impulse_trade");
  if (["Greedy","Fearful","Frustrated"].includes(t.emotionBefore)) labels.push("high_emotion_trade");
  if (t.followedPlan === false) labels.push("rule_break");
  if (t.rr && t.rr < 0.5) labels.push("chasing_trade");
  if (t.isWin && t.followedPlan === true && t.rr && t.rr >= 1.5) labels.push("A+_setup");
  if (!t.isWin && t.followedPlan === false) labels.push("bad_execution");
  return labels;
};

const computeAdvancedSummary = (closedTrades) => {
  const t = closedTrades;
  if (!t.length) return null;
  const wins   = t.filter(x => x.isWin);
  const losses = t.filter(x => !x.isWin);
  const grossW = wins.reduce((a,x)=>a+x.pl,0);
  const grossL = Math.abs(losses.reduce((a,x)=>a+x.pl,0));
  const rrT    = t.filter(x=>x.rr);
  const avgRR  = rrT.length ? rrT.reduce((a,x)=>a+x.rr,0)/rrT.length : 0;
  const winPct = t.length ? wins.length/t.length : 0;
  const lossPct = 1 - winPct;
  const avgWin  = wins.length   ? grossW/wins.length   : 0;
  const avgLoss = losses.length ? grossL/losses.length : 0;
  const expectancy   = (winPct*avgWin)-(lossPct*avgLoss);
  const profitFactor = grossL>0 ? grossW/grossL : grossW>0 ? 999 : 0;

  let peak=0, equity=0, maxDD=0;
  t.forEach(x=>{
    equity+=x.pl;
    if(equity>peak)peak=equity;
    const dd=peak-equity;
    if(dd>maxDD)maxDD=dd;
  });

  const durations = t.filter(x=>x.date&&x.exitDate).map(x=>Math.abs(new Date(x.exitDate)-new Date(x.date))/60000);
  const avgDuration = durations.length ? durations.reduce((a,v)=>a+v,0)/durations.length : 0;

  const sessionMap={};
  t.forEach(x=>{
    const s=x.session||"Others";
    if(!sessionMap[s])sessionMap[s]={trades:0,wins:0,pl:0};
    sessionMap[s].trades++;sessionMap[s].pl+=x.pl;
    if(x.isWin)sessionMap[s].wins++;
  });
  const sessionStats=Object.entries(sessionMap).map(([s,d])=>({
    session:s,trades:d.trades,
    winRate:d.trades?`${(d.wins/d.trades*100).toFixed(1)}%`:"—",
    totalPL:d.pl.toFixed(2),
    expectancy:(d.pl/d.trades).toFixed(2),
  }));
  const sortedSessions=[...sessionStats].sort((a,b)=>parseFloat(b.totalPL)-parseFloat(a.totalPL));

  const setupMap={};
  t.forEach(x=>{
    const s=x.setupType||"Other";
    if(!setupMap[s])setupMap[s]={trades:0,wins:0,pl:0,rrs:[]};
    setupMap[s].trades++;setupMap[s].pl+=x.pl;
    if(x.isWin)setupMap[s].wins++;
    if(x.rr)setupMap[s].rrs.push(x.rr);
  });
  const setupStats=Object.entries(setupMap).map(([s,d])=>({
    setup:s,trades:d.trades,
    winRate:d.trades?`${(d.wins/d.trades*100).toFixed(1)}%`:"—",
    totalPL:d.pl.toFixed(2),
    avgRR:d.rrs.length?(d.rrs.reduce((a,v)=>a+v,0)/d.rrs.length).toFixed(2):"—",
  }));

  const emotionMap={};
  t.forEach(x=>{
    const e=x.emotionBefore||"Neutral";
    if(!emotionMap[e])emotionMap[e]={trades:0,wins:0,pl:0};
    emotionMap[e].trades++;emotionMap[e].pl+=x.pl;
    if(x.isWin)emotionMap[e].wins++;
  });
  const emotionStats=Object.entries(emotionMap).map(([e,d])=>({
    emotion:e,trades:d.trades,
    winRate:d.trades?`${(d.wins/d.trades*100).toFixed(1)}%`:"—",
    totalPL:d.pl.toFixed(2),
  }));

  const dowMap={};
  t.forEach(x=>{
    const dow=x.date?new Date(x.date).toLocaleDateString("en-US",{weekday:"short",timeZone:"Asia/Kolkata"}):"Unknown";
    if(!dowMap[dow])dowMap[dow]={trades:0,wins:0,pl:0};
    dowMap[dow].trades++;dowMap[dow].pl+=x.pl;
    if(x.isWin)dowMap[dow].wins++;
  });
  const dayStats=Object.entries(dowMap).map(([d,v])=>({
    day:d,trades:v.trades,totalPL:v.pl.toFixed(2),
    winRate:v.trades?`${(v.wins/v.trades*100).toFixed(1)}%`:"—",
  }));

  const pairMap={};
  t.forEach(x=>{
    const p=x.pair||"Unknown";
    if(!pairMap[p])pairMap[p]={trades:0,wins:0,pl:0,pips:0};
    pairMap[p].trades++;pairMap[p].pl+=x.pl;
    if(x.isWin)pairMap[p].wins++;
    if(x.entry&&x.exit){
      const cfg=getInstrumentCfg(p);
      const diff=x.direction==="BUY"?x.exit-x.entry:x.entry-x.exit;
      pairMap[p].pips+=diff*cfg.pipMultiplier;
    }
  });
  const pairStats=Object.entries(pairMap).map(([p,d])=>({
    pair:p,trades:d.trades,
    winRate:d.trades?`${(d.wins/d.trades*100).toFixed(1)}%`:"—",
    totalPL:d.pl.toFixed(2),
    totalPips:d.pips.toFixed(1),
  }));

  const revengeCount=t.filter((x,i)=>{
    if(i===0)return false;
    const prev=t[i-1];
    if(!prev||prev.isWin)return false;
    const gap=(new Date(x.date)-new Date(prev.date))/60000;
    return gap<=15&&(x.lotSize||0)>(prev.lotSize||0);
  }).length;

  const fridayTrades=t.filter(x=>x.date&&new Date(x.date).getDay()===5);
  const fridayWR=fridayTrades.length?(fridayTrades.filter(x=>x.isWin).length/fridayTrades.length*100).toFixed(1):null;

  const planAdherence=t.filter(x=>x.followedPlan===true).length/t.length*100;
  const ruleBreaks=t.filter(x=>x.followedPlan===false).length;
  const ruleBreakLoss=t.filter(x=>x.followedPlan===false&&!x.isWin).reduce((a,x)=>a+Math.abs(x.pl),0);

  const dateCounts={};
  t.forEach(x=>{if(x.date){const d=x.date.slice(0,10);dateCounts[d]=(dateCounts[d]||0)+1;}});
  const tradingDays=Object.keys(dateCounts).length||1;
  const avgTradesPerDay=t.length/tradingDays;
  const overtradingScore=Math.min(100,Math.round((avgTradesPerDay/5)*100));

  const impulsiveCount=t.filter(x=>["FOMO","Anxious","Excited"].includes(x.emotionBefore)).length;
  const impulsiveScore=Math.round(impulsiveCount/t.length*100);

  const costOfRevenge=t.filter((x,i)=>{if(i===0)return false;const p=t[i-1];return p&&!p.isWin&&(new Date(x.date)-new Date(p.date))/60000<=15&&(x.lotSize||0)>(p.lotSize||0)&&!x.isWin;}).reduce((a,x)=>a+Math.abs(x.pl),0);
  const costOfRuleBreak=ruleBreakLoss;
  const costOfLowRR=t.filter(x=>x.rr&&x.rr<1&&!x.isWin).reduce((a,x)=>a+Math.abs(x.pl),0);
  const costOfBadSession=sortedSessions.length?Math.abs(parseFloat(sortedSessions[sortedSessions.length-1]?.totalPL||0)):0;

  const xauTrades=t.filter(x=>(x.pair||"").toUpperCase()==="XAUUSD");
  const xauStats=xauTrades.length?{
    count:xauTrades.length,
    winRate:`${(xauTrades.filter(x=>x.isWin).length/xauTrades.length*100).toFixed(1)}%`,
    totalPL:xauTrades.reduce((a,x)=>a+x.pl,0).toFixed(2),
    totalPips:xauTrades.reduce((a,x)=>a+(x.entry&&x.exit?calcXAUPips(x.entry,x.exit,x.direction):0),0).toFixed(1),
    note:"1 pip XAUUSD = $0.10 price move. e.g. 1920.10→1920.20 = 1 pip. pipMultiplier=10.",
  }:null;

  const largestWin=Math.max(0,...t.map(x=>x.pl));
  const largestLoss=Math.min(0,...t.map(x=>x.pl));
  let maxWinStreak=0,maxLossStreak=0,curW=0,curL=0;
  t.forEach(x=>{
    if(x.isWin){curW++;curL=0;maxWinStreak=Math.max(maxWinStreak,curW);}
    else{curL++;curW=0;maxLossStreak=Math.max(maxLossStreak,curL);}
  });

  return {
    totalTrades:t.length,tradingDays,
    wins:wins.length,losses:losses.length,
    winRate:`${(winPct*100).toFixed(1)}%`,
    lossRate:`${(lossPct*100).toFixed(1)}%`,
    avgRR:avgRR.toFixed(2),
    avgWin:avgWin.toFixed(2),avgLoss:avgLoss.toFixed(2),
    grossProfit:grossW.toFixed(2),grossLoss:grossL.toFixed(2),
    profitFactor:grossL>0?profitFactor.toFixed(2):"∞",
    expectancy:expectancy.toFixed(2),
    maxDrawdown:maxDD.toFixed(2),
    largestWin:largestWin.toFixed(2),largestLoss:largestLoss.toFixed(2),
    maxWinStreak,maxLossStreak,
    avgDuration:avgDuration.toFixed(0),
    avgTradesPerDay:avgTradesPerDay.toFixed(1),
    overtradingScore,impulsiveScore,
    planAdherence:planAdherence.toFixed(1),ruleBreaks,
    revengeTradeCount:revengeCount,
    fridayWinRate:fridayWR,
    sessionStats,sortedSessions,
    bestSession:sortedSessions[0]?.session||"—",
    worstSession:sortedSessions[sortedSessions.length-1]?.session||"—",
    setupStats,emotionStats,dayStats,pairStats,
    costOfMistakes:{
      revenge:costOfRevenge.toFixed(2),
      ruleBreak:costOfRuleBreak.toFixed(2),
      lowRR:costOfLowRR.toFixed(2),
      badSession:costOfBadSession.toFixed(2),
      total:(costOfRevenge+costOfRuleBreak+costOfLowRR).toFixed(2),
    },
    xauStats,
    totalPL:t.reduce((a,x)=>a+x.pl,0).toFixed(2),
  };
};

const prepareAIData = (closedTrades) => {
  return closedTrades.slice(-100).map(t => {
    const labels = labelTrade(t, closedTrades);
    const cfg    = getInstrumentCfg(t.pair);
    const diff   = t.entry&&t.exit ? (t.direction==="BUY"?t.exit-t.entry:t.entry-t.exit) : 0;
    const pips   = diff*cfg.pipMultiplier;
    const pipNote = (t.pair||"").toUpperCase()==="XAUUSD"
      ? `XAU pip check: diff=${diff.toFixed(2)}, pips=${(diff*10).toFixed(1)} (1pip=$0.10 move, pipMult=10)`
      : undefined;
    return {
      pair:t.pair||"—",direction:t.direction||"—",
      session:t.session||"Others",
      date:t.date?new Date(t.date).toISOString().slice(0,16):"—",
      dayOfWeek:t.date?new Date(t.date).toLocaleDateString("en-US",{weekday:"short",timeZone:"Asia/Kolkata"}):"—",
      entry:t.entry??0,exit:t.exit??0,stopLoss:t.stopLoss??null,takeProfit:t.takeProfit??null,
      pips:parseFloat(pips.toFixed(1)),pipNote,
      rr:t.rr??null,lotSize:t.lotSize??null,pl:t.pl??0,isWin:!!t.isWin,
      emotionBefore:t.emotionBefore||"—",emotionAfter:t.emotionAfter||"—",
      setupType:t.setupType||"—",
      followedPlan:t.followedPlan??null,
      mistakeTags:t.mistakeTags||[],
      preAnalysis:!!t.preAnalysis,postReview:!!t.postReview,
      behaviorLabels:labels,
    };
  });
};

const cleanAIResponse = (text) =>
  text
    .replace(/```json\s*/gi,"")
    .replace(/```/g,"")
    .replace(/[\r\n]+/g," ")
    .replace(/\s{2,}/g," ")
    .trim();

const safeParseJSON = (text) => {
  try{return JSON.parse(text);}catch(_){}
  try{
    const fixed=text.replace(/:\s*"([^"\\]*(\\.[^"\\]*)*)$/,':"$1"');
    return JSON.parse(fixed);
  }catch(_){}
  try{
    const match=text.match(/\{[\s\S]*\}/);
    if(match)return JSON.parse(match[0]);
  }catch(_){}
  return null;
};

const buildPrompt = (summary, tradesData, coachMode) => {
  const coachPersona = {
    drill:"You are a brutally honest Senior Risk Manager at a Tier-1 Prop Firm. Prioritize mistakes ruthlessly. No sugarcoating. Every insight must be painful if it is true.",
    quant:"You are a Quantitative Trading Analyst. Focus on statistics, probabilities, standard deviation of returns, Sharpe ratio approximation, and expectancy math. Use precise numbers.",
    zen:"You are a trading performance coach focused on emotional discipline. Identify psychological patterns, emotional leaks, and mindset improvements. Be compassionate but precise.",
  }[coachMode] || "You are a professional trading performance coach.";

  const compactTrades = tradesData.slice(-50).map(t => ({
    p:t.pair,d:t.direction,s:t.session,dow:t.dayOfWeek,
    entry:t.entry,exit:t.exit,pips:t.pips,
    rr:t.rr,lot:t.lotSize,pl:t.pl,win:t.isWin,
    eb:t.emotionBefore,ea:t.emotionAfter,
    plan:t.followedPlan,setup:t.setupType,labels:t.behaviorLabels,
  }));

  return `${coachPersona}

XAU/USD PIP RULE (CRITICAL): 1 pip = $0.10 price move. 1920.10 to 1920.20 = 1 pip (not 10 pips). pipMultiplier=10.

SUMMARY: ${JSON.stringify({
  trades:summary.totalTrades,wr:summary.winRate,avgRR:summary.avgRR,
  pl:summary.totalPL,pf:summary.profitFactor,expectancy:summary.expectancy,
  maxDD:summary.maxDrawdown,planAdherence:summary.planAdherence,
  revenges:summary.revengeTradeCount,ruleBreaks:summary.ruleBreaks,
  overtradingScore:summary.overtradingScore,impulsiveScore:summary.impulsiveScore,
  bestSession:summary.bestSession,worstSession:summary.worstSession,
  sessions:summary.sessionStats,setups:summary.setupStats,
  emotions:summary.emotionStats,costOfMistakes:summary.costOfMistakes,
})}

TRADES (last ${compactTrades.length}): ${JSON.stringify(compactTrades)}

REQUIREMENTS:
- Detect revenge trading, Friday effect, equity curve stress, emotional leaks
- Find session-setup correlations and emotional leakage patterns
- Identify biggest leak and biggest edge with dollar evidence
- Label trader identity, provide personalized protocol only

OUTPUT RULES:
- Return ONLY valid JSON. No explanation. No markdown. No backticks.
- All strings must be properly closed with double quotes.
- No newlines inside string values — use spaces instead.
- Every array must be closed. Every object must be closed.
- Keep each string value under 120 characters.

Return this EXACT JSON schema and nothing else:
{"overallVerdict":"string","traderIdentity":"string","biggestLeak":"string","biggestEdge":"string","nonNegotiableRule":"string","focusRuleNext7Days":"string","mistakes":[{"title":"string","severity":"high","evidence":"string","impact":"string","action":"string"}],"patterns":[{"title":"string","evidence":"string","interpretation":"string"}],"strengths":[{"title":"string","evidence":"string","whyItMatters":"string"}],"weaknesses":[{"title":"string","evidence":"string","fix":"string"}],"humanBugs":{"revengeTrading":"string","fridayEffect":"string","equityCurveStress":"string","pipsVsPercentage":"string"},"actionPlan":{"stop":["string"],"reduce":["string"],"improve":["string"],"focus":["string"],"dailyChecklist":["string"],"hardRules":["string"],"habitsToKill":["string"],"habitsToBuild":["string"]},"costOfMistakes":{"totalEstimate":"string","revengeTrading":"string","ruleBreaking":"string","lowRRTrades":"string","badSession":"string"},"metrics":{"overtradingScore":0,"disciplineRating":0,"impulsiveEntryScore":0,"confidenceScore":0,"notes":"string"},"xauPipVerification":"string"}`;
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AIReport({ trades, theme: T }) {
  const [loading, setLoading]           = useState(false);
  const [aiResult, setAiResult]         = useState(null);
  const [prevResult, setPrevResult]     = useState(null);
  const [error, setError]               = useState(null);
  const [lastRun, setLastRun]           = useState(null);
  const [requestInFlight, setRequestInFlight] = useState(false);

  // API Key state
  const [apiKey, setApiKey]     = useState(() => {
    try{const enc=localStorage.getItem("tfb_ai_key");return enc?atob(enc):"";}catch{return "";}
  });
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey]   = useState(false);
  const [keyStatus, setKeyStatus] = useState(() => {
    try{return localStorage.getItem("tfb_ai_key")?"saved":"missing";}catch{return "missing";}
  });
  const [coachMode, setCoachMode]           = useState("drill");
  const [expandedSections, setExpandedSections] = useState({});

  const saveKey = () => {
    const trimmed = keyInput.trim();
    if(!trimmed)return;
    try{localStorage.setItem("tfb_ai_key",btoa(trimmed));}catch{}
    setApiKey(trimmed);setKeyInput("");setKeyStatus("updated");
    setTimeout(()=>setKeyStatus("saved"),3000);
  };
  const removeKey = () => {
    try{localStorage.removeItem("tfb_ai_key");}catch{}
    setApiKey("");setKeyInput("");setKeyStatus("missing");
  };
  const emergencyWipe = () => {
    try{localStorage.removeItem("tfb_ai_key");localStorage.removeItem("tfb_ai_result");}catch{}
    setApiKey("");setKeyInput("");setKeyStatus("missing");
    setAiResult(null);setPrevResult(null);
  };

  const toggleSection = (key) => setExpandedSections(p=>({...p,[key]:!p[key]}));

  const closedTrades = trades.filter(t=>t.exit);

  // ── Analyze ──────────────────────────────────────────────────────────────
  const analyzeTrades = async () => {
    if(requestInFlight)return;
    if(!apiKey){setError("API key is missing. Please save your Anthropic API key above.");return;}
    if(closedTrades.length===0){setError("No closed trades found. Add some trades first!");return;}
    if(closedTrades.length<5){setError("Minimum 5 closed trades required for meaningful analysis.");return;}

    setRequestInFlight(true);setLoading(true);setError(null);
    if(aiResult)setPrevResult(aiResult);
    setAiResult(null);

    const doFetch = async () => {
      const tradesData = prepareAIData(closedTrades);
      const summary    = computeAdvancedSummary(closedTrades);
      const prompt     = buildPrompt(summary, tradesData, coachMode);

      const response = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key":apiKey,
          "anthropic-version":"2023-06-01",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:3000,
          messages:[{role:"user",content:prompt}],
        }),
      });

      if(!response.ok){
        const errData=await response.json().catch(()=>({}));
        throw new Error(errData?.error?.message||`API error ${response.status}`);
      }

      const data    = await response.json();
      const rawText = data.content?.map(b=>b.text||"").join("").trim();
      const cleaned = cleanAIResponse(rawText);
      const parsed  = safeParseJSON(cleaned);

      if(!parsed){
        throw Object.assign(
          new Error("AI returned invalid JSON. The response may have been truncated. Try Re-Analyze."),
          {rawResponse:rawText}
        );
      }

      return {
        overallVerdict:    parsed.overallVerdict    ||"Analysis complete. See sections below.",
        traderIdentity:    parsed.traderIdentity    ||"unknown",
        biggestLeak:       parsed.biggestLeak       ||"Insufficient data.",
        biggestEdge:       parsed.biggestEdge       ||"Insufficient data.",
        nonNegotiableRule: parsed.nonNegotiableRule ||"Follow your trading plan on every trade.",
        focusRuleNext7Days:parsed.focusRuleNext7Days||"Trade only your best session this week.",
        mistakes:          Array.isArray(parsed.mistakes)  ?parsed.mistakes  :[],
        patterns:          Array.isArray(parsed.patterns)  ?parsed.patterns  :[],
        strengths:         Array.isArray(parsed.strengths) ?parsed.strengths :[],
        weaknesses:        Array.isArray(parsed.weaknesses)?parsed.weaknesses:[],
        humanBugs:         parsed.humanBugs  ||{},
        actionPlan:{
          stop:          Array.isArray(parsed.actionPlan?.stop)          ?parsed.actionPlan.stop          :[],
          reduce:        Array.isArray(parsed.actionPlan?.reduce)        ?parsed.actionPlan.reduce        :[],
          improve:       Array.isArray(parsed.actionPlan?.improve)       ?parsed.actionPlan.improve       :[],
          focus:         Array.isArray(parsed.actionPlan?.focus)         ?parsed.actionPlan.focus         :[],
          dailyChecklist:Array.isArray(parsed.actionPlan?.dailyChecklist)?parsed.actionPlan.dailyChecklist:[],
          hardRules:     Array.isArray(parsed.actionPlan?.hardRules)     ?parsed.actionPlan.hardRules     :[],
          habitsToKill:  Array.isArray(parsed.actionPlan?.habitsToKill)  ?parsed.actionPlan.habitsToKill  :[],
          habitsToBuild: Array.isArray(parsed.actionPlan?.habitsToBuild) ?parsed.actionPlan.habitsToBuild :[],
        },
        costOfMistakes:    parsed.costOfMistakes||{},
        metrics:           parsed.metrics       ||{},
        xauPipVerification:parsed.xauPipVerification||"No XAU/USD trades in dataset.",
        _parseStatus:"ok",
      };
    };

    try{
      let result;
      try{result=await doFetch();}
      catch(e1){
        await new Promise(r=>setTimeout(r,1500));
        result=await doFetch();
      }
      setAiResult(result);setPrevResult(null);setLastRun(new Date());
      try{localStorage.setItem("tfb_ai_result",JSON.stringify(result));}catch{}
    }catch(e){
      if(prevResult)setAiResult(prevResult);
      setError(e.message||"Something went wrong. Please retry.");
    }finally{
      setLoading(false);setRequestInFlight(false);
    }
  };

  const summary = computeAdvancedSummary(closedTrades);

  // ── Sub-components ────────────────────────────────────────────────────────
  const ColSection = ({id,icon,title,accent,children,defaultOpen=true})=>{
    const open=expandedSections[id]!==undefined?expandedSections[id]:defaultOpen;
    return(
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
        <div onClick={()=>toggleSection(id)} style={{display:"flex",alignItems:"center",gap:10,padding:"16px 20px",cursor:"pointer",borderBottom:open?`1px solid ${T.border}`:"none"}}>
          <div style={{width:32,height:32,borderRadius:9,background:`${accent}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
          <span style={{fontSize:15,fontWeight:700,color:T.text,flex:1}}>{title}</span>
          <span style={{color:T.textFaint,fontSize:12,transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s",display:"inline-block"}}>›</span>
        </div>
        {open&&<div style={{padding:"16px 20px"}}>{children}</div>}
      </div>
    );
  };

  const SevBadge=({s})=>{
    const c=s==="high"?["#ef4444","#2a0f0f"]:s==="medium"?["#f59e0b","#292215"]:["#22c55e","#0f2918"];
    return <span style={{background:c[1],color:c[0],border:`1px solid ${c[0]}44`,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,textTransform:"uppercase",letterSpacing:0.5,flexShrink:0}}>{s}</span>;
  };

  const MistakeCard=({m})=>(
    <div style={{background:T.cardAlt,border:`1px solid ${m.severity==="high"?"#ef444433":m.severity==="medium"?"#f59e0b33":"#22c55e33"}`,borderRadius:12,padding:"14px 16px",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
        <SevBadge s={m.severity}/><span style={{fontSize:14,fontWeight:700,color:T.text}}>{m.title}</span>
      </div>
      {m.evidence&&<div style={{fontSize:12,color:"#60a5fa",marginBottom:6}}>📊 Evidence: {m.evidence}</div>}
      {m.impact&&<div style={{fontSize:12,color:"#f87171",marginBottom:6}}>💸 Impact: {m.impact}</div>}
      {m.action&&<div style={{fontSize:12,color:"#86efac"}}>✅ Action: {m.action}</div>}
    </div>
  );

  const PatternCard=({p})=>(
    <div style={{background:T.cardAlt,border:"1px solid #60a5fa22",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
      <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:6}}>📊 {p.title}</div>
      {p.evidence&&<div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Evidence: {p.evidence}</div>}
      {p.interpretation&&<div style={{fontSize:12,color:"#a78bfa"}}>Insight: {p.interpretation}</div>}
    </div>
  );

  const StrengthCard=({s})=>(
    <div style={{background:T.cardAlt,border:"1px solid #22c55e22",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
      <div style={{fontSize:14,fontWeight:700,color:"#86efac",marginBottom:6}}>💪 {s.title}</div>
      {s.evidence&&<div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Evidence: {s.evidence}</div>}
      {s.whyItMatters&&<div style={{fontSize:12,color:"#6ee7b7"}}>Why it matters: {s.whyItMatters}</div>}
    </div>
  );

  const WeaknessCard=({w})=>(
    <div style={{background:T.cardAlt,border:"1px solid #f59e0b22",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
      <div style={{fontSize:14,fontWeight:700,color:"#fcd34d",marginBottom:6}}>⚠️ {w.title}</div>
      {w.evidence&&<div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Evidence: {w.evidence}</div>}
      {w.fix&&<div style={{fontSize:12,color:"#fb923c"}}>Fix: {w.fix}</div>}
    </div>
  );

  const BulletList=({items,color="#a78bfa"})=>(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {(items||[]).map((item,i)=>(
        <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{color,fontWeight:700,flexShrink:0,marginTop:1,fontSize:13}}>•</span>
          <span style={{fontSize:13,color:T.textMuted,lineHeight:1.7}}>{item}</span>
        </div>
      ))}
    </div>
  );

  const EmotionHeatmap=()=>{
    if(!summary?.emotionStats?.length)return null;
    return(
      <div style={{background:T.cardAlt,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>🧠 Emotion × Result Heatmap</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
          {summary.emotionStats.map(e=>{
            const pl=parseFloat(e.totalPL);
            const bg=pl>0?"#0d1f3c":pl<0?"#2a0f0f":T.hover;
            const col=pl>0?"#60a5fa":pl<0?"#ef4444":T.textFaint;
            return(
              <div key={e.emotion} style={{background:bg,border:`1px solid ${col}33`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:4}}>{e.emotion}</div>
                <div style={{fontSize:11,color:T.textFaint}}>{e.trades} trades · {e.winRate} WR</div>
                <div style={{fontSize:14,fontWeight:700,color:col,marginTop:4}}>{pl>=0?"+":""}{pl.toFixed(0)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const keyStatusDisplay={
    saved:{text:"✅ API Key Saved",color:"#22c55e"},
    missing:{text:"⚠️ API Key Missing",color:"#f59e0b"},
    updated:{text:"🔄 Key Updated Successfully",color:"#60a5fa"},
  }[keyStatus];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return(
    <div style={{padding:"20px 24px",width:"100%",boxSizing:"border-box",overflowY:"auto"}}>

      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:800,color:T.text,marginBottom:4}}>🤖 AI Trading Coach — Ultra Pro Max</div>
        <div style={{fontSize:13,color:T.textFaint}}>Behavioral analysis, mistake detection, pattern recognition, and personalized action plan powered by AI</div>
      </div>

      {/* API Key Card */}
      <div style={{background:T.card,border:"1px solid #7c3aed44",borderRadius:14,padding:"20px 22px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <span style={{fontSize:18}}>🔑</span>
          <span style={{fontSize:15,fontWeight:700,color:T.text}}>API Key Management</span>
          <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:keyStatusDisplay.color}}>{keyStatusDisplay.text}</span>
        </div>
        <div style={{fontSize:11,color:"#f59e0b",background:"#29210022",border:"1px solid #f59e0b33",borderRadius:8,padding:"8px 12px",marginBottom:14}}>
          🔒 Keys are stored locally on this device only. They are never sent to our servers. Use your own Anthropic API key for personalized AI analysis.
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
          <div style={{flex:1,minWidth:200,position:"relative"}}>
            <input
              type={showKey?"text":"password"}
              placeholder="Enter your Anthropic API key (sk-ant-...)"
              value={keyInput}
              onChange={e=>setKeyInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveKey()}
              style={{width:"100%",background:T.input,border:`1px solid ${T.border2}`,borderRadius:9,padding:"10px 40px 10px 12px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}
            />
            <button onClick={()=>setShowKey(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.textFaint,fontSize:16}}>
              {showKey?"🙈":"👁️"}
            </button>
          </div>
          <button onClick={saveKey} className="tfb-btn" style={{background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:9,padding:"10px 18px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
            💾 Save Key
          </button>
          {apiKey&&(
            <button onClick={removeKey} className="tfb-btn" style={{background:"#2a0f0f",border:"1px solid #ef444433",borderRadius:9,padding:"10px 14px",color:"#ef4444",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
              🗑 Remove Key
            </button>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <button onClick={emergencyWipe} style={{background:"none",border:"1px solid #ef444433",borderRadius:7,padding:"6px 12px",color:"#ef4444",fontSize:11,cursor:"pointer",fontWeight:600}}>
            ☢️ Emergency Wipe (clear all local AI data)
          </button>
          <span style={{fontSize:11,color:T.textFaintest}}>Wipes API key + cached reports instantly</span>
        </div>
      </div>

      {/* Coach Mode */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 20px",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>🎭 Coach Personality</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[
            {id:"drill",icon:"💢",label:"Drill Sergeant",desc:"Brutally honest, mistakes-first"},
            {id:"quant",icon:"📐",label:"Quant Analyst",desc:"Math, stats, probabilities"},
            {id:"zen",icon:"🧘",label:"Zen Master",desc:"Emotional balance & discipline"},
          ].map(m=>(
            <div key={m.id} onClick={()=>setCoachMode(m.id)} className="tfb-btn" style={{flex:1,minWidth:140,background:coachMode===m.id?"linear-gradient(135deg,#2d1b69,#1f1040)":T.cardAlt,border:`1px solid ${coachMode===m.id?"#7c3aed":T.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:coachMode===m.id?"#a78bfa":T.text}}>{m.label}</div>
              <div style={{fontSize:11,color:T.textFaint,marginTop:2}}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {summary&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>
            {[
              {l:"Total Trades",v:summary.totalTrades,c:"#60a5fa"},
              {l:"Win Rate",v:summary.winRate,c:parseFloat(summary.winRate)>=50?"#60a5fa":"#ef4444"},
              {l:"Avg R:R",v:summary.avgRR,c:"#f59e0b"},
              {l:"Total P&L",v:`$${summary.totalPL}`,c:parseFloat(summary.totalPL)>=0?"#60a5fa":"#ef4444"},
              {l:"Profit Factor",v:summary.profitFactor,c:parseFloat(summary.profitFactor)>=1?"#60a5fa":"#ef4444"},
              {l:"Expectancy",v:`$${summary.expectancy}`,c:parseFloat(summary.expectancy)>=0?"#22c55e":"#ef4444"},
              {l:"Max Drawdown",v:`$${summary.maxDrawdown}`,c:"#f87171"},
              {l:"Plan Adherence",v:`${summary.planAdherence}%`,c:parseFloat(summary.planAdherence)>=70?"#22c55e":"#f59e0b"},
            ].map(({l,v,c})=>(
              <div key={l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:T.textFaint,fontWeight:600,letterSpacing:0.5,marginBottom:4}}>{l}</div>
                <div style={{fontSize:16,fontWeight:700,color:c}}>{String(v)}</div>
              </div>
            ))}
          </div>

          {/* Behavioral Scores */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 20px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>🔬 Behavioral Risk Scores</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
              {[
                {l:"Overtrading Score",v:summary.overtradingScore,warn:60},
                {l:"Impulsive Entry",v:summary.impulsiveScore,warn:30},
                {l:"Revenge Trades",v:summary.revengeTradeCount,warn:2,raw:true},
                {l:"Rule Breaks",v:summary.ruleBreaks,warn:3,raw:true},
              ].map(({l,v,warn,raw})=>{
                const bad=v>warn;
                return(
                  <div key={l} style={{background:T.cardAlt,border:`1px solid ${bad?"#ef444433":T.border}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:11,color:T.textFaint,fontWeight:600,marginBottom:6}}>{l}</div>
                    {!raw&&<div style={{height:6,background:T.border,borderRadius:3,marginBottom:6}}>
                      <div style={{width:`${v}%`,height:"100%",background:bad?"#ef4444":"#22c55e",borderRadius:3,transition:"width 0.5s"}}></div>
                    </div>}
                    <div style={{fontSize:18,fontWeight:700,color:bad?"#ef4444":"#22c55e"}}>{raw?v:`${v}/100`}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost of Mistakes */}
          <div style={{background:"#2a0f0f",border:"1px solid #ef444433",borderRadius:14,padding:"16px 20px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:"#f87171",marginBottom:10}}>💸 Estimated Cost of Mistakes</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
              {[
                {l:"Revenge Trading",v:summary.costOfMistakes.revenge},
                {l:"Rule Breaking",v:summary.costOfMistakes.ruleBreak},
                {l:"Low RR Trades",v:summary.costOfMistakes.lowRR},
                {l:"Bad Session",v:summary.costOfMistakes.badSession},
                {l:"TOTAL LEAK",v:summary.costOfMistakes.total,bold:true},
              ].map(({l,v,bold})=>(
                <div key={l} style={{background:"#1a0808",borderRadius:9,padding:"10px 12px",border:`1px solid ${bold?"#ef4444":"#ef444422"}`}}>
                  <div style={{fontSize:10,color:"#f87171",fontWeight:600,marginBottom:3}}>{l}</div>
                  <div style={{fontSize:bold?20:16,fontWeight:700,color:"#fca5a5"}}>-${v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* XAU Pip Verification */}
          {summary.xauStats&&(
            <div style={{background:"#1a1500",border:"1px solid #fbbf2433",borderRadius:14,padding:"14px 18px",marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",marginBottom:8}}>🟡 XAU/USD Pip Calculator Verification</div>
              <div style={{fontSize:12,color:"#fde68a",lineHeight:1.8}}>
                <div>Trades: {summary.xauStats.count} · Win Rate: {summary.xauStats.winRate} · Total P&L: ${summary.xauStats.totalPL}</div>
                <div>Total Pips: {summary.xauStats.totalPips} pips</div>
                <div style={{color:"#fcd34d",fontSize:11,marginTop:4}}>⚠️ {summary.xauStats.note}</div>
                <div style={{fontSize:11,color:"#78716c",marginTop:4}}>Formula: diff × pipMultiplier(10) = pips. Example: 2000→2010 BUY = 10 USD diff × 10 = 100 pips.</div>
              </div>
            </div>
          )}

          {/* Session Breakdown */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 20px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>🌐 Session Breakdown</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
              {summary.sessionStats.map(s=>{
                const pl=parseFloat(s.totalPL);
                return(
                  <div key={s.session} style={{background:pl>=0?"#0d1f3c":"#2a0f0f",border:`1px solid ${pl>=0?"#60a5fa33":"#ef444433"}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:4}}>{s.session}</div>
                    <div style={{fontSize:11,color:T.textFaint}}>{s.trades} trades · {s.winRate} WR</div>
                    <div style={{fontSize:14,fontWeight:700,color:pl>=0?"#60a5fa":"#ef4444",marginTop:4}}>{pl>=0?"+":""}{pl.toFixed(2)}</div>
                    <div style={{fontSize:11,color:T.textFaintest,marginTop:2}}>Expectancy: ${s.expectancy}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <EmotionHeatmap/>
        </>
      )}

      {/* Analyze Button */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",marginBottom:20,textAlign:"center"}}>
        {!aiResult&&!loading&&(
          <>
            <div style={{fontSize:40,marginBottom:12}}>🧠</div>
            <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:6}}>
              {closedTrades.length===0?"No trades to analyze":closedTrades.length<5?"Need at least 5 trades for AI analysis":`Ready to deep-analyze ${Math.min(closedTrades.length,100)} trades`}
            </div>
            <div style={{fontSize:12,color:T.textFaint,marginBottom:20,maxWidth:440,margin:"0 auto 20px"}}>
              AI will detect behavioral bugs, hidden patterns, emotional leaks, XAU pip errors, and generate a personalized coaching protocol
            </div>
          </>
        )}
        {loading&&(
          <div style={{padding:"20px 0"}}>
            <div style={{fontSize:32,marginBottom:12,animation:"spin 1s linear infinite",display:"inline-block"}}>⚙️</div>
            <div style={{fontSize:15,color:"#60a5fa",fontWeight:600,marginBottom:6}}>Coaching in Progress…</div>
            <div style={{fontSize:12,color:T.textFaint}}>Analyzing sessions, emotions, behavioral bugs, and XAU pip data…</div>
          </div>
        )}
        <button onClick={analyzeTrades} disabled={loading||requestInFlight||closedTrades.length<5||!apiKey} className="tfb-btn"
          style={{background:(loading||closedTrades.length<5||!apiKey)?T.cardAlt:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",borderRadius:12,padding:"13px 32px",color:(loading||closedTrades.length<5||!apiKey)?T.textFaint:"#fff",fontSize:15,fontWeight:700,cursor:(loading||closedTrades.length<5||!apiKey)?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:8,boxShadow:(loading||closedTrades.length<5||!apiKey)?"none":"0 4px 20px #7c3aed55"}}>
          {loading?"⏳ Coaching in Progress…":aiResult?"🔄 Re-Analyze":"✨ Analyze with AI"}
        </button>
        {lastRun&&!loading&&<div style={{fontSize:11,color:T.textFaintest,marginTop:10}}>Last analyzed: {lastRun.toLocaleTimeString()}</div>}
      </div>

      {/* Error */}
      {error&&(
        <div style={{background:"#2a0f0f",border:"1px solid #ef444455",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:"#f87171"}}>Analysis Failed</div>
            <div style={{fontSize:12,color:"#ef4444",marginTop:2}}>{error}</div>
            {prevResult&&<div style={{fontSize:11,color:"#f59e0b",marginTop:4}}>Previous report is still visible below.</div>}
          </div>
          <button onClick={analyzeTrades} style={{background:"#ef444422",border:"1px solid #ef4444",borderRadius:8,padding:"7px 14px",color:"#f87171",cursor:"pointer",fontSize:12,fontWeight:700}}>Retry</button>
          <button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:16}}>✕</button>
        </div>
      )}

      {/* AI Result */}
      {aiResult&&(
        <div style={{animation:"slideRight 0.25s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text}}>📋 AI Coaching Report</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {aiResult.metrics?.confidenceScore!==undefined&&(
                <span style={{background:"#1e3a5f",color:"#60a5fa",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20}}>
                  Confidence: {aiResult.metrics.confidenceScore}/100
                </span>
              )}
              <span style={{background:"#7c3aed22",color:"#a78bfa",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20}}>AI Generated</span>
            </div>
          </div>

          {/* Verdict + Identity */}
          {(aiResult.overallVerdict||aiResult.traderIdentity)&&(
            <div style={{background:"linear-gradient(135deg,#1f1040,#0f0a2a)",border:"1px solid #7c3aed55",borderRadius:14,padding:"20px 22px",marginBottom:14}}>
              {aiResult.traderIdentity&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{background:"#7c3aed",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>🏷️ TRADER IDENTITY</span>
                  <span style={{fontSize:14,fontWeight:700,color:"#c4b5fd",textTransform:"capitalize"}}>{aiResult.traderIdentity}</span>
                </div>
              )}
              {aiResult.overallVerdict&&<div style={{fontSize:14,color:"#e2d9f3",lineHeight:1.7}}>{aiResult.overallVerdict}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
                {aiResult.biggestLeak&&(
                  <div style={{background:"#2a0f0f",border:"1px solid #ef444433",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:"#f87171",fontWeight:700,marginBottom:4}}>🚨 BIGGEST LEAK</div>
                    <div style={{fontSize:12,color:"#fca5a5"}}>{aiResult.biggestLeak}</div>
                  </div>
                )}
                {aiResult.biggestEdge&&(
                  <div style={{background:"#0f2918",border:"1px solid #22c55e33",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:"#86efac",fontWeight:700,marginBottom:4}}>💎 BIGGEST EDGE</div>
                    <div style={{fontSize:12,color:"#bbf7d0"}}>{aiResult.biggestEdge}</div>
                  </div>
                )}
                {aiResult.nonNegotiableRule&&(
                  <div style={{background:"#292215",border:"1px solid #f59e0b33",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:"#fbbf24",fontWeight:700,marginBottom:4}}>⚖️ NON-NEGOTIABLE RULE</div>
                    <div style={{fontSize:12,color:"#fde68a"}}>{aiResult.nonNegotiableRule}</div>
                  </div>
                )}
                {aiResult.focusRuleNext7Days&&(
                  <div style={{background:"#0a1f3c",border:"1px solid #3b82f633",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:"#60a5fa",fontWeight:700,marginBottom:4}}>🎯 FOCUS: NEXT 7 DAYS</div>
                    <div style={{fontSize:12,color:"#bfdbfe"}}>{aiResult.focusRuleNext7Days}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {aiResult.mistakes?.length>0&&(
            <ColSection id="mistakes" icon="📉" title={`Key Mistakes (${aiResult.mistakes.length})`} accent="#ef4444">
              {aiResult.mistakes.map((m,i)=><MistakeCard key={i} m={m}/>)}
            </ColSection>
          )}

          {aiResult.humanBugs&&(
            <ColSection id="humanbugs" icon="🕵️" title="Behavioral Bug Detection" accent="#f472b6">
              {[
                {k:"revengeTrading",label:"🔴 Revenge Trading Detector"},
                {k:"fridayEffect",label:"📅 Friday Effect Analysis"},
                {k:"equityCurveStress",label:"📉 Equity Curve Stress"},
                {k:"pipsVsPercentage",label:"🧠 Pips vs Percentage Mindset"},
              ].map(({k,label})=>aiResult.humanBugs[k]&&(
                <div key={k} style={{background:T.cardAlt,border:"1px solid #f472b622",borderRadius:12,padding:"12px 16px",marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f9a8d4",marginBottom:6}}>{label}</div>
                  <div style={{fontSize:12,color:T.textMuted,lineHeight:1.7}}>{aiResult.humanBugs[k]}</div>
                </div>
              ))}
            </ColSection>
          )}

          {aiResult.patterns?.length>0&&(
            <ColSection id="patterns" icon="📊" title="Hidden Patterns" accent="#60a5fa">
              {aiResult.patterns.map((p,i)=><PatternCard key={i} p={p}/>)}
            </ColSection>
          )}

          {aiResult.strengths?.length>0&&(
            <ColSection id="strengths" icon="💪" title="Strengths & Edge" accent="#22c55e">
              {aiResult.strengths.map((s,i)=><StrengthCard key={i} s={s}/>)}
            </ColSection>
          )}

          {aiResult.weaknesses?.length>0&&(
            <ColSection id="weaknesses" icon="⚠️" title="Weaknesses & Leaks" accent="#f59e0b">
              {aiResult.weaknesses.map((w,i)=><WeaknessCard key={i} w={w}/>)}
            </ColSection>
          )}

          {aiResult.actionPlan&&(
            <ColSection id="actionplan" icon="🎯" title="Personalized Action Protocol" accent="#7c3aed">
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
                {[
                  {key:"stop",icon:"🛑",label:"STOP Immediately",color:"#ef4444"},
                  {key:"reduce",icon:"📉",label:"REDUCE These Habits",color:"#f59e0b"},
                  {key:"improve",icon:"⬆️",label:"IMPROVE These Areas",color:"#60a5fa"},
                  {key:"focus",icon:"🎯",label:"FOCUS On These",color:"#22c55e"},
                  {key:"hardRules",icon:"⚖️",label:"3 HARD RULES",color:"#a78bfa"},
                  {key:"habitsToKill",icon:"❌",label:"HABITS TO KILL",color:"#f87171"},
                  {key:"habitsToBuild",icon:"✅",label:"HABITS TO BUILD",color:"#86efac"},
                ].map(({key,icon,label,color})=>aiResult.actionPlan[key]?.length>0&&(
                  <div key={key} style={{background:T.cardAlt,border:`1px solid ${color}22`,borderRadius:12,padding:"14px 16px"}}>
                    <div style={{fontSize:12,fontWeight:700,color,marginBottom:8}}>{icon} {label}</div>
                    <BulletList items={aiResult.actionPlan[key]} color={color}/>
                  </div>
                ))}
              </div>
              {aiResult.actionPlan.dailyChecklist?.length>0&&(
                <div style={{background:"#0a1f3c",border:"1px solid #3b82f633",borderRadius:12,padding:"16px",marginTop:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#60a5fa",marginBottom:10}}>📋 Daily Discipline Checklist</div>
                  {aiResult.actionPlan.dailyChecklist.map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #1e3a5f",fontSize:13,color:"#bfdbfe"}}>
                      <span style={{color:"#3b82f6",fontWeight:700}}>□</span>{item}
                    </div>
                  ))}
                </div>
              )}
            </ColSection>
          )}

          {aiResult.costOfMistakes&&(
            <ColSection id="costmistakes" icon="💸" title="AI Cost of Mistakes Analysis" accent="#ef4444" defaultOpen={false}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
                {Object.entries(aiResult.costOfMistakes).map(([k,v])=>(
                  <div key={k} style={{background:"#1a0808",border:"1px solid #ef444433",borderRadius:9,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:"#f87171",fontWeight:600,textTransform:"capitalize",marginBottom:3}}>{k.replace(/([A-Z])/g," $1").trim()}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fca5a5"}}>{v}</div>
                  </div>
                ))}
              </div>
            </ColSection>
          )}

          {aiResult.metrics&&(
            <ColSection id="metrics" icon="📊" title="AI Performance Metrics" accent="#8b5cf6" defaultOpen={false}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:10}}>
                {[
                  {l:"Overtrading Score",v:aiResult.metrics.overtradingScore},
                  {l:"Discipline Rating",v:aiResult.metrics.disciplineRating},
                  {l:"Impulsive Entry Score",v:aiResult.metrics.impulsiveEntryScore},
                  {l:"AI Confidence Score",v:aiResult.metrics.confidenceScore},
                ].map(({l,v})=>v!==undefined&&(
                  <div key={l} style={{background:T.cardAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:11,color:T.textFaint,fontWeight:600,marginBottom:6}}>{l}</div>
                    <div style={{height:5,background:T.border,borderRadius:3,marginBottom:6}}>
                      <div style={{width:`${v}%`,height:"100%",background:v>60?"#22c55e":v>30?"#f59e0b":"#ef4444",borderRadius:3}}></div>
                    </div>
                    <div style={{fontSize:18,fontWeight:700,color:T.text}}>{v}/100</div>
                  </div>
                ))}
              </div>
              {aiResult.metrics.notes&&<div style={{fontSize:12,color:T.textFaint,fontStyle:"italic"}}>{aiResult.metrics.notes}</div>}
            </ColSection>
          )}

          {aiResult.xauPipVerification&&(
            <div style={{background:"#1a1500",border:"1px solid #fbbf2433",borderRadius:12,padding:"14px 18px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:"#fbbf24",marginBottom:6}}>🟡 AI XAU/USD Pip Verification</div>
              <div style={{fontSize:12,color:"#fde68a"}}>{aiResult.xauPipVerification}</div>
            </div>
          )}

          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{fontSize:13,flexShrink:0}}>💡</span>
            <span style={{fontSize:12,color:T.textFaint,lineHeight:1.7}}>
              This report is AI-generated based on your trade history. Treat it as if your trading career depends on it — but always combine AI insights with your own judgment and market experience.
              Re-analyze after every 20–30 new trades for updated recommendations.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
