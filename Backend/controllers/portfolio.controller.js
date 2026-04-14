import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
