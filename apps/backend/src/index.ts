import { createApp } from './app';
import { db } from './db/client';

function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

validateEnv();

async function start() {
  const app = await createApp();
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

start();
