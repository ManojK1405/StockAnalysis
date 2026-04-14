import YahooFinance from 'yahoo-finance2';
import { analyzeStock } from '../utils/analysis.js';
import { fetchStockNews } from '../utils/news.js';
import { getNewsSentiment, getAIPredictionReasoning } from '../utils/gemini.js';
const yahooFinance = new YahooFinance();

export const getStockPrediction = async (req, res) => {
  let { symbol } = req.params;
  
  // Dynamically resolve symbol using Yahoo Finance search
  if (!symbol.toUpperCase().endsWith('.NS') && !symbol.toUpperCase().endsWith('.BO')) {
      try {
          const searchResult = await yahooFinance.search(symbol);
          if (searchResult && searchResult.quotes && searchResult.quotes.length > 0) {
              // Prefer exact matching prefix, then any Indian stock
              const exactMatch = searchResult.quotes.find(q => 
                  q.symbol === `${symbol.toUpperCase()}.NS` || 
                  q.symbol === `${symbol.toUpperCase()}.BO`
              );
              const anyIndianStock = searchResult.quotes.find(q => 
                  q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')
              );
              
              symbol = exactMatch?.symbol || anyIndianStock?.symbol || `${symbol.toUpperCase()}.NS`;
          } else {
              symbol = `${symbol.toUpperCase()}.NS`;
          }
      } catch (err) {
          console.error("Symbol search error:", err.message);
          symbol = `${symbol.toUpperCase()}.NS`;
      }
  } else {
      symbol = symbol.toUpperCase();
  }

  console.log(`--- Fetching Fresh Analysis for: ${symbol} ---`);

  try {
    // 1. Fetch Historical Data (2 years for better chart zooming)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 730);

    console.log(`Fetching chart data for ${symbol}...`);
    const chartResult = await yahooFinance.chart(symbol, {
      period1: startDate.toISOString().split('T')[0],
      interval: '1d'
    }).catch(err => {
      console.error("Yahoo Chart Error:", err.message);
      return null;
    });

    const result = chartResult?.quotes?.map(q => ({
       date: q.date,
       open: q.open,
       high: q.high,
       low: q.low,
       close: q.close,
       volume: q.volume
    })) || [];

    if (!result || result.length < 5) {
      return res.status(404).json({ error: 'Not enough historical data found for analysis.' });
    }

    // 2. Fetch Real News & Sentiment
    console.log(`Fetching news for ${symbol}...`);
    const news = await fetchStockNews(symbol).catch(err => {
      console.error("News Fetch Error:", err.message);
      return [];
    });
    
    const headlines = news.map(n => n.title);
    const sentiment = headlines.length > 0 ? await getNewsSentiment(headlines).catch(err => {
       console.error("Sentiment Error:", err.message);
       return 0;
    }) : 0;

    // 3. Perform Deterministic Analysis
    console.log(`Performing technical analysis...`);
    const analysis = analyzeStock(result, sentiment);
    analysis.symbol = symbol;
    analysis.chartData = result;
    analysis.news = news;

    // 4. Get AI Reasoning for the signals
    console.log(`Getting Gemini reasoning...`);
    const aiReasoningStr = await getAIPredictionReasoning(symbol, analysis.indicators, sentiment).catch(err => {
       console.error("Gemini Reasoning Error:", err.message);
       return "Market analysis suggests following current trends.";
    });
    
    const aiReasoningList = aiReasoningStr.split('\n').filter(r => r.trim()).map(r => r.replace(/^[*-]\s*/, ''));
    analysis.reasoning = [...new Set([...analysis.reasoning, ...aiReasoningList])];

    // 5. Fetch Real-time Quote
    console.log(`Fetching real-time quote for ${symbol}...`);
    const quote = await yahooFinance.quote(symbol).catch(err => {
       console.error("Yahoo Quote Error:", err.message);
       return null;
    });

    if (quote) {
      analysis.currentPrice = quote.regularMarketPrice || analysis.currentPrice;
      analysis.name = quote.longName || symbol;
      analysis.fundamentals = {
        marketCap: quote.marketCap || 0,
        peRatio: quote.trailingPE || quote.forwardPE || 0,
        dividendYield: quote.dividendYield || 0,
        beta: quote.beta || 0,
        eps: quote.trailingEps || 0,
        marketState: quote.marketState || 'N/A'
      };
    } else {
      analysis.fundamentals = { marketCap: 0, peRatio: 0, dividendYield: 0, beta: 0, eps: 0, marketState: 'N/A' };
    }

    // Assemble final structured response
    const finalResult = {
      ...analysis,
      fundamentals: {
        marketCap: quote?.marketCap || 0,
        peRatio: quote?.trailingPE || quote?.forwardPE || 0,
        dividendYield: quote?.dividendYield || 0,
        beta: quote?.beta || 0
      }
    };

    console.log(`Analysis complete for ${symbol}.`);
    res.json(finalResult);

  } catch (error) {
    console.error(`Prediction Controller Error for ${symbol}:`, error);
    res.status(500).json({ error: 'Failed to generate prediction. Please try again later.' });
  }
};
