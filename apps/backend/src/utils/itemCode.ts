import { db } from '../db/client';

/**
 * Generates a unique item code: STL-YYYYMM-NNNN
 * Example: STL-202601-0001
 */
export async function generateItemCode(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `STL-${year}${month}-`;

  const result = await db.query<{ item_code: string }>(
    `SELECT item_code FROM items
     WHERE item_code LIKE $1
     ORDER BY item_code DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  let sequence = 1;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].item_code;
    const lastSeq = parseInt(lastCode.split('-')[2] || '0', 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}
