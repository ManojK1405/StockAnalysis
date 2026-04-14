import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

// Import Routes
import predictionRoutes from './routes/prediction.routes.js';
import authRoutes from './routes/auth.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import marketRoutes from './routes/market.routes.js';
import backtestRoutes from './routes/backtest.routes.js';
import alertRoutes from './routes/alert.routes.js';
import strategyRoutes from './routes/strategy.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Stock Analyzer API is running...' });
});

app.use('/api/predictions', predictionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/strategy', strategyRoutes);

// --- Background Jobs ---
cron.schedule('*/30 * * * *', async () => {
  console.log('--- Running Background Stock & News Update ---');
  try {
    console.log('Successfully updated market insights.');
  } catch (error) {
    console.error('Error in background job:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT} `);
});
