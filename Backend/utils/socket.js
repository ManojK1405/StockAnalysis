import { io } from '../server.js';
import { KiteTicker } from 'kiteconnect';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep track of active tickers to avoid duplicate connections
const activeTickers = new Map();

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

  activeTickers.set(userId, ticker);
};
