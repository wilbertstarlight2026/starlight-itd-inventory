import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwtPlugin from '@fastify/jwt';
import multipart from '@fastify/multipart';
import type { SocketStream } from '@fastify/websocket';
import path from 'path';

import { authRoutes } from './routes/auth';
import { itemRoutes } from './routes/items';
import { categoryRoutes } from './routes/categories';
import { departmentRoutes } from './routes/departments';
import { locationRoutes } from './routes/locations';
import { assignmentRoutes } from './routes/assignments';
import { syncRoutes } from './routes/sync';
import { reportRoutes } from './routes/reports';
import { userRoutes } from './routes/users';

const IS_SERVERLESS = Boolean(process.env.VERCEL);

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // ── Security & Middleware ─────────────────────────
  await app.register(helmet, { contentSecurityPolicy: false });

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:4001'];

  await app.register(cors, { origin: corsOrigins, credentials: true });

  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });

  await app.register(jwtPlugin, { secret: process.env.JWT_ACCESS_SECRET! });

  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024,
    },
  });

  // Static uploads: skip in serverless (no persistent filesystem)
  if (!IS_SERVERLESS) {
    const staticPlugin = (await import('@fastify/static')).default;
    const uploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    await app.register(staticPlugin, { root: uploadDir, prefix: '/uploads/' });
  }

  // WebSocket: skip in serverless (Vercel does not support persistent WS)
  if (!IS_SERVERLESS) {
    const fastifyWS = (await import('@fastify/websocket')).default;
    const { wsManager } = await import('./services/WSManager');
    await app.register(fastifyWS);

    app.get('/ws', { websocket: true }, (connection: SocketStream, req) => {
      const token = (req.query as Record<string, string>).token;
      try {
        app.jwt.verify(token);
      } catch {
        connection.socket.close(1008, 'Unauthorized');
        return;
      }
      wsManager.add(connection.socket);
      app.log.info(`WS client connected (total: ${wsManager.count})`);
      connection.socket.on('close', () => {
        wsManager.remove(connection.socket);
        app.log.info(`WS client disconnected (total: ${wsManager.count})`);
      });
      connection.socket.on('message', (msg: Buffer | string) => {
        if (msg.toString() === 'ping') {
          connection.socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        }
      });
    });
  }

  // ── Health Check ──────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    serverless: IS_SERVERLESS,
  }));

  // ── API Routes ────────────────────────────────────
  const API_PREFIX = '/api/v1';
  await app.register(authRoutes,       { prefix: `${API_PREFIX}/auth` });
  await app.register(itemRoutes,       { prefix: `${API_PREFIX}/items` });
  await app.register(categoryRoutes,   { prefix: `${API_PREFIX}/categories` });
  await app.register(departmentRoutes, { prefix: `${API_PREFIX}/departments` });
  await app.register(locationRoutes,   { prefix: `${API_PREFIX}/locations` });
  await app.register(assignmentRoutes, { prefix: `${API_PREFIX}/assignments` });
  await app.register(syncRoutes,       { prefix: `${API_PREFIX}/sync` });
  await app.register(reportRoutes,     { prefix: `${API_PREFIX}/reports` });
  await app.register(userRoutes,       { prefix: `${API_PREFIX}/users` });

  // ── Error Handler ─────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    if (error.statusCode === 429) {
      return reply.status(429).send({ success: false, data: null, error: 'Too many requests. Please slow down.' });
    }
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      success: false,
      data: null,
      error:
        process.env.NODE_ENV === 'production' && statusCode === 500
          ? 'Internal server error'
          : error.message,
    });
  });

  return app;
}
