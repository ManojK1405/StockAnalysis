import express from 'express';
import { 
  getWatchlist, addToWatchlist, removeFromWatchlist,
  getPortfolio, addPortfolioItem 
} from '../controllers/portfolio.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.get('/watchlist', getWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:id', removeFromWatchlist);

router.get('/portfolio', getPortfolio);
router.post('/portfolio', addPortfolioItem);

export default router;
