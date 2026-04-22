import express from 'express';
import { getMarketSummary, searchSymbols } from '../controllers/market.controller.js';

const router = express.Router();

router.get('/summary', getMarketSummary);
router.get('/search', searchSymbols);

export default router;
