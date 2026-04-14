import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export const getMarketSummary = async (req, res) => {
    try {
        const sectors = [
            { name: 'Nifty 50', symbol: '^NSEI' },
            { name: 'Bank Nifty', symbol: '^NSEBANK' },
            { name: 'Nifty IT', symbol: '^CNXIT' },
            { name: 'BSE Sensex', symbol: '^BSESN' }
        ];

        const quotes = await Promise.all(
            sectors.map(s => yahooFinance.quote(s.symbol).catch(() => null))
        );

        const result = sectors.map((s, i) => {
            const q = quotes[i];
            return {
                name: s.name,
                symbol: s.symbol,
                price: q?.regularMarketPrice || 0,
                change: q?.regularMarketChange || 0,
                changePercent: q?.regularMarketChangePercent || 0,
                state: q?.marketState || 'CLOSED'
            };
        });

        // Heatmap Mock Data (Sector based)
        const heatmap = [
            { sector: 'Banks', change: 1.2, status: 'Bullish' },
            { sector: 'IT', change: -0.8, status: 'Bearish' },
            { sector: 'Auto', change: 2.1, status: 'Strong Bullish' },
            { sector: 'Energy', change: 0.3, status: 'Neutral' },
            { sector: 'Consumer', change: -1.5, status: 'Strong Bearish' },
            { sector: 'Metal', change: 0.7, status: 'Bullish' }
        ];

        const final = { pulse: result, heatmap };

        res.json(final);
    } catch (error) {
        console.error('Market Summary Error:', error);
        res.status(500).json({ error: 'Failed to fetch market summary' });
    }
};
