import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAdmin, requireAuth } from '../middleware/auth';

const departmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  manager_id: z.string().uuid().optional(),
});

export async function departmentRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (_request, reply) => {
    const result = await db.query(
      `SELECT d.*, u.name as manager_name
       FROM departments d
       LEFT JOIN users u ON d.manager_id = u.id
       ORDER BY d.name`
    );
    return reply.send({ success: true, data: result.rows, error: null });
  });

  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = departmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, error: parsed.error.errors[0]?.message });
    }
    const result = await db.query(
      'INSERT INTO departments (name, description, manager_id) VALUES ($1, $2, $3) RETURNING *',
      [parsed.data.name, parsed.data.description ?? null, parsed.data.manager_id ?? null]
    );
    return reply.status(201).send({ success: true, data: result.rows[0], error: null });
  });

  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const parsed = departmentSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, data: null, error: parsed.error.errors[0]?.message });
      }
      const data = parsed.data;
      const result = await db.query(
        `UPDATE departments SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           manager_id = COALESCE($3, manager_id),
           updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [data.name ?? null, data.description ?? null, data.manager_id ?? null, request.params.id]
      );
      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Department not found' });
      }
      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const result = await db.query('DELETE FROM departments WHERE id = $1 RETURNING id', [request.params.id]);
      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Department not found' });
      }
      return reply.send({ success: true, data: null, error: null });
    }
  );
}
