import YahooFinance from 'yahoo-finance2';
import { analyzeStock } from '../utils/analysis.js';

const yahooFinance = new YahooFinance({ 
    suppressNotices: ['yahooSurvey'],
    validation: { logErrors: false }
});

export const runBacktest = async (req, res) => {
    try {
        const { symbol } = req.params;
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        const queryOptions = { period1: oneYearAgo, interval: '1d' };
        const history = await yahooFinance.chart(symbol, queryOptions).catch(() => null);

        if (!history || !history.quotes || history.quotes.length < 50) {
            return res.status(404).json({ error: 'Insufficient historical data for backtest' });
        }

        const quotes = history.quotes.filter(q => q.close);
        let capital = 100000; // Starting with 1 Lakh
        let shares = 0;
        let trades = [];

        // Simple Strategy: Buy if RSI < 35, Sell if RSI > 65
        // Iterating through time (simplified windowing)
        for (let i = 20; i < quotes.length; i++) {
            const window = quotes.slice(0, i + 1);
            const indicators = analyzeStock(window, 0).indicators;
            const currentPrice = quotes[i].close;

            if (indicators.rsi < 35 && capital > currentPrice) {
                // BUY
                const qty = Math.floor(capital / currentPrice);
                shares += qty;
                capital -= qty * currentPrice;
                trades.push({ type: 'BUY', price: currentPrice, date: quotes[i].date });
            } else if (indicators.rsi > 65 && shares > 0) {
                // SELL
                capital += shares * currentPrice;
                trades.push({ type: 'SELL', price: currentPrice, date: quotes[i].date });
                shares = 0;
            }
        }

        const finalValue = capital + (shares * quotes[quotes.length - 1].close);
        const totalReturn = ((finalValue - 100000) / 100000) * 100;

        res.json({
            symbol,
            initialCapital: 100000,
            finalValue,
            totalReturn: totalReturn.toFixed(2),
            tradeCount: trades.length,
            trades: trades.slice(-10), // Send last 10 trades
            benchmarkReturn: (((quotes[quotes.length - 1].close - quotes[0].close) / quotes[0].close) * 100).toFixed(2)
        });

    } catch (error) {
        console.error('Backtest Error:', error);
        res.status(500).json({ error: 'Failed to run backtest simulation' });
    }
};
