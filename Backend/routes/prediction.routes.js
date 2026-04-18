import express from 'express';
import { getStockPrediction } from '../controllers/prediction.controller.js';
import { extractStockSymbol } from '../utils/gemini.js';

const router = express.Router();

// GET global market status via NIFTY 50
router.get('/market-status', async (req, res) => {
    try {
        const YahooFinance = (await import('yahoo-finance2')).default;
        const yf = new YahooFinance();
        // Check NIFTY 50 index for Indian market status
        const quote = await yf.quote('^NSEI').catch(() => null);
        const state = quote?.marketState || 'CLOSED';
        res.json({ state });
    } catch (error) {
        res.status(500).json({ error: 'Market status check failed', state: 'CLOSED' });
    }
});

// GET prediction for a specific stock
router.get('/:symbol', getStockPrediction);

// POST extract symbol from natural language
router.post('/extract-symbol', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });
        
        const symbol = await extractStockSymbol(query);
        res.json({ symbol });
    } catch (error) {
        res.status(500).json({ error: 'Extraction failed' });
    }
});

// GET search suggestions
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const YahooFinance = (await import('yahoo-finance2')).default;
        const yf = new YahooFinance();
        const results = await yf.search(query);
        
        // Filter for relevant Indian stocks or major globals
        const suggestions = results.quotes
            .filter(q => q.isYahooFinance && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO') || q.quoteType === 'EQUITY'))
            .slice(0, 5)
            .map(q => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol
            }));
            
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
