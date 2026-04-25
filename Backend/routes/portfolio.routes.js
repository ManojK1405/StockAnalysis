import express from 'express';
import { 
  getWatchlist, addToWatchlist, removeFromWatchlist,
  getPortfolio, addPortfolioItem, syncBroker, disconnectBroker, executeStrategy,
  getTradeQueue, retryTrade, dismissTrade, skipTrade,
  addMockBalance, toggleAutoPilot, setTradingMode, buyMockStock, sellMockStock, getTradeLogs, getBrokerOrders
} from '../controllers/portfolio.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.get('/watchlist', getWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:id', removeFromWatchlist);

router.get('/portfolio', getPortfolio);
router.get('/logs', getTradeLogs);
router.get('/orders', getBrokerOrders);
router.post('/portfolio', addPortfolioItem);
router.post('/sync-broker', syncBroker);
router.post('/disconnect-broker', disconnectBroker);
router.post('/execute-strategy', executeStrategy);
router.get('/queue', getTradeQueue);
router.post('/queue/retry/:id', retryTrade);
router.post('/queue/skip/:id', skipTrade);
router.delete('/queue/:id', dismissTrade);

router.post('/mock/balance', addMockBalance);
router.post('/mock/buy', buyMockStock);
router.post('/mock/sell', sellMockStock);
router.post('/autopilot/toggle', toggleAutoPilot);
router.post('/mode', setTradingMode);

export default router;
