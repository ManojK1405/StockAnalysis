import { PrismaClient } from '@prisma/client';
import YahooFinance from 'yahoo-finance2';

const prisma = new PrismaClient();
const yahooFinance = new YahooFinance();

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
  try {
    const portfolio = await prisma.portfolioItem.findMany({
      where: { userId: req.userId },
      include: { stock: true }
    });

    // Fetch real-time prices for each item
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
          pnlPercent
        };
      } catch (e) {
        return item;
      }
    }));

    res.json(portfolioWithRealTime);
  } catch (error) {
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

import axios from 'axios';

export const syncBroker = async (req, res) => {
  const { brokerName, apiKey } = req.body;
  if (!apiKey) return res.status(401).json({ error: 'API Key is missing' });

  try {
    let positions = [];

    if (brokerName !== 'zerodha') {
      return res.status(400).json({ error: 'Only Zerodha Kite Connect is supported.' });
    }

    try {
      const response = await axios.get('https://api.kite.trade/portfolio/holdings', {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}`
        }
      });
      
      const holdings = response.data.data || [];
      positions = holdings.map(h => ({
        symbol: h.tradingsymbol + (h.exchange === 'NSE' ? '.NS' : '.BO'),
        quantity: h.quantity,
        avgPrice: h.average_price
      }));
    } catch (err) {
      throw new Error('Zerodha authentication failed. Invalid API credentials or expired token.');
    }

    if (positions.length === 0) {
       return res.status(400).json({ error: 'No active holdings found in your broker account.' });
    }

    // Inject positions array into the DB
    const createdItems = [];
    for (const pos of positions) {
      if (pos.quantity <= 0) continue;
      
      let stock = await prisma.stock.findUnique({ where: { symbol: pos.symbol } });
      if (!stock) {
        stock = await prisma.stock.create({ data: { symbol: pos.symbol } });
      }

      const existingItem = await prisma.portfolioItem.findUnique({
        where: { userId_stockId: { userId: req.userId, stockId: stock.id } }
      });

      if (!existingItem) {
        const item = await prisma.portfolioItem.create({
          data: {
            userId: req.userId,
            stockId: stock.id,
            quantity: pos.quantity,
            avgPrice: pos.avgPrice,
            totalCost: pos.quantity * pos.avgPrice
          }
        });
        createdItems.push(item);
      }
    }

    res.json({ message: 'Live broker connected successfully', synced: createdItems.length });
  } catch (error) {
    console.error('Broker Sync Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync broker' });
  }
};

export const executeStrategy = async (req, res) => {
  const { apiKey, trades } = req.body;
  if (!apiKey) return res.status(401).json({ error: 'API Key (Zerodha token) is required to execute orders.' });
  if (!trades || !Array.isArray(trades)) return res.status(400).json({ error: 'Invalid trades payload.' });

  try {
    const orderResults = [];
    
    // Iterate through trades generated by the AI
    for (const trade of trades) {
      if (!trade.symbol) continue;
      
      // Calculate quantity based on allocated amount and current market price. 
      // If price isn't provided directly, we'll fetch it from YahooFinance.
      let price = trade.price;
      if (!price) {
        const quote = await yahooFinance.quote(trade.symbol).catch(() => null);
        price = quote?.regularMarketPrice;
      }
      
      if (!price) continue;
      const quantity = Math.floor(trade.amount / price);
      if (quantity < 1) continue;

      try {
        // Execute live market order on Zerodha
        const zerodhaSymbol = trade.symbol.split('.')[0]; // remove .NS or .BO suffix
        const response = await axios.post('https://api.kite.trade/orders/regular', {
          tradingsymbol: zerodhaSymbol,
          exchange: trade.symbol.endsWith('.BO') ? 'BSE' : 'NSE',
          transaction_type: 'BUY',
          order_type: 'MARKET',
          quantity: quantity,
          product: 'CNC', // Cash and Carry (delivery)
          validity: 'DAY'
        }, {
          headers: {
            'X-Kite-Version': '3',
            'Authorization': `token ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        orderResults.push({
          symbol: trade.symbol,
          expectedQuantity: quantity,
          status: 'SUCCESS',
          orderId: response.data.data.order_id
        });
      } catch (err) {
        // Collect errors but continue executing others
        orderResults.push({
          symbol: trade.symbol,
          expectedQuantity: quantity,
          status: 'FAILED',
          error: err.response?.data?.message || err.message
        });
      }
    }

    res.json({ message: 'Execution phase completed', results: orderResults });
  } catch (error) {
    console.error('Execute Strategy Error:', error);
    res.status(500).json({ error: 'Failed to process execution sequence.' });
  }
};
