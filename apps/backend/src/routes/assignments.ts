import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAuth, requireManagerOrAdmin } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const assignSchema = z.object({
  item_id: z.string().uuid(),
  employee_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export async function assignmentRoutes(app: FastifyInstance) {
  // GET /assignments — All active assignments
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as { item_id?: string; employee_id?: string; active?: string };

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (query.item_id) {
      conditions.push(`a.item_id = $${idx++}`);
      params.push(query.item_id);
    }

    if (query.employee_id) {
      conditions.push(`a.employee_id = $${idx++}`);
      params.push(query.employee_id);
    }

    if (query.active === 'true') {
      conditions.push('a.returned_at IS NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT a.*,
              i.name as item_name, i.item_code, i.status as item_status,
              u.name as employee_name,
              d.name as department_name,
              l.name as location_name,
              ab.name as assigned_by_name
       FROM assignments a
       LEFT JOIN items i ON a.item_id = i.id
       LEFT JOIN users u ON a.employee_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN locations l ON a.location_id = l.id
       LEFT JOIN users ab ON a.assigned_by = ab.id
       ${whereClause}
       ORDER BY a.assigned_at DESC`,
      params
    );

    return reply.send({ success: true, data: result.rows, error: null });
  });

  // POST /assignments — Assign item
  app.post('/', { preHandler: requireManagerOrAdmin }, async (request, reply) => {
    const parsed = assignSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      });
    }

    const { item_id, employee_id, department_id, location_id, notes } = parsed.data;

    // Verify item exists and is available
    const itemResult = await db.query(
      "SELECT id, status FROM items WHERE id = $1 AND deleted_at IS NULL",
      [item_id]
    );

    const item = itemResult.rows[0] as { id: string; status: string } | undefined;
    if (!item) {
      return reply.status(404).send({ success: false, data: null, error: 'Item not found' });
    }

    if (item.status === 'retired' || item.status === 'disposed') {
      return reply.status(400).send({
        success: false,
        data: null,
        error: `Cannot assign item with status: ${item.status}`,
      });
    }

    // Close any existing active assignment
    await db.query(
      "UPDATE assignments SET returned_at = NOW() WHERE item_id = $1 AND returned_at IS NULL",
      [item_id]
    );

    const result = await db.transaction(async (client) => {
      const assignment = await client.query(
        `INSERT INTO assignments (item_id, employee_id, department_id, location_id, assigned_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [item_id, employee_id ?? null, department_id ?? null, location_id ?? null, request.user.sub, notes ?? null]
      );

      await client.query(
        "UPDATE items SET status = 'in_use', updated_at = NOW() WHERE id = $1",
        [item_id]
      );

      return assignment.rows[0];
    });

    await logAudit({
      entity_type: 'assignment',
      entity_id: result.id,
      action: 'assign',
      new_value: result as Record<string, unknown>,
      performed_by: request.user.sub,
    });

    return reply.status(201).send({ success: true, data: result, error: null });
  });

  // POST /assignments/:id/return — Return item
  app.post<{ Params: { id: string } }>(
    '/:id/return',
    { preHandler: requireManagerOrAdmin },
    async (request, reply) => {
      const result = await db.query(
        `UPDATE assignments SET returned_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND returned_at IS NULL
         RETURNING *`,
        [request.params.id]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({
          success: false,
          data: null,
          error: 'Assignment not found or already returned',
        });
      }

      const assignment = result.rows[0] as { item_id: string };

      // Set item back to available
      await db.query(
        "UPDATE items SET status = 'available', updated_at = NOW() WHERE id = $1",
        [assignment.item_id]
      );

      await logAudit({
        entity_type: 'assignment',
        entity_id: request.params.id,
        action: 'return',
        performed_by: request.user.sub,
      });

      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );
}
