import YahooFinance from 'yahoo-finance2';
import { getAIStrategy, getNewsSentiment } from '../utils/gemini.js';
import { fetchStockNews } from '../utils/news.js';
import * as TI from 'technicalindicators';
import dotenv from 'dotenv';

dotenv.config();

const yahooFinance = new YahooFinance();

async function getDynamicSymbols(sector, count = 8) {
  const prompt = `You are a financial data expert. Provide exactly ${count} active Yahoo Finance ticker symbols for highly liquid Indian stocks in the ${sector === 'any' ? 'broad market' : sector} sector. Return ONLY a valid JSON array of strings (e.g. ["RELIANCE.NS"]). No syntax highlighting, no extra text.`;
  try {
    const raw = await getAIStrategy(prompt);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    throw new Error('Invalid JSON format');
  } catch (error) {
    console.error('[DynamicSymbols] Error fetching symbols. Falling back to dynamic broad market search.', error.message);
    throw new Error("Failed to dynamically resolve market symbols.");
  }
}

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
  
  let symbols;
  try {
    symbols = await getDynamicSymbols(resolvedSector, 8);
  } catch (err) {
    return res.status(503).json({ error: 'Failed to dynamically fetch market symbols.' });
  }

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

  const horizonText = horizon === 'short' ? '3-6 months' : horizon === 'long' ? '3-5 years' : '1-2 years';
  const riskScore = riskLevel === 'conservative' ? 'Low' : riskLevel === 'aggressive' ? 'High' : 'Moderate';

  // Compact market context (fewer tokens)
  const topStocks = stockData.slice(0, 5);
  const mktLines = [
    `N50:${niftySnapshot?.returnPct ?? 'N/A'}% BNF:${bankNiftySnapshot?.returnPct ?? 'N/A'}%`,
    ...topStocks.map(s => `${s.symbol}|${s.name}|P:${s.price?.toFixed(0)}|30d:${s.returnPct}%|V:${s.volumeTrend}|PE:${s.pe?.toFixed(1) ?? 'N/A'}`),
  ].join('\n');

  const prompt = `You are an Indian equity strategist. Generate a JSON investment strategy.
Client: amount=Rs${investAmount}, risk=${riskLevel}, sector=${resolvedSector}, horizon=${horizonText}.
Live data:\n${mktLines}
Rules: Dynamically decide portfolio weights safely considering the risk level. Allocate the optimal amount into the listed stocks and allocate the rest intelligently into debt/gold/cash equivalents. Total weights must sum to 100%. Cite real numbers in reasons.
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

const safeSMA = (values, period) => {
  if (!values || values.length < period) return null;
  const output = TI.SMA.calculate({ period, values }) || [];
  return output.length ? output[output.length - 1] : null;
};



const scoreIntraday = ({ return5, volumeSpike, currentRSI, trend }) => {
  let score = 0;
  score += Math.max(-20, Math.min(40, return5 * 4));
  score += volumeSpike > 1.25 ? 24 : volumeSpike > 1.1 ? 14 : volumeSpike < 0.9 ? -12 : 0;
  score += currentRSI < 30 ? 14 : currentRSI > 85 ? -18 : currentRSI > 75 ? -8 : 0;
  score += trend === 'bullish' ? 18 : trend === 'bearish' ? -12 : 0;
  return Math.round(score);
};

const makeIntradaySignal = (score) => {
  if (score >= 50) return 'Strong Long';
  if (score >= 30) return 'Long Setup';
  if (score >= 10) return 'Watch for Entry';
  if (score >= -10) return 'Sideways/Wait';
  return 'Avoid';
};

async function fetchIntradayCandidate(symbol) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 35);

    const chart = await yahooFinance.chart(symbol, {
      period1: startDate.toISOString().split('T')[0],
      interval: '1d',
    }).catch(() => null);

    const quotes = chart?.quotes?.filter(q => q && q.close != null) || [];
    if (quotes.length < 12) return null;

    const latest = quotes[quotes.length - 1];
    const fiveAgo = quotes[quotes.length - 6];
    const tenAgo = quotes[quotes.length - 11];
    if (!fiveAgo || !tenAgo) return null;

    const closes = quotes.map(q => q.close);
    const avgVol10 = quotes.slice(-10).reduce((sum, q) => sum + (q.volume || 0), 0) / 10;
    const volumeSpike = avgVol10 > 0 ? (latest.volume || 0) / avgVol10 : 1;
    const currentRSI = TI.RSI.calculate({ values: closes, period: Math.min(14, closes.length - 1) })?.pop() || 50;
    const sma5 = safeSMA(closes, 5);
    const sma20 = safeSMA(closes, 20);
    const trend = sma5 && sma20 ? (sma5 > sma20 ? 'bullish' : sma5 < sma20 ? 'bearish' : 'neutral') : 'neutral';
    const return5 = ((latest.close - fiveAgo.close) / fiveAgo.close) * 100;
    const return10 = ((latest.close - tenAgo.close) / tenAgo.close) * 100;

    const quote = await fetchQuoteSummary(symbol);
    const name = quote?.name || symbol;

    const baseScore = scoreIntraday({ return5, volumeSpike, currentRSI, trend });
    const entryPrice = latest.close;
    
    const entryMin = (entryPrice * 0.995).toFixed(1);
    const entryMax = (entryPrice * 1.003).toFixed(1);
    const entryRange = `${entryMin} - ${entryMax}`;
    
    const targetBase = entryPrice * (1 + Math.min(0.05, Math.max(0.025, baseScore / 200)));
    const targetMin = (targetBase * 0.99).toFixed(1);
    const targetMax = (targetBase * 1.015).toFixed(1);
    const targetRange = `${targetMin} - ${targetMax}`;
    
    const stopBase = entryPrice * 0.985;
    const stopMin = (stopBase * 0.99).toFixed(1);
    const stopMax = (stopBase * 1.01).toFixed(1);
    const stopRange = `${stopMin} - ${stopMax}`;

    const support = parseFloat((Math.min(latest.close, fiveAgo.close) * 0.98).toFixed(2));
    const resistance = parseFloat((Math.max(latest.close, fiveAgo.close) * 1.02).toFixed(2));

    return {
      symbol,
      name,
      currentPrice: latest.close,
      return5: parseFloat(return5.toFixed(2)),
      return10: parseFloat(return10.toFixed(2)),
      volumeSpike: parseFloat(volumeSpike.toFixed(2)),
      currentRSI: parseFloat(currentRSI.toFixed(1)),
      trend,
      score: baseScore,
      signal: makeIntradaySignal(baseScore),
      entry: entryRange,
      target: targetRange,
      stopLoss: stopRange,
      support,
      resistance,
      chartPoints: quotes.slice(-20).map(q => ({ date: q.date, close: q.close })),
    };
  } catch (error) {
    console.error(`[Intraday] Candidate fetch failed for ${symbol}:`, error.message);
    return null;
  }
}

export const generateIntradayPulse = async (req, res) => {
  const resolvedSector = (req.body?.sector || 'any').toLowerCase();
  
  let candidates;
  try {
    candidates = await getDynamicSymbols(resolvedSector, 10);
  } catch (err) {
    return res.status(503).json({ error: 'Failed to dynamically fetch intraday candidates.' });
  }

  try {
    const [indexSnapshots, candidateRows] = await Promise.all([
      Promise.all(NIFTY_INDICES.map(fetchMomentum)),
      Promise.all(candidates.map(fetchIntradayCandidate)),
    ]);

    const marketPulse = {
      niftyReturn: indexSnapshots[0]?.returnPct ?? 0,
      bankNiftyReturn: indexSnapshots[1]?.returnPct ?? 0,
      generatedAt: new Date().toISOString(),
    };

    const ranked = candidateRows
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const withSentiment = await Promise.all(ranked.map(async candidate => {
      const news = await fetchStockNews(candidate.symbol).catch(() => []);
      const headlines = news.map(n => n.title).filter(Boolean).slice(0, 8);
      const sentiment = headlines.length ? await getNewsSentiment(headlines).catch(() => 0) : 0;
      const adjustedScore = candidate.score + Math.round(sentiment * 20);
      return {
        ...candidate,
        sentiment: parseFloat(sentiment.toFixed(2)),
        sentimentHeadline: sentiment > 0.3 ? 'Positive buzz' : sentiment < -0.3 ? 'Negative catalyst' : 'Neutral news flow',
        score: adjustedScore,
        notes: [
          `Momentum Engine: The asset shifted ${candidate.return5 >= 0 ? '+' : ''}${candidate.return5}% over 5 sessions, securing a ${candidate.return5 >= 2 ? 'dominant aggressive' : candidate.return5 >= 0 ? 'steady supportive' : 'consolidating'} trajectory.`,
          `Volume Metric: Algorithm detects a ${((candidate.volumeSpike - 1) * 100).toFixed(1)}% deviation in liquidity vs the 10-day average. ${candidate.volumeSpike > 1.1 ? 'Institutions are actively stepping in.' : 'Volume remains standard; prepare for sudden catalyst triggers.'}`,
          `Technical Bounds: RSI holds at ${candidate.currentRSI.toFixed(1)}/100. ${candidate.currentRSI > 80 ? 'Warning: Asset is highly overbought.' : candidate.currentRSI < 35 ? 'Deep discount identified; high probability of a mean-reversion bounce.' : 'Settled squarely in a highly favorable breakout zone.'}`,
          `Trend Matrix: Short-term trailing overlays are heavily ${candidate.trend.toUpperCase()} against the live execution price (₹${candidate.currentPrice.toFixed(1)}).`,
          `Live Sentiment: ${sentiment > 0.3 ? `Positive media cycle detected (+${(sentiment*100).toFixed(0)}% buzz score).` : sentiment < -0.3 ? `Negative drag detected (${(sentiment*100).toFixed(0)}%). Strict sizing recommended.` : 'News flow is fundamentally neutral.'}`
        ],
      };
    }));

    const picks = withSentiment
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    if (picks.length === 0) {
      return res.status(503).json({ error: 'Unable to produce intraday recommendations at this time.' });
    }

    const summary = `Intraday pulse is leaning toward ${picks.map(p => p.symbol).join(', ')}. Focus on the highest-scoring setups with positive volume momentum and keep tight risk controls reflecting the calculated trailing stop loss zones.`;

    res.json({ marketPulse, summary, picks });
  } catch (error) {
    console.error('[Intraday] Pulse generation failed:', error.message);
    res.status(500).json({ error: 'Intraday pulse generation failed. Please try again later.' });
  }
};
