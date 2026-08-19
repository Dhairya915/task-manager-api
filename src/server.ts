import app from './app';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { connectMongo } from './lib/mongo';
import jwt from 'jsonwebtoken';
import { connections } from './lib/websocket';

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    socket.close();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
      role: string;
    };
    connections.set(decoded.userId, socket);
    console.log(`client connected: ${decoded.userId}`);

    socket.on('close', () => {
      connections.delete(decoded.userId);
      console.log(`client disconnected: ${decoded.userId}`);
    });
  } catch {
    socket.close();
  }
});

async function startServer() {
  await connectMongo();

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

startServer();
