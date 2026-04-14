import express from 'express';
import { generateStrategy } from '../controllers/strategy.controller.js';

const router = express.Router();

// POST /api/strategy/generate
router.post('/generate', generateStrategy);

export default router;
