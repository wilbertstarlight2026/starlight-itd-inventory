import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAuth } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import type { User } from '@starlight/shared';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  device_id: z.string().optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      });
    }

    const { email, password, device_id } = parsed.data;

    const result = await db.query<User & { password_hash: string }>(
      'SELECT * FROM users WHERE email = $1 AND is_active = true LIMIT 1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = app.jwt.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, refreshTokenHash, device_id ?? null, expiresAt]
    );

    await logAudit({
      entity_type: 'user',
      entity_id: user.id,
      action: 'login',
      performed_by: user.id,
    });

    const { password_hash: _, ...safeUser } = user;

    return reply.send({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: safeUser,
      },
      error: null,
    });
  });

  // POST /auth/refresh
  app.post('/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: 'Invalid input',
      });
    }

    const { refresh_token } = parsed.data;
    const tokenHash = crypto
      .createHash('sha256')
      .update(refresh_token)
      .digest('hex');

    const result = await db.query<{
      id: string;
      user_id: string;
      expires_at: Date;
    }>(
      `SELECT rt.*, u.email, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW() AND u.is_active = true
       LIMIT 1`,
      [tokenHash]
    );

    const tokenRecord = result.rows[0] as typeof result.rows[0] & {
      email: string;
      role: string;
      is_active: boolean;
    };

    if (!tokenRecord) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: 'Invalid or expired refresh token',
      });
    }

    // Rotate refresh token
    await db.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenRecord.id]);

    const newRefreshToken = crypto.randomBytes(48).toString('hex');
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [tokenRecord.user_id, newRefreshTokenHash, expiresAt]
    );

    const newAccessToken = app.jwt.sign(
      { sub: tokenRecord.user_id, email: tokenRecord.email, role: tokenRecord.role },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    return reply.send({
      success: true,
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
      error: null,
    });
  });

  // POST /auth/logout
  app.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (parsed.success) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(parsed.data.refresh_token)
        .digest('hex');
      await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    }

    await logAudit({
      entity_type: 'user',
      entity_id: request.user.sub,
      action: 'logout',
      performed_by: request.user.sub,
    });

    return reply.send({ success: true, data: null, error: null });
  });

  // GET /auth/me
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const result = await db.query<User>(
      `SELECT id, name, email, role, department_id, is_active, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [request.user.sub]
    );

    if (!result.rows[0]) {
      return reply.status(404).send({
        success: false,
        data: null,
        error: 'User not found',
      });
    }

    return reply.send({ success: true, data: result.rows[0], error: null });
  });

  // POST /auth/change-password
  app.post('/change-password', { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(8),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: 'New password must be at least 8 characters',
      });
    }

    const { current_password, new_password } = parsed.data;

    const result = await db.query<{ id: string; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [request.user.sub]
    );

    const user = result.rows[0];
    if (!user) {
      return reply.status(404).send({ success: false, data: null, error: 'User not found' });
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: 'Current password is incorrect',
      });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

    // Invalidate all refresh tokens
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

    return reply.send({
      success: true,
      data: null,
      error: null,
      message: 'Password changed successfully. Please log in again.',
    });
  });
}
