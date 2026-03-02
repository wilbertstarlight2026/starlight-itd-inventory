import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAdmin, requireAuth } from '../middleware/auth';
import type { User } from '@starlight/shared';

const createUserSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'manager', 'user']),
  department_id: z.string().uuid().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'user']).optional(),
  department_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  // GET /users
  app.get('/', { preHandler: requireAdmin }, async (_request, reply) => {
    const result = await db.query<User>(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.is_active, u.created_at, u.updated_at,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );
    return reply.send({ success: true, data: result.rows, error: null });
  });

  // GET /users/:id
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      // Users can only view their own profile unless admin
      if (request.user.role !== 'admin' && request.user.sub !== request.params.id) {
        return reply.status(403).send({ success: false, data: null, error: 'Forbidden' });
      }

      const result = await db.query<User>(
        `SELECT u.id, u.name, u.email, u.role, u.department_id, u.is_active, u.created_at, u.updated_at,
                d.name as department_name
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = $1`,
        [request.params.id]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'User not found' });
      }

      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );

  // POST /users
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      });
    }

    const { name, email, password, role, department_id } = parsed.data;

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return reply.status(409).send({
        success: false,
        data: null,
        error: 'Email already in use',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query<User>(
      `INSERT INTO users (name, email, password_hash, role, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, department_id, is_active, created_at, updated_at`,
      [name, email.toLowerCase(), passwordHash, role, department_id ?? null]
    );

    return reply.status(201).send({ success: true, data: result.rows[0], error: null });
  });

  // PATCH /users/:id
  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const parsed = updateUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          data: null,
          error: parsed.error.errors[0]?.message || 'Invalid input',
        });
      }

      const data = parsed.data;

      if (data.email) {
        const existing = await db.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2 LIMIT 1',
          [data.email.toLowerCase(), request.params.id]
        );
        if (existing.rows.length > 0) {
          return reply.status(409).send({
            success: false,
            data: null,
            error: 'Email already in use',
          });
        }
      }

      const result = await db.query<User>(
        `UPDATE users SET
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           department_id = CASE WHEN $4::boolean THEN $5 ELSE department_id END,
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
         WHERE id = $7
         RETURNING id, name, email, role, department_id, is_active, created_at, updated_at`,
        [
          data.name ?? null,
          data.email?.toLowerCase() ?? null,
          data.role ?? null,
          'department_id' in data,
          data.department_id ?? null,
          data.is_active ?? null,
          request.params.id,
        ]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'User not found' });
      }

      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );

  // DELETE /users/:id (deactivate, not hard delete)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      // Prevent self-deactivation
      if (request.user.sub === request.params.id) {
        return reply.status(400).send({
          success: false,
          data: null,
          error: 'Cannot deactivate your own account',
        });
      }

      const result = await db.query(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [request.params.id]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'User not found' });
      }

      return reply.send({ success: true, data: null, error: null, message: 'User deactivated' });
    }
  );
}
