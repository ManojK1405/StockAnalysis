import { io } from '../server.js';
import { KiteTicker } from 'kiteconnect';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

// Keep track of active tickers to avoid duplicate connections
const activeTickers = new Map();

// Schedule cleanup at 5:55 AM IST daily (00:25 UTC)
cron.schedule('25 0 * * *', () => {
  console.log('[Ticker Cleanup] 5:55 AM IST reached. Terminating all active tickers.');
  activeTickers.forEach((ticker, userId) => {
      try {
        ticker.disconnect();
        console.log(`Disconnected ticker for user ${userId}`);
      } catch (e) {
        console.error(`Error disconnecting ticker for user ${userId}:`, e.message);
      }
  });
  activeTickers.clear();
}, {
  timezone: "UTC"
});

export const setupSocketHandlers = () => {
  io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    socket.on('subscribe_live_data', async (data) => {
      const { userId, symbols } = data;
      if (!userId) return;

      console.log(`User ${userId} subscribing to symbols:`, symbols);
      socket.join(`user_${userId}`);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.brokerType === 'zerodha' && user.brokerAccess) {
        startZerodhaTicker(userId, user.brokerApiKey, user.brokerAccess.split(':')[1], symbols);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from socket:', socket.id);
    });
  });
};

const startZerodhaTicker = (userId, apiKey, accessToken, symbols) => {
  if (activeTickers.has(userId)) {
      const ticker = activeTickers.get(userId);
      if (symbols && symbols.length > 0) {
          ticker.subscribe(symbols);
          ticker.setMode(ticker.modeFull, symbols);
      }
      return;
  }

  const ticker = new KiteTicker({
    api_key: apiKey,
    access_token: accessToken
  });

  ticker.connect();

  ticker.on('ticks', (ticks) => {
    io.to(`user_${userId}`).emit('live_ticks', ticks);
  });

  ticker.on('connect', () => {
    console.log(`Kite Ticker connected for user ${userId}`);
    if (symbols && symbols.length > 0) {
        ticker.subscribe(symbols);
        ticker.setMode(ticker.modeFull, symbols);
    }
  });

  ticker.on('error', (err) => {
    console.error(`Kite Ticker Error for user ${userId}:`, err);
  });

  ticker.on('noreconnect', () => {
    console.error(`Kite Ticker failed to reconnect for user ${userId}`);
    activeTickers.delete(userId);
  });

  activeTickers.set(userId, ticker);
};
