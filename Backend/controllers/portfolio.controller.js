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
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (mode === 'live' && user.brokerType === 'zerodha' && user.brokerAccess) {
        try {
            const [holdingsRaw, positionsRaw, marginsRaw] = await Promise.all([
               axios.get('https://api.kite.trade/portfolio/holdings', {
                 headers: { 'X-Kite-Version': '3', 'Authorization': `token ${user.brokerAccess}` }
               }),
               axios.get('https://api.kite.trade/portfolio/positions', {
                 headers: { 'X-Kite-Version': '3', 'Authorization': `token ${user.brokerAccess}` }
               }),
               axios.get('https://api.kite.trade/user/margins', {
                 headers: { 'X-Kite-Version': '3', 'Authorization': `token ${user.brokerAccess}` }
               })
            ]);

            const liveBalance = marginsRaw.data?.data?.equity?.available?.cash || 0;

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
            
            return res.json({
                items: livePortfolio,
                mockBalance: liveBalance,
                liveBalance: liveBalance,
                autoPilot: user.autoPilot,
                tradingMode: user.tradingMode
            });
        } catch (brokerErr) {
            console.error('Live fetch failed, falling back to mock:', brokerErr.message);
        }
    }

    // Mock Mode (default or fallback)
    const portfolio = await prisma.portfolioItem.findMany({
      where: { userId: req.userId },
      include: { 
          stock: {
              select: { symbol: true, sector: true }
          } 
      }
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

    res.json({
      items: portfolioWithRealTime,
      mockBalance: user.mockBalance,
      autoPilot: user.autoPilot,
      tradingMode: user.tradingMode
    });
  } catch (error) {
    console.error('Get Portfolio Error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
};

export const addMockBalance = async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { mockBalance: { increment: parseFloat(amount) } }
    });
    res.json({ message: 'Balance updated', balance: user.mockBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
};

export const toggleAutoPilot = async (req, res) => {
  const { enabled, mode = 'mock' } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { 
        autoPilot: enabled,
        tradingMode: mode 
      }
    });
    res.json({ 
      message: `EquiTrade ${enabled ? 'Enabled' : 'Disabled'}`, 
      autoPilot: user.autoPilot,
      tradingMode: user.tradingMode
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle AutoPilot' });
  }
};

export const setTradingMode = async (req, res) => {
    const { mode } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { tradingMode: mode }
        });
        res.json({ message: `Switched to ${mode} mode`, mode: user.tradingMode });
    } catch (e) {
        res.status(500).json({ error: 'Failed to switch mode' });
    }
};

export const buyMockStock = async (req, res) => {
  const { symbol, quantity, price } = req.body;
  const totalCost = quantity * price;

  try {
    if (!isMarketOpen()) {
        await prisma.queuedTrade.create({
            data: {
                userId: req.userId,
                trades: [{ symbol, quantity, price, action: 'BUY' }],
                status: 'PENDING'
            }
        });
        return res.json({ message: 'Market is closed. Order has been scheduled for market open.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.mockBalance < totalCost) {
      return res.status(400).json({ error: 'Insufficient mock balance' });
    }

    let stock = await prisma.stock.findUnique({ where: { symbol } });
    if (!stock) stock = await prisma.stock.create({ data: { symbol } });

    // Transactional update: deduct balance and add portfolio item
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId },
        data: { mockBalance: { decrement: totalCost } }
      }),
      prisma.portfolioItem.upsert({
        where: { userId_stockId: { userId: req.userId, stockId: stock.id } },
        update: {
          quantity: { increment: quantity },
          totalCost: { increment: totalCost },
          avgPrice: { set: 0 } // Re-calculated after update in next step or via DB trigger
        },
        create: {
          userId: req.userId,
          stockId: stock.id,
          quantity,
          avgPrice: price,
          totalCost
        }
      })
    ]);

    // Re-calculate avgPrice (simplified)
    const updatedItem = await prisma.portfolioItem.findUnique({
      where: { userId_stockId: { userId: req.userId, stockId: stock.id } }
    });
    await prisma.portfolioItem.update({
      where: { id: updatedItem.id },
      data: { avgPrice: updatedItem.totalCost / updatedItem.quantity }
    });

    res.json({ message: 'Order executed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute buy order' });
  }
};

export const sellMockStock = async (req, res) => {
  const { symbol, quantity, price } = req.body;
  try {
    if (!isMarketOpen()) {
        await prisma.queuedTrade.create({
            data: {
                userId: req.userId,
                trades: [{ symbol, quantity, price, action: 'SELL' }],
                status: 'PENDING'
            }
        });
        return res.json({ message: 'Market is closed. Sale has been scheduled for market open.' });
    }

    let stock = await prisma.stock.findUnique({ where: { symbol } });
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    const item = await prisma.portfolioItem.findUnique({
      where: { userId_stockId: { userId: req.userId, stockId: stock.id } }
    });

    if (!item || item.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity to sell' });
    }

    const sellProceeds = quantity * price;
    const costOfGoodsSold = (item.totalCost / item.quantity) * quantity;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId },
        data: { mockBalance: { increment: sellProceeds } }
      }),
      item.quantity === quantity 
        ? prisma.portfolioItem.delete({ where: { id: item.id } })
        : prisma.portfolioItem.update({
            where: { id: item.id },
            data: {
              quantity: { decrement: quantity },
              totalCost: { decrement: costOfGoodsSold }
            }
          })
    ]);

    res.json({ message: 'Sale executed successfully', proceeds: sellProceeds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute sell order' });
  }
};

