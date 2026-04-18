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

        const [quotes, trendingResp] = await Promise.all([
            Promise.all(sectors.map(s => yahooFinance.quote(s.symbol).catch(() => null))),
            yahooFinance.trendingSymbols('IN').catch(() => ({ quotes: [] }))
        ]);

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

        const trendingSymbols = trendingResp.quotes?.slice(0, 10).map(q => q.symbol) || ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'];
        const trendingQuotes = await Promise.all(
            trendingSymbols.map(sym => yahooFinance.quote(sym).catch(() => null))
        );

        const trending = trendingQuotes.filter(q => q).map(q => ({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol.replace('.NS', ''),
            price: q.regularMarketPrice || 0,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
        })).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

        let topNews = [];
        if (trending.length > 0) {
            const topStock = trending[0].symbol;
            const searchRes = await yahooFinance.search(topStock, { newsCount: 5 }).catch(() => ({ news: [] }));
            topNews = (searchRes.news || []).map(n => ({
                title: n.title,
                link: n.link,
                publisher: n.publisher,
                content: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleDateString() : 'Recent'
            }));
        }

        const final = { pulse: result, trending, topNews };
        res.json(final);
    } catch (error) {
        console.error('Market Summary Error:', error);
        res.status(500).json({ error: 'Failed to fetch market summary' });
    }
};
