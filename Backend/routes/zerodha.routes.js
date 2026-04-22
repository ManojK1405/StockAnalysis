import express from 'express';
import { connectZerodha, getHoldings, getQuotes } from '../controllers/zerodha.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Both routes protected by user authentication
router.post('/connect', auth, connectZerodha);
router.post('/holdings', auth, getHoldings);
router.post('/quotes', auth, getQuotes);

export default router;
