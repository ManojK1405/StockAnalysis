import express from 'express';
import { 
  getWatchlist, addToWatchlist, removeFromWatchlist,
  getPortfolio, addPortfolioItem, syncBroker, executeStrategy,
  getTradeQueue, retryTrade, dismissTrade
} from '../controllers/portfolio.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.get('/watchlist', getWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:id', removeFromWatchlist);

router.get('/portfolio', getPortfolio);
router.post('/portfolio', addPortfolioItem);
router.post('/broker-sync', syncBroker);
router.post('/execute-strategy', executeStrategy);
router.get('/queue', getTradeQueue);
router.post('/queue/retry/:id', retryTrade);
router.delete('/queue/:id', dismissTrade);

export default router;
