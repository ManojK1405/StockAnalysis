import { PrismaClient } from '@prisma/client';
import YahooFinance from 'yahoo-finance2';
import { isMarketOpen } from '../utils/marketStatus.js';
import { executeLiveTrade } from './broker.service.js';

const prisma = new PrismaClient();
const yahooFinance = new YahooFinance({ 
    suppressNotices: ['yahooSurvey'],
    validation: { logErrors: false }
});

const TARGET_STOCKS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'ASIANPAINT.NS', 'LT.NS', 'ADANIENT.NS', 'TITAN.NS', 'M&M.NS', 'SUNPHARMA.NS', 'TATASTEEL.NS'];

export const startAutoPilotService = () => {
    console.log('🚀 EquiTrade AI Pilot: Money Manager Mode Engaged');
    
    // Run every 3 minutes during market hours
    setInterval(async () => {
        try {
            if (!isMarketOpen()) return;

            const users = await prisma.user.findMany({
                where: { autoPilot: true }
            });

            for (const user of users) {
                await manageUserWealth(user);
            }
        } catch (error) {
            console.error('AI Manager Error:', error.message);
        }
    }, 3 * 60 * 1000); 
};

async function manageUserWealth(user) {
    try {
        // If live mode, we need broker access
        if (user.tradingMode === 'live' && !user.brokerAccess) return;

        // 1. DYNAMIC PORTFOLIO EVALUATION (Profit Maximization)
        // For Live mode, we might want to fetch live holdings from broker instead of DB
        // But for consistency, let's assume DB tracks intent and syncs.
        const portfolio = await prisma.portfolioItem.findMany({
            where: { userId: user.id },
            include: { stock: true }
        });

        for (const item of portfolio) {
            const quote = await yahooFinance.quote(item.stock.symbol);
            const currentPrice = quote.regularMarketPrice;
            const pnlPercent = ((currentPrice * item.quantity - item.totalCost) / item.totalCost) * 100;

            // INTELLIGENT EXIT STRATEGY
            if (pnlPercent > 7.0) {
                await executeAutoTrade(user, item.stock.symbol, item.quantity, currentPrice, 'SELL', `Wealth Maximization: Portfolio asset ${item.stock.symbol} achieved a return of ${pnlPercent.toFixed(2)}%. Booking profits.`);
                continue;
            }

            if (pnlPercent < -2.0) {
                await executeAutoTrade(user, item.stock.symbol, item.quantity, currentPrice, 'SELL', `Risk Mitigation: ${item.stock.symbol} breached stop-loss threshold. Exiting to preserve capital.`);
                continue;
            }
        }

        // 2. INTELLIGENT ASSET ACQUISITION
        // Check "Available Balance" - mockBalance for mock, or we assume a constant for live for now
        const currentBalance = user.tradingMode === 'mock' ? user.mockBalance : 10000; // Live mode needs actual cash check, assuming 10k for demo

        if (portfolio.length < 5 && currentBalance > 5000) {
            const candidate = await findHighMomentumCandidate(user);
            if (candidate) {
                const quote = await yahooFinance.quote(candidate);
                const price = quote.regularMarketPrice;
                
                const amountToInvest = Math.min(currentBalance * 0.15, 25000); 
                const qty = Math.floor(amountToInvest / price);

                if (qty > 0) {
                    await executeAutoTrade(user, candidate, qty, price, 'BUY', `Alpha Generation: Momentum breakout detected in ${candidate}. Allocating capital.`);
                }
            }
        }

    } catch (e) {
        console.error(`AI Manager User Logic Fail (${user.id}):`, e.message);
    }
}

async function findHighMomentumCandidate(user) {
    const watchlist = await prisma.watchlist.findMany({
        where: { userId: user.id },
        include: { stock: true }
    });

    const pool = watchlist.length > 3 ? watchlist.map(w => w.stock.symbol) : TARGET_STOCKS;
    
    try {
        const quotes = await Promise.all(pool.slice(0, 10).map(s => yahooFinance.quote(s).catch(() => null)));
        const validQuotes = quotes.filter(q => q && q.regularMarketChangePercent > 0.5);
        
        if (validQuotes.length > 0) {
            const best = validQuotes.sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)[0];
            return best.symbol;
        }
    } catch (e) {
        return pool[Math.floor(Math.random() * pool.length)];
    }
    return null;
}

async function executeAutoTrade(user, symbol, quantity, price, action, reason) {
    try {
        let liveResult = null;
        if (user.tradingMode === 'live') {
            console.log(`[AI-PILOT] Executing LIVE ${action} for ${symbol}...`);
            liveResult = await executeLiveTrade(user, symbol, quantity, action);
            if (!liveResult.success) {
                console.error(`[AI-PILOT] LIVE TRADE FAILED: ${liveResult.error}`);
                return;
            }
        }

        // Update DB to reflect the trade (both for Mock and for tracking Live intent)
        const totalAmount = quantity * price;
        let stock = await prisma.stock.findUnique({ where: { symbol } });
        if (!stock) stock = await prisma.stock.create({ data: { symbol } });

        await prisma.$transaction([
            // Deduct mock balance ONLY if in mock mode
            user.tradingMode === 'mock' 
                ? prisma.user.update({
                    where: { id: user.id },
                    data: { mockBalance: action === 'BUY' ? { decrement: totalAmount } : { increment: totalAmount } }
                  })
                : prisma.user.findUnique({ where: { id: user.id } }), // No-op for live
            
            action === 'BUY' 
                ? prisma.portfolioItem.upsert({
                    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
                    update: {
                        quantity: { increment: quantity },
                        totalCost: { increment: totalAmount },
                        avgPrice: { set: 0 } 
                    },
                    create: {
                        userId: user.id,
                        stockId: stock.id,
                        quantity,
                        avgPrice: price,
                        totalCost: totalAmount
                    }
                })
                : prisma.portfolioItem.update({
                    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
                    data: {
                        quantity: { decrement: quantity },
                        totalCost: { decrement: (totalAmount / quantity) * quantity }
                    }
                }),
            prisma.tradeLog.create({
                data: {
                    userId: user.id,
                    symbol,
                    action,
                    quantity,
                    price,
                    totalAmount,
                    mode: 'AI_PILOT',
                    type: user.tradingMode.toUpperCase(),
                    reason: user.tradingMode === 'live' ? `[LIVE ORDER: ${liveResult.orderId}] ${reason}` : reason
                }
            })
        ]);

        if (action === 'SELL') {
            const item = await prisma.portfolioItem.findFirst({
                where: { userId: user.id, stockId: stock.id }
            });
            if (item && item.quantity <= 0) {
                await prisma.portfolioItem.delete({ where: { id: item.id } });
            }
        }
        
        console.log(`[AI-PILOT] ${user.tradingMode.toUpperCase()} ${action} SUCCESS: ${symbol} | Price: ₹${price}`);
    } catch (e) {
        console.error(`AI Execution Fail (${symbol}):`, e.message);
    }
}
