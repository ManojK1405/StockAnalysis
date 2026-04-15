import express from 'express';
import { generateStrategy, generateIntradayPulse } from '../controllers/strategy.controller.js';

const router = express.Router();

// POST /api/strategy/generate
router.post('/generate', generateStrategy);

// POST /api/strategy/intraday
router.post('/intraday', generateIntradayPulse);

export default router;
