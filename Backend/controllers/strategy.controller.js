import YahooFinance from 'yahoo-finance2';
import { getAIStrategy } from '../utils/gemini.js';
import dotenv from 'dotenv';

dotenv.config();

const yahooFinance = new YahooFinance();

const SECTOR_SYMBOLS = {
  technology:    ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
  banking:       ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS'],
  pharma:        ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'BIOCON.NS'],
  energy:        ['RELIANCE.NS', 'ONGC.NS', 'TATAPOWER.NS', 'ADANIGREEN.NS', 'GAIL.NS'],
  consumer:      ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS'],
  auto:          ['MARUTI.NS', 'TATAMOTORS.NS', 'BAJAJ-AUTO.NS', 'M&M.NS', 'EICHERMOT.NS'],
  realestate:    ['DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'PRESTIGE.NS', 'PHOENIXLTD.NS'],
  infrastructure:['LT.NS', 'NTPC.NS', 'POWERGRID.NS', 'BHEL.NS', 'IRCON.NS'],
  any:           ['HDFCBANK.NS', 'TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'SBIN.NS', 'SUNPHARMA.NS', 'LT.NS', 'MARUTI.NS'],
};

const NIFTY_INDICES = ['^NSEI', '^NSEBANK'];

async function fetchMomentum(symbol) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 35);

    const chart = await yahooFinance.chart(symbol, {
      period1: startDate.toISOString().split('T')[0],
      interval: '1d',
    }).catch(() => null);

    if (!chart?.quotes || chart.quotes.length < 5) return null;

    const quotes = chart.quotes.filter(q => q.close != null);
    const latest = quotes[quotes.length - 1];
    const oldest = quotes[0];
    const returnPct = (((latest.close - oldest.close) / oldest.close) * 100).toFixed(2);
    const avgVol = quotes.reduce((s, q) => s + (q.volume || 0), 0) / quotes.length;
    const volTrend = (latest.volume || 0) > avgVol ? 'Rising' : 'Falling';

    return { symbol, currentPrice: latest.close, returnPct: parseFloat(returnPct), volumeTrend: volTrend };
  } catch {
    return null;
  }
}

async function fetchQuoteSummary(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol).catch(() => null);
    if (!quote) return null;
    return {
      symbol,
      name: quote.longName || quote.shortName || symbol,
      price: quote.regularMarketPrice || 0,
      pe: quote.trailingPE || 0,
      marketCap: quote.marketCap || 0,
    };
  } catch {
    return null;
  }
}

export const generateStrategy = async (req, res) => {
  const { amount, riskLevel, sector, horizon } = req.body;

  if (!amount || !riskLevel) {
    return res.status(400).json({ error: 'amount and riskLevel are required.' });
  }

  const investAmount = parseFloat(amount);
  if (isNaN(investAmount) || investAmount <= 0) {
    return res.status(400).json({ error: 'Invalid investment amount.' });
  }

  const resolvedSector = (sector || 'any').toLowerCase();
  const symbols = SECTOR_SYMBOLS[resolvedSector] || SECTOR_SYMBOLS['any'];

  console.log(`[Strategy] ₹${investAmount}, risk=${riskLevel}, sector=${resolvedSector}, horizon=${horizon}`);

  const [indexSnapshots, momentumResults, quoteResults] = await Promise.all([
    Promise.all(NIFTY_INDICES.map(fetchMomentum)),
    Promise.all(symbols.map(fetchMomentum)),
    Promise.all(symbols.map(fetchQuoteSummary)),
  ]);

  const niftySnapshot = indexSnapshots[0];
  const bankNiftySnapshot = indexSnapshots[1];

  const stockData = symbols
    .map((sym, i) => ({ momentum: momentumResults[i], quote: quoteResults[i] }))
    .filter(d => d.momentum && d.quote)
    .map(d => ({
      symbol: d.momentum.symbol,
      name: d.quote.name,
      price: d.momentum.currentPrice,
      returnPct: d.momentum.returnPct,
      volumeTrend: d.momentum.volumeTrend,
      pe: d.quote.pe,
    }))
    .sort((a, b) => b.returnPct - a.returnPct);

  if (stockData.length === 0) {
    return res.status(503).json({ error: 'Unable to fetch market data. Try again shortly.' });
  }

  const allocationGuide = {
    conservative: { equity: 40, debt_gold: 45, cash: 15, maxStocks: 2 },
    moderate:     { equity: 65, debt_gold: 25, cash: 10, maxStocks: 3 },
    aggressive:   { equity: 85, debt_gold: 10, cash: 5,  maxStocks: 5 },
  };
  const guide = allocationGuide[riskLevel] || allocationGuide['moderate'];
  const horizonText = horizon === 'short' ? '3-6 months' : horizon === 'long' ? '3-5 years' : '1-2 years';
  const riskScore = riskLevel === 'conservative' ? 'Low' : riskLevel === 'aggressive' ? 'High' : 'Moderate';

  // Compact market context (fewer tokens)
  const topStocks = stockData.slice(0, 5);
  const mktLines = [
    `N50:${niftySnapshot?.returnPct ?? 'N/A'}% BNF:${bankNiftySnapshot?.returnPct ?? 'N/A'}%`,
    ...topStocks.map(s => `${s.symbol}|${s.name}|P:${s.price?.toFixed(0)}|30d:${s.returnPct}%|V:${s.volumeTrend}|PE:${s.pe?.toFixed(1) ?? 'N/A'}`),
  ].join('\n');

  const prompt = `You are an Indian equity strategist. Generate a JSON investment strategy.
Client: amount=Rs${investAmount}, risk=${riskLevel}(eq${guide.equity}%,safe${guide.debt_gold}%,cash${guide.cash}%), sector=${resolvedSector}, horizon=${horizonText}.
Live data:\n${mktLines}
Rules: pick max ${guide.maxStocks} stocks from above list; rest in LIQUIDBEES/GOLDBEES/debt; weights must sum to 100; cite real numbers in reasons.
Return ONLY valid JSON, no markdown, no extra text:
{"strategyTitle":"","summary":"","riskScore":"${riskScore}","projectedReturnRange":"","horizon":"${horizonText}","allocation":[{"name":"","displayName":"","type":"stock","weight":0,"amount":0,"reason":"","risk":"Low"}],"marketOutlook":"","keyRisks":["","",""],"rebalanceAdvice":""}`;

  try {
    const raw = await getAIStrategy(prompt);
    console.log('[Strategy] Raw Gemini response:', raw.substring(0, 200));

    const strategy = JSON.parse(raw);

    if (Array.isArray(strategy.allocation)) {
      strategy.allocation = strategy.allocation.map(item => ({
        ...item,
        amount: Math.round((item.weight / 100) * investAmount),
      }));
    }

    strategy.generatedAt = new Date().toISOString();
    strategy.inputParams = { amount: investAmount, riskLevel, sector: resolvedSector, horizon };
    strategy.marketSnapshot = {
      nifty50_30d: niftySnapshot?.returnPct,
      bankNifty_30d: bankNiftySnapshot?.returnPct,
      topMover: stockData[0]?.symbol,
      topMoverReturn: stockData[0]?.returnPct,
    };

    res.json(strategy);
  } catch (err) {
    console.error('[Strategy] Error:', err.message);
    res.status(500).json({ error: 'Strategy generation failed. Please try again.' });
  }
};
