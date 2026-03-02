import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwtPlugin from '@fastify/jwt';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
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
import { db } from './db/client';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function bootstrap() {
  // ── Security & Middleware ─────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  await app.register(jwtPlugin, {
    secret: process.env.JWT_ACCESS_SECRET || 'fallback_secret_dev_only',
  });

  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024,
    },
  });

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  await app.register(staticPlugin, {
    root: uploadDir,
    prefix: '/uploads/',
  });

  // ── Health Check ──────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));

  // ── API Routes ────────────────────────────────────
  const API_PREFIX = '/api/v1';

  await app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  await app.register(itemRoutes, { prefix: `${API_PREFIX}/items` });
  await app.register(categoryRoutes, { prefix: `${API_PREFIX}/categories` });
  await app.register(departmentRoutes, { prefix: `${API_PREFIX}/departments` });
  await app.register(locationRoutes, { prefix: `${API_PREFIX}/locations` });
  await app.register(assignmentRoutes, { prefix: `${API_PREFIX}/assignments` });
  await app.register(syncRoutes, { prefix: `${API_PREFIX}/sync` });
  await app.register(reportRoutes, { prefix: `${API_PREFIX}/reports` });
  await app.register(userRoutes, { prefix: `${API_PREFIX}/users` });

  // ── Error Handler ─────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        data: null,
        error: 'Too many requests. Please slow down.',
      });
    }

    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      success: false,
      data: null,
      error: process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : error.message,
    });
  });

  // ── Start Server ──────────────────────────────────
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  try {
    await db.connect();
    app.log.info('Database connected successfully');

    await app.listen({ port, host });
    app.log.info(`Server running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
