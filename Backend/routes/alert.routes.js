import express from 'express';
import { createAlert, getAlerts, deleteAlert } from '../controllers/alert.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.post('/', createAlert);
router.get('/', getAlerts);
router.delete('/:id', deleteAlert);

export default router;
