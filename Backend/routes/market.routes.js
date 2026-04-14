import express from 'express';
import { getMarketSummary } from '../controllers/market.controller.js';

const router = express.Router();

router.get('/summary', getMarketSummary);

export default router;
