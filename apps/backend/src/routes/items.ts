import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { requireAuth, requireManagerOrAdmin } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { generateItemCode } from '../utils/itemCode';
import type { Item, ItemFilters } from '@starlight/shared';

const createItemSchema = z.object({
  item_code: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serial_number: z.string().max(100).optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().positive().optional(),
  warranty_expiry: z.string().optional(),
  status: z.enum(['available', 'in_use', 'under_repair', 'reserved', 'retired', 'disposed']).optional(),
  condition: z.enum(['new', 'good', 'fair', 'poor', 'damaged']).optional(),
  notes: z.string().optional(),
});

export async function itemRoutes(app: FastifyInstance) {
  // GET /items — List with search, filter, pagination
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as ItemFilters;
    const page = Math.max(1, parseInt(String(query.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 20))));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['i.deleted_at IS NULL'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (query.search) {
      conditions.push(`(i.name ILIKE $${paramIdx} OR i.item_code ILIKE $${paramIdx} OR i.serial_number ILIKE $${paramIdx} OR i.barcode ILIKE $${paramIdx})`);
      params.push(`%${query.search}%`);
      paramIdx++;
    }

    if (query.status) {
      conditions.push(`i.status = $${paramIdx}`);
      params.push(query.status);
      paramIdx++;
    }

    if (query.condition) {
      conditions.push(`i.condition = $${paramIdx}`);
      params.push(query.condition);
      paramIdx++;
    }

    if (query.category_id) {
      conditions.push(`i.category_id = $${paramIdx}`);
      params.push(query.category_id);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = `ORDER BY i.${query.sort_by || 'created_at'} ${query.sort_order === 'asc' ? 'ASC' : 'DESC'}`;

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM items i ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    const result = await db.query<Item>(
      `SELECT i.*,
              c.name as category_name,
              c.parent_id as category_parent_id,
              a.id as assignment_id,
              a.employee_id as assignment_employee_id,
              a.department_id as assignment_department_id,
              a.location_id as assignment_location_id,
              a.assigned_at as assignment_assigned_at,
              u.name as assigned_to_name
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN assignments a ON a.item_id = i.id AND a.returned_at IS NULL
       LEFT JOIN users u ON a.employee_id = u.id
       ${whereClause}
       ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return reply.send({
      success: true,
      data: result.rows,
      error: null,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  });

  // GET /items/:id
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const result = await db.query<Item>(
        `SELECT i.*,
                c.name as category_name,
                row_to_json(a.*) as current_assignment
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         LEFT JOIN assignments a ON a.item_id = i.id AND a.returned_at IS NULL
         WHERE i.id = $1 AND i.deleted_at IS NULL`,
        [request.params.id]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Item not found' });
      }

      // Get assignment history
      const history = await db.query(
        `SELECT a.*,
                u.name as employee_name,
                d.name as department_name,
                l.name as location_name,
                ab.name as assigned_by_name
         FROM assignments a
         LEFT JOIN users u ON a.employee_id = u.id
         LEFT JOIN departments d ON a.department_id = d.id
         LEFT JOIN locations l ON a.location_id = l.id
         LEFT JOIN users ab ON a.assigned_by = ab.id
         WHERE a.item_id = $1
         ORDER BY a.assigned_at DESC`,
        [request.params.id]
      );

      return reply.send({
        success: true,
        data: { ...result.rows[0], assignment_history: history.rows },
        error: null,
      });
    }
  );

  // GET /items/scan/:code — Scan by barcode or item_code
  app.get<{ Params: { code: string } }>(
    '/scan/:code',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { code } = request.params;
      const result = await db.query<Item>(
        `SELECT i.*, c.name as category_name
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE (i.barcode = $1 OR i.item_code = $1 OR i.serial_number = $1)
           AND i.deleted_at IS NULL
         LIMIT 1`,
        [code]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Item not found' });
      }

      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );

  // POST /items
  app.post('/', { preHandler: requireManagerOrAdmin }, async (request, reply) => {
    const parsed = createItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      });
    }

    const data = parsed.data;
    const itemCode = data.item_code || (await generateItemCode());

    const result = await db.query<Item>(
      `INSERT INTO items (
         item_code, name, description, category_id, brand, model, serial_number,
         purchase_date, purchase_price, warranty_expiry, status, condition, notes, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        itemCode,
        data.name,
        data.description ?? null,
        data.category_id ?? null,
        data.brand ?? null,
        data.model ?? null,
        data.serial_number ?? null,
        data.purchase_date ?? null,
        data.purchase_price ?? null,
        data.warranty_expiry ?? null,
        data.status ?? 'available',
        data.condition ?? 'good',
        data.notes ?? null,
        request.user.sub,
      ]
    );

    const item = result.rows[0];

    // Generate barcode value = item_code
    await db.query('UPDATE items SET barcode = $1 WHERE id = $2', [itemCode, item.id]);

    await logAudit({
      entity_type: 'item',
      entity_id: item.id,
      action: 'create',
      new_value: item as Record<string, unknown>,
      performed_by: request.user.sub,
    });

    return reply.status(201).send({ success: true, data: { ...item, barcode: itemCode }, error: null });
  });

  // PATCH /items/:id
  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireManagerOrAdmin },
    async (request, reply) => {
      const oldResult = await db.query<Item>(
        'SELECT * FROM items WHERE id = $1 AND deleted_at IS NULL',
        [request.params.id]
      );

      if (!oldResult.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Item not found' });
      }

      const parsed = createItemSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          data: null,
          error: parsed.error.errors[0]?.message || 'Invalid input',
        });
      }

      const data = parsed.data;
      const old = oldResult.rows[0];

      const result = await db.query<Item>(
        `UPDATE items SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           category_id = COALESCE($3, category_id),
           brand = COALESCE($4, brand),
           model = COALESCE($5, model),
           serial_number = COALESCE($6, serial_number),
           purchase_date = COALESCE($7, purchase_date),
           purchase_price = COALESCE($8, purchase_price),
           warranty_expiry = COALESCE($9, warranty_expiry),
           status = COALESCE($10, status),
           condition = COALESCE($11, condition),
           notes = COALESCE($12, notes),
           updated_at = NOW()
         WHERE id = $13 AND deleted_at IS NULL
         RETURNING *`,
        [
          data.name ?? null,
          data.description ?? null,
          data.category_id ?? null,
          data.brand ?? null,
          data.model ?? null,
          data.serial_number ?? null,
          data.purchase_date ?? null,
          data.purchase_price ?? null,
          data.warranty_expiry ?? null,
          data.status ?? null,
          data.condition ?? null,
          data.notes ?? null,
          request.params.id,
        ]
      );

      await logAudit({
        entity_type: 'item',
        entity_id: request.params.id,
        action: 'update',
        old_value: old as Record<string, unknown>,
        new_value: result.rows[0] as Record<string, unknown>,
        performed_by: request.user.sub,
      });

      return reply.send({ success: true, data: result.rows[0], error: null });
    }
  );

  // DELETE /items/:id (soft delete)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireManagerOrAdmin },
    async (request, reply) => {
      const result = await db.query<Item>(
        'UPDATE items SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
        [request.params.id]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({ success: false, data: null, error: 'Item not found' });
      }

      await logAudit({
        entity_type: 'item',
        entity_id: request.params.id,
        action: 'delete',
        performed_by: request.user.sub,
      });

      return reply.send({ success: true, data: null, error: null, message: 'Item deleted' });
    }
  );
}
