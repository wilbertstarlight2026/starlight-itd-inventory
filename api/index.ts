/**
 * Vercel Serverless Function — Fastify backend adapter
 * All /api/* requests are routed here by vercel.json
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../apps/backend/src/app';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let handler: Handler | null = null;

async function getHandler(): Promise<Handler> {
  if (!handler) {
    const app = await createApp();
    await app.ready();
    // Use the underlying Node.js http.Server so it receives standard
    // (IncomingMessage, ServerResponse) request events from Vercel
    const server = app.server;
    handler = (req, res) => {
      server.emit('request', req, res);
    };
  }
  return handler;
}

export default async function (req: VercelRequest, res: VercelResponse) {
  const h = await getHandler();
  h(req as unknown as IncomingMessage, res as unknown as ServerResponse);
}
