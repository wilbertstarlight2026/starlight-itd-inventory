import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAdmin, requireAuth } from '../middleware/auth';

const locationSchema = z.object({
  name: z.string().min(1).max(100),
  building: z.string().max(100).optional(),
  floor: z.string().max(50).optional(),
  room: z.string().max(100).optional(),
});

export async function locationRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (_request, reply) => {
    const result = await db.query('SELECT * FROM locations ORDER BY building, floor, name');
    return reply.send({ success: true, data: result.rows, error: null });
  });

  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = locationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, error: parsed.error.errors[0]?.message });
    }
    const result = await db.query(
      'INSERT INTO locations (name, building, floor, room) VALUES ($1, $2, $3, $4) RETURNING *',
      [parsed.data.name, parsed.data.building ?? null, parsed.data.floor ?? null, parsed.data.room ?? null]
    );
    return reply.status(201).send({ success: true, data: result.rows[0], error: null });
  });

  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const parsed = locationSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, data: null, error: parsed.error.errors[0]?.message });
      }
      const data = parsed.data;
      const result = await db.query(
        `UPDATE locations SET
           name = COALESCE($1, name),
           building = COALESCE($2, building),
           floor = COALESCE($3, floor),
           room = COALESCE($4, room),
           updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [data.name ?? null, data.building ?? null, data.floor ?? null, data.room ?? null, request.params.id]
      );
      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Location not found' });
      }
      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const result = await db.query('DELETE FROM locations WHERE id = $1 RETURNING id', [request.params.id]);
      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Location not found' });
      }
      return reply.send({ success: true, data: null, error: null });
    }
  );
}
