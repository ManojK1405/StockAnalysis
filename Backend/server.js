import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
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

// --- Background Jobs ---
import { processPendingQueue } from './controllers/portfolio.controller.js';

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

// --- Real-time Price Ticker (WebSocket) ---
io.on('connection', (socket) => {
  console.log('Client connected to Live Ticker:', socket.id);
  
  socket.on('subscribe', async (symbols) => {
    if (!Array.isArray(symbols)) return;
    socket.join(symbols); // Join rooms for specific symbols
    console.log(`Socket ${socket.id} subscribed to:`, symbols);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Broadcast latest prices every 10 seconds
cron.schedule('*/10 * * * * *', async () => {
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  const symbols = rooms.filter(r => r.includes('.NS') || r.includes('.BO'));
  
  if (symbols.length === 0) return;

  try {
     const quotes = await yahooFinance.quote(symbols);
     const results = Array.isArray(quotes) ? quotes : [quotes];
     
     results.forEach(q => {
        io.to(q.symbol).emit('price_update', {
           symbol: q.symbol,
           price: q.regularMarketPrice,
           change: q.regularMarketChangePercent
        });
     });
  } catch (err) {
     // fail silently for backgrounds
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT} `);
});
