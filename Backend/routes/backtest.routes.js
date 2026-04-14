import express from 'express';
import { runBacktest } from '../controllers/backtest.controller.js';

const router = express.Router();

router.get('/:symbol', runBacktest);

export default router;
