import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ 
    suppressNotices: ['yahooSurvey'],
    validation: { logErrors: false }
});

export const getMarketSummary = async (req, res) => {
    try {
        const sectors = [
            { name: 'Nifty 50', symbol: '^NSEI' },
            { name: 'Bank Nifty', symbol: '^NSEBANK' },
            { name: 'Nifty IT', symbol: '^CNXIT' },
            { name: 'BSE Sensex', symbol: '^BSESN' }
        ];

        let pulse = [];
        try {
            const quotes = await Promise.all(sectors.map(s => 
                yahooFinance.quote(s.symbol).catch(err => {
                    console.warn(`[Market] Quote failed for ${s.symbol}:`, err.message);
                    return null;
                })
            ));

            pulse = sectors.map((s, i) => {
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
        } catch (e) {
            console.error('[Market] Pulse failed:', e);
        }

        let trending = [];
        try {
            const trendingResp = await yahooFinance.trendingSymbols('IN').catch(() => ({ quotes: [] }));
            const trendingSymbols = trendingResp.quotes?.length > 0 
                ? trendingResp.quotes.slice(0, 10).map(q => q.symbol) 
                : ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'SBIN.NS'];

            const trendingQuotes = await Promise.all(
                trendingSymbols.map(sym => yahooFinance.quote(sym).catch(() => null))
            );

            trending = trendingQuotes.filter(q => q).map(q => ({
                symbol: q.symbol,
                name: q.shortName || q.longName || q.symbol.replace('.NS', ''),
                price: q.regularMarketPrice || 0,
                change: q.regularMarketChange || 0,
                changePercent: q.regularMarketChangePercent || 0,
            })).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
        } catch (e) {
            console.error('[Market] Trending failed:', e);
        }

        let topNews = [];
        try {
            const newsSymbol = trending.length > 0 ? trending[0].symbol : 'RELIANCE.NS';
            const searchRes = await yahooFinance.search(newsSymbol, { newsCount: 10 }).catch(() => ({ news: [] }));
            topNews = (searchRes.news || []).slice(0, 5).map(n => ({
                title: n.title,
                link: n.link,
                publisher: n.publisher,
                content: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleDateString() : 'Recent'
            }));
        } catch (e) {
            console.error('[Market] News failed:', e);
        }

        res.json({ pulse, trending, topNews });
    } catch (error) {
        console.error('Final Market Summary Error:', error);
        res.status(500).json({ error: 'Failed to fetch market summary', pulse: [], trending: [], topNews: [] });
    }
};

export const searchSymbols = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const results = await yahooFinance.search(q);
        const filtered = results.quotes
            .filter(item => item.quoteType === 'EQUITY' || item.quoteType === 'INDEX')
            .map(item => ({
                symbol: item.symbol,
                name: item.shortname || item.longname || item.symbol,
                exch: item.exchDisp || item.exchange,
                type: item.quoteType
            }));
        res.json(filtered);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
};
