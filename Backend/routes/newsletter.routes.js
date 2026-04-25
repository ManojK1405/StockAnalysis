import express from 'express';
const router = express.Router();
import * as newsletterController from '../controllers/newsletter.controller.js';
import { protect } from '../middleware/auth.middleware.js';

router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);

// Admin only: Trigger newsletter blast
router.post('/send', protect, newsletterController.sendNewsletter);

export default router;
