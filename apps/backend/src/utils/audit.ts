import { db } from '../db/client';
import { AuditAction } from '@starlight/shared';

export async function logAudit(params: {
  entity_type: string;
  entity_id?: string;
  action: AuditAction;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  performed_by?: string;
}): Promise<void> {
  try {
    await db.query(
      `INSERT INTO audit_log (entity_type, entity_id, action, old_value, new_value, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.entity_type,
        params.entity_id ?? null,
        params.action,
        params.old_value ? JSON.stringify(params.old_value) : null,
        params.new_value ? JSON.stringify(params.new_value) : null,
        params.performed_by ?? null,
      ]
    );
  } catch (err) {
    // Audit failures should not break main operations
    console.error('Audit log failed:', err);
  }
}
