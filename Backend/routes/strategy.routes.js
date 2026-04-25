import express from 'express';
import { 
    generateStrategy, 
    generateIntradayPulse, 
    generateReverseStrategy, 
    saveStrategy, 
    getSavedStrategies, 
    deleteStrategy, 
    updateStrategy, 
    chatStrategy,
    backtestStrategy,
    customBacktestStrategy
} from '../controllers/strategy.controller.js';

import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/strategy/generate
router.post('/generate', generateStrategy);

// POST /api/strategy/backtest
router.post('/backtest', backtestStrategy);

// POST /api/strategy/custom-backtest
router.post('/custom-backtest', customBacktestStrategy);

// POST /api/strategy/chat
router.post('/chat', chatStrategy);

// POST /api/strategy/intraday
router.post('/intraday', generateIntradayPulse);

// POST /api/strategy/reverse
router.post('/reverse', generateReverseStrategy);

// Saved Strategies CRUD
router.post('/saved', auth, saveStrategy);
router.get('/saved', auth, getSavedStrategies);
router.delete('/saved/:id', auth, deleteStrategy);
router.put('/saved/:id', auth, updateStrategy);

export default router;
