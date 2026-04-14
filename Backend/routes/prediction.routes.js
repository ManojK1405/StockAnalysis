import express from 'express';
import { getStockPrediction } from '../controllers/prediction.controller.js';

const router = express.Router();

// GET prediction for a specific stock
router.get('/:symbol', getStockPrediction);

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
