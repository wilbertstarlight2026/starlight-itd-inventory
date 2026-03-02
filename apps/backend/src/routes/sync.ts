import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAuth } from '../middleware/auth';

const syncSchema = z.object({
  device_id: z.string().min(1),
  last_sync_at: z.string().datetime().optional(),
  pending_items: z.array(z.object({
    local_id: z.string(),
    action: z.enum(['create', 'update', 'delete']),
    data: z.record(z.unknown()),
    updated_at: z.string(),
  })).optional().default([]),
  pending_assignments: z.array(z.object({
    local_id: z.string(),
    action: z.enum(['create', 'update']),
    data: z.record(z.unknown()),
    updated_at: z.string(),
  })).optional().default([]),
});

export async function syncRoutes(app: FastifyInstance) {
  // POST /sync — Full delta sync
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = syncSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: parsed.error.errors[0]?.message || 'Invalid sync payload',
      });
    }

    const { device_id, last_sync_at, pending_items, pending_assignments } = parsed.data;
    const serverTime = new Date().toISOString();
    const since = last_sync_at ? new Date(last_sync_at) : new Date(0);
    const conflicts: unknown[] = [];

    await db.transaction(async (client) => {
      // Process pending items from client
      for (const pending of pending_items) {
        if (pending.action === 'create' || pending.action === 'update') {
          const data = pending.data as Record<string, unknown>;
          const itemId = data.id as string | undefined;

          if (itemId) {
            const existing = await client.query(
              'SELECT id, updated_at FROM items WHERE id = $1 AND deleted_at IS NULL',
              [itemId]
            );

            if (existing.rows.length > 0) {
              const serverUpdated = new Date(existing.rows[0].updated_at as string);
              const clientUpdated = new Date(pending.updated_at);

              if (clientUpdated > serverUpdated) {
                // Client wins — update server
                await client.query(
                  `UPDATE items SET
                     name = COALESCE($1, name),
                     status = COALESCE($2, status),
                     condition = COALESCE($3, condition),
                     notes = COALESCE($4, notes),
                     updated_at = $5,
                     sync_status = 'synced'
                   WHERE id = $6`,
                  [data.name ?? null, data.status ?? null, data.condition ?? null, data.notes ?? null, pending.updated_at, itemId]
                );
              } else {
                // Server wins — record conflict
                conflicts.push({
                  entity_type: 'item',
                  entity_id: itemId,
                  local_version: data,
                  server_version: existing.rows[0],
                  resolution: 'server_wins',
                });
              }
            }
          }
        } else if (pending.action === 'delete') {
          const data = pending.data as Record<string, unknown>;
          if (data.id) {
            await client.query(
              'UPDATE items SET deleted_at = NOW() WHERE id = $1',
              [data.id]
            );
          }
        }
      }

      // Update sync metadata
      await client.query(
        `INSERT INTO sync_metadata (device_id, user_id, table_name, last_sync_at)
         VALUES ($1, $2, 'items', NOW())
         ON CONFLICT (device_id, table_name) DO UPDATE SET last_sync_at = NOW()`,
        [device_id, request.user.sub]
      );
    });

    // Fetch delta since last sync
    const [items, assignments, categories, departments, locations, users] = await Promise.all([
      db.query(
        `SELECT * FROM items WHERE updated_at > $1 AND deleted_at IS NULL ORDER BY updated_at`,
        [since]
      ),
      db.query(
        `SELECT * FROM assignments WHERE updated_at > $1 ORDER BY updated_at`,
        [since]
      ),
      db.query('SELECT * FROM categories ORDER BY name'),
      db.query('SELECT id, name, description, manager_id FROM departments ORDER BY name'),
      db.query('SELECT * FROM locations ORDER BY name'),
      db.query(
        'SELECT id, name, email, role, department_id FROM users WHERE is_active = true ORDER BY name'
      ),
    ]);

    return reply.send({
      success: true,
      data: {
        server_time: serverTime,
        items: items.rows,
        assignments: assignments.rows,
        categories: categories.rows,
        departments: departments.rows,
        locations: locations.rows,
        users: users.rows,
        conflicts,
      },
      error: null,
    });
  });

  // GET /sync/status — Check last sync time for a device
  app.get('/status', { preHandler: requireAuth }, async (request, reply) => {
    const { device_id } = request.query as { device_id?: string };

    if (!device_id) {
      return reply.status(400).send({ success: false, data: null, error: 'device_id required' });
    }

    const result = await db.query(
      'SELECT * FROM sync_metadata WHERE device_id = $1 ORDER BY last_sync_at DESC',
      [device_id]
    );

    return reply.send({ success: true, data: result.rows, error: null });
  });
}
