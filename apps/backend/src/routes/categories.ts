import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAdmin, requireAuth } from '../middleware/auth';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  parent_id: z.string().uuid().optional(),
  description: z.string().optional(),
});

export async function categoryRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (_request, reply) => {
    const result = await db.query(
      `SELECT c.*, parent.name as parent_name
       FROM categories c
       LEFT JOIN categories parent ON c.parent_id = parent.id
       ORDER BY COALESCE(c.parent_id::text, c.id::text), c.name`
    );
    return reply.send({ success: true, data: result.rows, error: null });
  });

  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = categorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, error: parsed.error.errors[0]?.message });
    }
    const result = await db.query(
      'INSERT INTO categories (name, parent_id, description) VALUES ($1, $2, $3) RETURNING *',
      [parsed.data.name, parsed.data.parent_id ?? null, parsed.data.description ?? null]
    );
    return reply.status(201).send({ success: true, data: result.rows[0], error: null });
  });

  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const parsed = categorySchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, data: null, error: parsed.error.errors[0]?.message });
      }
      const data = parsed.data;
      const result = await db.query(
        `UPDATE categories SET
           name = COALESCE($1, name),
           description = COALESCE($2, description)
         WHERE id = $3 RETURNING *`,
        [data.name ?? null, data.description ?? null, request.params.id]
      );
      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Category not found' });
      }
      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [request.params.id]);
      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Category not found' });
      }
      return reply.send({ success: true, data: null, error: null });
    }
  );
}
