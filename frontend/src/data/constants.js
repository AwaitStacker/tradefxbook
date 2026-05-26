// src/data/constants.js

export const INSTRUMENT_CONFIG = {
  EURUSD: { pipMultiplier: 10000, lotValue: 10,  category: "forex"  },
  GBPUSD: { pipMultiplier: 10000, lotValue: 10,  category: "forex"  },
  AUDUSD: { pipMultiplier: 10000, lotValue: 10,  category: "forex"  },
  NZDUSD: { pipMultiplier: 10000, lotValue: 10,  category: "forex"  },
  USDCAD: { pipMultiplier: 10000, lotValue: 10,  category: "forex"  },
  USDCHF: { pipMultiplier: 10000, lotValue: 10,  category: "forex"  },
  USDJPY: { pipMultiplier: 100,   lotValue: 9.1, category: "forex"  },
  EURJPY: { pipMultiplier: 100,   lotValue: 9.1, category: "forex"  },
  GBPJPY: { pipMultiplier: 100,   lotValue: 9.1, category: "forex"  },
  // XAUUSD: 1 pip = $0.10 price move (e.g. 1920.10 → 1920.20 = 1 pip)
  XAUUSD: { pipMultiplier: 10,    lotValue: 100, category: "metal"  },
  XAGUSD: { pipMultiplier: 1000,  lotValue: 50,  category: "metal"  },
  BTCUSD: { pipMultiplier: 1,     lotValue: 1,   category: "crypto" },
  ETHUSD: { pipMultiplier: 1,     lotValue: 1,   category: "crypto" },
  US30:   { pipMultiplier: 1,     lotValue: 1,   category: "index"  },
  US500:  { pipMultiplier: 10,    lotValue: 1,   category: "index"  },
  NAS100: { pipMultiplier: 10,    lotValue: 1,   category: "index"  },
};

export const PAIRS = [
  "XAUUSD","EURUSD","GBPUSD","USDJPY","AUDUSD",
  "USDCAD","USDCHF","NZDUSD","BTCUSD","ETHUSD",
];

export const SETUPS = [
  "Breakout","Reversal","Trend Follow","Scalp","News Trade",
  "Range","Support/Resistance","VWAP","Other",
];

export const MARKETS = ["Trending","Ranging","Volatile","Quiet","News Driven"];

export const EMOTIONS = [
  "Calm","Confident","Anxious","FOMO","Greedy",
  "Fearful","Neutral","Excited","Frustrated",
];

export const PAIR_EMOJI = {
  XAUUSD:"🟡", BTCUSD:"🟠", ETHUSD:"💎",
  EURUSD:"🇪🇺", GBPUSD:"🇬🇧", USDJPY:"🇯🇵",
  AUDUSD:"🇦🇺", USDCAD:"🇨🇦", USDCHF:"🇨🇭", NZDUSD:"🇳🇿",
};

export const CHECKLIST_ITEMS = [
  "Checked higher timeframe",
  "Risk within limits",
  "Fits my trading plan",
  "Key levels identified",
  "Economic calendar checked",
];