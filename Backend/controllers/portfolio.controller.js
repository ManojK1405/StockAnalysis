import { PrismaClient } from '@prisma/client';
import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { isMarketOpen } from '../utils/marketStatus.js';
import http from 'http';
import https from 'https';

const ipv4Agent = new https.Agent({ family: 4 });

const prisma = new PrismaClient();
const yahooFinance = new YahooFinance({ 
    suppressNotices: ['yahooSurvey'],
    validation: { logErrors: false }
});

// Watchlist
export const getWatchlist = async (req, res) => {
  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: req.userId },
      include: { stock: true }
    });
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

export const addToWatchlist = async (req, res) => {
  const { symbol } = req.body;
  try {
    let stock = await prisma.stock.findUnique({ where: { symbol } });
    if (!stock) {
      // We might want to fetch initial data for the stock here
      stock = await prisma.stock.create({ data: { symbol } });
    }

    const item = await prisma.watchlist.upsert({
      where: { userId_stockId: { userId: req.userId, stockId: stock.id } },
      update: {},
      create: { userId: req.userId, stockId: stock.id }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

export const removeFromWatchlist = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.watchlist.delete({ where: { id } });
    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

// Portfolio
export const getPortfolio = async (req, res) => {
  const { mode = 'mock' } = req.query; // Default to mock mode
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (mode === 'live' && user && user.brokerType === 'zerodha' && user.brokerAccess) {
        try {
            const [holdingsRaw, positionsRaw] = await Promise.all([
               axios.get('https://api.kite.trade/portfolio/holdings', {
                 headers: { 'X-Kite-Version': '3', 'Authorization': `token ${user.brokerAccess}` }
               }),
               axios.get('https://api.kite.trade/portfolio/positions', {
                 headers: { 'X-Kite-Version': '3', 'Authorization': `token ${user.brokerAccess}` }
               })
            ]);

            const mergedMap = {};
            
            // Map live holdings
            if (holdingsRaw.data.data) {
                holdingsRaw.data.data.forEach(h => {
                   if (h.quantity === 0) return;
                   const sym = h.tradingsymbol + (h.exchange === 'BSE' ? '.BO' : '.NS');
                   if (!mergedMap[sym]) mergedMap[sym] = { quantity: 0, totalVal: 0, currentPrice: h.last_price };
                   mergedMap[sym].quantity += h.quantity;
                   mergedMap[sym].totalVal += (h.quantity * h.average_price);
                });
            }

            // Map live net day positions
            if (positionsRaw.data.data && positionsRaw.data.data.net) {
                positionsRaw.data.data.net.forEach(p => {
                   if (p.quantity === 0) return;
                   const sym = p.tradingsymbol + (p.exchange === 'BSE' ? '.BO' : '.NS');
                   if (!mergedMap[sym]) mergedMap[sym] = { quantity: 0, totalVal: 0, currentPrice: p.last_price };
                   mergedMap[sym].quantity += p.quantity;
                   mergedMap[sym].totalVal += (p.quantity * p.average_price);
                });
            }

            const livePortfolio = Object.entries(mergedMap).map(([symbol, data]) => {
                const totalCost = data.totalVal;
                const currentTotalValue = data.quantity * data.currentPrice;
                const pnl = currentTotalValue - totalCost;
                return {
                    id: `live-${symbol}`,
                    stockId: symbol,
                    stock: { symbol },
                    quantity: data.quantity,
                    avgPrice: totalCost / data.quantity,
                    totalCost: totalCost,
                    currentPrice: data.currentPrice,
                    pnl: pnl,
                    pnlPercent: (pnl / totalCost) * 100,
                    type: 'live'
                };
            });
            
            return res.json(livePortfolio);
        } catch (brokerErr) {
            console.error('Live fetch failed, falling back to mock:', brokerErr.message);
        }
    }

    // Mock Mode (default or fallback)
    const portfolio = await prisma.portfolioItem.findMany({
      where: { userId: req.userId },
      include: { stock: true }
    });

    const portfolioWithRealTime = await Promise.all(portfolio.map(async (item) => {
      try {
        const quote = await yahooFinance.quote(item.stock.symbol);
        const currentPrice = quote.regularMarketPrice;
        const currentTotalValue = currentPrice * item.quantity;
        const pnl = currentTotalValue - item.totalCost;
        const pnlPercent = (pnl / item.totalCost) * 100;

        return {
          ...item,
          currentPrice,
          pnl,
          pnlPercent,
          type: 'mock'
        };
      } catch (e) {
        return { ...item, type: 'mock' };
      }
    }));

    res.json(portfolioWithRealTime);
  } catch (error) {
    console.error('Get Portfolio Error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
};

export const addPortfolioItem = async (req, res) => {
  const { symbol, quantity, avgPrice } = req.body;
  try {
    let stock = await prisma.stock.findUnique({ where: { symbol } });
    if (!stock) {
      stock = await prisma.stock.create({ data: { symbol } });
    }

    const existingItem = await prisma.portfolioItem.findUnique({
      where: { userId_stockId: { userId: req.userId, stockId: stock.id } }
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const newTotalCost = existingItem.totalCost + (quantity * avgPrice);
      const newAvgPrice = newTotalCost / newQuantity;

      const updated = await prisma.portfolioItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          avgPrice: newAvgPrice,
          totalCost: newTotalCost
        }
      });
      return res.json(updated);
    }

    const item = await prisma.portfolioItem.create({
      data: {
        userId: req.userId,
        stockId: stock.id,
        quantity,
        avgPrice,
        totalCost: quantity * avgPrice
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to portfolio' });
  }
};

export const syncBroker = async (req, res) => {
  let { brokerType, apiKey, apiSecret, requestToken } = req.body;
  if (!apiKey) return res.status(401).json({ error: 'API Key is missing' });

  try {
    if (apiKey === 'PERSISTED_IN_DB') {
        const u = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!u || !u.brokerAccess) return res.status(401).json({ error: 'Stored session expired' });
        apiKey = u.brokerAccess;
    }

    let positions = [];
    let authenticatedAccessToken = null;

    if (brokerType === 'zerodha') {
      try {
        let accessToken = apiKey; // Default fallback to original "apiKey:accessToken" passed as apiKey
        
        // If a request token is provided, execute the OAuth handshake to get the real access token
        if (requestToken && apiSecret) {
            const crypto = (await import('crypto')).default;
            const checksum = crypto.createHash('sha256').update(apiKey + requestToken + apiSecret).digest('hex');
            
            const params = new URLSearchParams();
            params.append('api_key', apiKey);
            params.append('request_token', requestToken);
            params.append('checksum', checksum);

            const sessionResp = await axios.post('https://api.kite.trade/session/token', params, {
                headers: {
                    'X-Kite-Version': '3',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            // Construct the canonical string Zerodha expects: "apiKey:accessToken"
            accessToken = `${apiKey}:${sessionResp.data.data.access_token}`;
        }

        const [holdingsRaw, positionsRaw] = await Promise.all([
           axios.get('https://api.kite.trade/portfolio/holdings', {
             headers: { 'X-Kite-Version': '3', 'Authorization': `token ${accessToken}` }
           }),
           axios.get('https://api.kite.trade/portfolio/positions', {
             headers: { 'X-Kite-Version': '3', 'Authorization': `token ${accessToken}` }
           })
        ]);

        const holdings = holdingsRaw.data.data || [];
        const netPositions = positionsRaw.data.data?.net || [];

        const mergedMap = {};

        // Process Long-Term Holdings
        holdings.forEach(h => {
           if (h.quantity === 0) return;
           const sym = h.tradingsymbol + (h.exchange === 'BSE' ? '.BO' : '.NS');
           if (!mergedMap[sym]) mergedMap[sym] = { quantity: 0, totalVal: 0 };
           mergedMap[sym].quantity += h.quantity;
           mergedMap[sym].totalVal += (h.quantity * h.average_price);
        });

        // Process Live Intraday/Derivative Positions
        netPositions.forEach(p => {
           if (p.quantity === 0) return;
           const sym = p.tradingsymbol + (p.exchange === 'BSE' ? '.BO' : '.NS');
           if (!mergedMap[sym]) mergedMap[sym] = { quantity: 0, totalVal: 0 };
           mergedMap[sym].quantity += p.quantity;
           mergedMap[sym].totalVal += (p.quantity * p.average_price);
        });

        // Calculate blended averages for final database payload
        positions = Object.entries(mergedMap).map(([symbol, data]) => ({
           symbol: symbol,
           quantity: data.quantity,
           avgPrice: data.totalVal / data.quantity
        }));
        authenticatedAccessToken = accessToken; // Save token for client return
      } catch (err) {
        console.error('Zerodha Sync Error:', err.response?.data || err.message);
        throw new Error('Zerodha authentication failed. Check your API credentials and ensure the Request Token is fresh.');
      }
    } else if (brokerType === 'groww') {
      try {
        // Groww API Implementation - FORCED IPv4
        const response = await axios.get('https://api.groww.in/v1/holdings/user', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-API-SECRET': apiSecret,
            'X-API-VERSION': '1.0',
            'Accept': 'application/json'
          },
          httpsAgent: ipv4Agent
        });
        const holdings = response.data.holdings || response.data.data?.holdings || [];
        positions = holdings.map(h => ({
          symbol: h.symbol?.includes('.') ? h.symbol : `${h.symbol}.NS`,
          quantity: h.qty || h.quantity,
          avgPrice: h.avg_price || h.average_price
        }));
      } catch (err) {
        console.error('Groww Auth Fail Detail:', err.response?.data || err.message);
        throw new Error('Groww authentication failed. Invalid API credentials or session.');
      }
    } else {
      return res.status(400).json({ error: 'Unsupported broker type.' });
    }

    // Write validated Session Keys directly into the relational Postgres DB for the user
    await prisma.user.update({
      where: { id: req.userId },
      data: {
         brokerType: brokerType,
         brokerApiKey: apiKey,
         brokerApiSecret: apiSecret || null,
         brokerAccess: authenticatedAccessToken || apiKey
      }
    });

    res.json({ message: 'Live broker connected securely. Session preserved in DB.', synced: positions.length, accessToken: authenticatedAccessToken });
  } catch (error) {
    console.error('Broker Sync Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync broker' });
  }
};

export const executeStrategy = async (req, res) => {
  const { apiKey, apiSecret, brokerType = 'zerodha', trades } = req.body;
  if (!apiKey) return res.status(401).json({ error: 'Broker credentials (API Key/Token) are required.' });
  if (!trades || !Array.isArray(trades)) return res.status(400).json({ error: 'Invalid trades payload.' });

  try {
    if (isMarketOpen()) {
      const results = await processTradesImmediately(apiKey, apiSecret, brokerType, trades);
      return res.json({ 
        message: `Market is open. Execution via ${brokerType === 'zerodha' ? 'Zerodha' : 'Groww'} completed.`, 
        results 
      });
    } else {
      // Queue for later
      await prisma.queuedTrade.create({
        data: {
          user: { connect: { id: req.userId } },
          trades,
          brokerApiKey: apiKey,
          brokerApiSecret: apiSecret,
          brokerType,
          status: 'PENDING'
        }
      });
      return res.json({ 
        message: 'Market is currently closed (IST: 9:15 AM - 3:30 PM, Mon-Fri). Strategy has been queued and will execute automatically when the market opens.',
        isQueued: true
      });
    }
  } catch (error) {
    console.error('Execution Error:', error);
    res.status(500).json({ error: 'Failed to process strategy execution.' });
  }
};

// Helper to execute trades immediately
const processTradesImmediately = async (apiKey, apiSecret, brokerType, trades) => {
  const orderResults = [];
  for (const trade of trades) {
    if (!trade.symbol) continue;
    
    let price = trade.price;
    if (!price) {
      const quote = await yahooFinance.quote(trade.symbol).catch(() => null);
      price = quote?.regularMarketPrice;
    }
    
    if (!price) continue;
    const quantity = Math.floor(trade.amount / price);
    if (quantity < 1) continue;

    try {
      const symbolOnly = trade.symbol.split('.')[0];
      let orderResponse;

      if (brokerType === 'zerodha') {
        orderResponse = await axios.post('https://api.kite.trade/orders/regular', {
          tradingsymbol: symbolOnly,
          exchange: trade.symbol.endsWith('.BO') ? 'BSE' : 'NSE',
          transaction_type: 'BUY',
          order_type: 'MARKET',
          quantity: quantity,
          product: 'CNC',
          validity: 'DAY'
        }, {
          headers: {
            'X-Kite-Version': '3',
            'Authorization': `token ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      } else if (brokerType === 'groww') {
        // Groww API Order Placement
        orderResponse = await axios.post('https://api.groww.in/v1/trade/orders', {
          symbol: trade.symbol,
          qty: quantity,
          side: 'BUY',
          type: 'MARKET'
        }, {
          headers: {
            'X-API-Key': apiKey,
            'X-API-Secret': apiSecret,
            'Content-Type': 'application/json'
          }
        });
      }
      
      const orderId = brokerType === 'zerodha' ? orderResponse.data?.data?.order_id : orderResponse.data?.order_id;
      orderResults.push({ symbol: trade.symbol, quantity, status: 'SUCCESS', orderId });
    } catch (err) {
      orderResults.push({ symbol: trade.symbol, quantity, status: 'FAILED', error: err.response?.data?.message || err.message });
    }
  }
  return orderResults;
};

// Background processor export
export const processPendingQueue = async () => {
  if (!isMarketOpen()) return { message: 'Market is still closed.' };

  const pending = await prisma.queuedTrade.findMany({
    where: { status: 'PENDING' },
    take: 10 // process in batches
  });

  for (const item of pending) {
    try {
      console.log(`[Queue] Executing strategy ${item.id} for user ${item.userId} via ${item.brokerType}`);
      const results = await processTradesImmediately(item.brokerApiKey, item.brokerApiSecret, item.brokerType || 'zerodha', item.trades);
      
      const failed = results.filter(r => r.status === 'FAILED');
      await prisma.queuedTrade.update({
        where: { id: item.id },
        data: {
          status: failed.length === results.length ? 'FAILED' : 'EXECUTED',
          error: failed.length > 0 ? JSON.stringify(failed) : null
        }
      });
    } catch (err) {
      await prisma.queuedTrade.update({
        where: { id: item.id },
        data: { status: 'FAILED', error: err.message }
      });
    }
  }
};

export const getTradeQueue = async (req, res) => {
  try {
    const queue = await prisma.queuedTrade.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade queue' });
  }
};

export const retryTrade = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.queuedTrade.update({
      where: { id, userId: req.userId },
      data: { status: 'PENDING', error: null }
    });
    res.json({ message: 'Trade re-queued for execution' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retry trade' });
  }
};

export const dismissTrade = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.queuedTrade.delete({
      where: { id, userId: req.userId }
    });
    res.json({ message: 'Trade dismissed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dismiss trade' });
  }
};