export const skipTrade = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.queuedTrade.update({
      where: { id, userId: req.userId },
      data: { status: 'SKIPPED' }
    });
    res.json({ message: 'Order skipped' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to skip order' });
  }
};

export const getTradeLogs = async (req, res) => {
  try {
    const logs = await prisma.tradeLog.findMany({
      where: { userId: req.userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade logs' });
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

  let expiryDate = null;
  let positions = [];
  let authenticatedAccessToken = null;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    let rawApiKey = apiKey;
    let accessToken = null;

    if (apiKey === 'PERSISTED_IN_DB') {
        if (!user || !user.brokerApiKey) return res.status(401).json({ error: 'No stored credentials' });
        rawApiKey = user.brokerApiKey;
        accessToken = user.brokerAccess;
    }

    if (brokerType === 'zerodha') {
      try {
        const now = new Date();

        if (requestToken) {
            // STEP 1: Exchange Request Token for a reusable Access Token
            const secretToUse = apiSecret || user?.brokerApiSecret;
            if (!secretToUse) throw new Error('API Secret is required for first-time handshake.');

            const crypto = (await import('crypto')).default;
            const checksum = crypto.createHash('sha256').update(rawApiKey + requestToken + secretToUse).digest('hex');

            const params = new URLSearchParams();
            params.append('api_key', rawApiKey);
            params.append('request_token', requestToken);
            params.append('checksum', checksum);

            const sessionResp = await axios.post('https://api.kite.trade/session/token', params, {
                headers: { 'X-Kite-Version': '3', 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            // Store the Access Token (format: apiKey:accessToken)
            accessToken = `${rawApiKey}:${sessionResp.data.data.access_token}`;
            authenticatedAccessToken = accessToken; // Mark for DB persistence

            // Calculate Expiry: Zerodha sessions expire at 06:00 AM IST (00:30 UTC)
            expiryDate = new Date();
            expiryDate.setUTCHours(0, 30, 0, 0);
            if (now.getUTCHours() > 0 || (now.getUTCHours() === 0 && now.getUTCMinutes() >= 30)) {
                expiryDate.setUTCDate(expiryDate.getUTCDate() + 1);
            }
            console.log('[Zerodha] Handshake SUCCESS. Storing reusable Access Token. Expiry:', expiryDate);
        } else if (user?.brokerAccess && (!user?.brokerAccessExpiry || user.brokerAccessExpiry > now)) {
            // STEP 2: Reuse stored Access Token (The "Store once, use all day" logic)
            console.log('[Zerodha] Attempting session reuse for user:', user.id);
            try {
                await axios.get('https://api.kite.trade/user/margins', {
                    headers: { 'X-Kite-Version': '3', 'Authorization': `token ${user.brokerAccess}` }
                });
                accessToken = user.brokerAccess;
                console.log('[Zerodha] Stored Access Token is still valid. Reusing session.');
            } catch (err) {
                console.log('[Zerodha] Stored session expired or invalid. Requiring fresh authorization.');
                await prisma.user.update({
                    where: { id: req.userId },
                    data: { brokerAccess: null, brokerAccessExpiry: null }
                });
                return res.json({
                    message: 'Broker session expired. Please re-authorize.',
                    loginUrl: `https://kite.zerodha.com/connect/login?v=3&api_key=${rawApiKey}`
                });
            }
        } else {
            // No token and no valid session — return loginUrl so frontend can redirect
            if (rawApiKey && apiSecret) {
                await prisma.user.update({
                    where: { id: req.userId },
                    data: { brokerType, brokerApiKey: rawApiKey, brokerApiSecret: apiSecret }
                });
            }
            return res.json({
                message: 'Credentials saved. Please authorize on Zerodha.',
                loginUrl: `https://kite.zerodha.com/connect/login?v=3&api_key=${rawApiKey}`
            });
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

    // Only update DB if we performed a fresh handshake
    if (authenticatedAccessToken) {
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                brokerType: brokerType,
                brokerApiKey: rawApiKey,
                brokerApiSecret: apiSecret || user?.brokerApiSecret || null,
                brokerAccess: authenticatedAccessToken,
                brokerAccessExpiry: expiryDate
            }
        });
    }

    res.json({ 
        message: 'Live broker connected securely.', 
        synced: positions.length, 
        accessToken: authenticatedAccessToken || accessToken 
    });
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
    include: { user: true },
    take: 10 // process in batches
  });

  for (const item of pending) {
    try {
      console.log(`[Queue] Executing strategy ${item.id} for user ${item.userId} via ${item.brokerType}`);
      
      // Use the session token (brokerAccess) if it exists, otherwise fall back to API Key
      const authKey = item.user.brokerAccess || item.brokerApiKey;
      const results = await processTradesImmediately(authKey, item.brokerApiSecret, item.brokerType || 'zerodha', item.trades);
      
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

export const getBrokerOrders = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user || user.brokerType !== 'zerodha' || !user.brokerAccess) {
            return res.json([]); // No live broker connected
        }

        const response = await axios.get('https://api.kite.trade/orders', {
            headers: { 'X-Kite-Version': '3', 'Authorization': `token ${user.brokerAccess}` }
        });

        res.json(response.data.data || []);
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        res.status(500).json({ error: 'Failed to fetch broker orders' });
    }
};
