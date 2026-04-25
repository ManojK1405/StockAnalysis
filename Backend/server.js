import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ 
    suppressNotices: ['yahooSurvey'],
    validation: { logErrors: false }
});

// Import Routes
import predictionRoutes from './routes/prediction.routes.js';
import authRoutes from './routes/auth.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import marketRoutes from './routes/market.routes.js';
import backtestRoutes from './routes/backtest.routes.js';
import alertRoutes from './routes/alert.routes.js';
import strategyRoutes from './routes/strategy.routes.js';
import zerodhaRoutes from './routes/zerodha.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
import { Server } from 'socket.io';
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
app.use('/api/zerodha', zerodhaRoutes);

// --- Background Jobs ---
import { processPendingQueue } from './controllers/portfolio.controller.js';
import { setupSocketHandlers } from './utils/socket.js';

setupSocketHandlers();

// Market hours check every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('--- Checking Pending Trade Queue ---');
  try {
    await processPendingQueue();
  } catch (error) {
    console.error('Error in Trade Queue job:', error);
  }
});

cron.schedule('*/30 * * * *', async () => {
  console.log('--- Running Background Stock & News Update ---');
  try {
    console.log('Successfully updated market insights.');
  } catch (error) {
    console.error('Error in background job:', error);
  }
});

const startServer = () => {
  httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT} `);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is currently occupied. Retrying in 1.5s...`);
      setTimeout(() => {
        httpServer.close();
        startServer();
      }, 1500);
    } else {
      console.error('[Server] Critical Startup Error:', err);
    }
  });
};

startServer();

// Aggressive unbind handling to ensure reliable Nodemon restarts
process.once('SIGUSR2', () => {
  httpServer.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  httpServer.close(() => {
    process.exit(0);
  });
});

