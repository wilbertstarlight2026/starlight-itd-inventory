import type { PoolClient } from 'pg';
import { db } from '../db/client';

/**
 * Generates a unique item code: STL-YYYYMM-NNNN
 * Uses a FOR UPDATE lock inside a transaction to prevent race conditions.
 * Must be called inside a db.transaction() so the lock is held through the INSERT.
 */
export async function generateItemCode(client?: PoolClient): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `STL-${year}${month}-`;

  const query = `
    SELECT item_code FROM items
    WHERE item_code LIKE $1
    ORDER BY item_code DESC
    LIMIT 1
    FOR UPDATE`;

  const result = client
    ? await client.query<{ item_code: string }>(query, [`${prefix}%`])
    : await db.query<{ item_code: string }>(query.replace('FOR UPDATE', ''), [`${prefix}%`]);

  let sequence = 1;
  if (result.rows.length > 0) {
    const parts = result.rows[0].item_code.split('-');
    const lastSeq = parseInt(parts[2] || '0', 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}
