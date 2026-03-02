import * as SQLite from 'expo-sqlite';
import type { Item, Assignment, Category, Department, Location } from '@starlight/shared';

const DB_NAME = 'starlight_inventory.db';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

export async function initLocalDB(): Promise<void> {
  const database = getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      item_code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      barcode TEXT,
      qr_code TEXT,
      purchase_date TEXT,
      purchase_price REAL,
      warranty_expiry TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      condition TEXT NOT NULL DEFAULT 'good',
      notes TEXT,
      image_url TEXT,
      created_by TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      employee_id TEXT,
      department_id TEXT,
      location_id TEXT,
      assigned_by TEXT,
      assigned_at TEXT NOT NULL,
      returned_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      manager_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      building TEXT,
      floor TEXT,
      room TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
    CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
  `);
}

// ─── Items ───────────────────────────────────────────────────

export const localItems = {
  getAll: (filter?: { status?: string; search?: string }): Item[] => {
    const database = getDb();
    let sql = 'SELECT * FROM items WHERE deleted_at IS NULL';
    const params: unknown[] = [];

    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter?.search) {
      sql += ' AND (name LIKE ? OR item_code LIKE ? OR serial_number LIKE ?)';
      params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
    }

    sql += ' ORDER BY updated_at DESC';
    return database.getAllSync(sql, params) as Item[];
  },

  getById: (id: string): Item | null => {
    const database = getDb();
    return database.getFirstSync('SELECT * FROM items WHERE id = ? LIMIT 1', [id]) as Item | null;
  },

  getByCode: (code: string): Item | null => {
    const database = getDb();
    return database.getFirstSync(
      'SELECT * FROM items WHERE (barcode = ? OR item_code = ? OR serial_number = ?) AND deleted_at IS NULL LIMIT 1',
      [code, code, code]
    ) as Item | null;
  },

  upsert: (item: Item): void => {
    const database = getDb();
    database.runSync(
      `INSERT OR REPLACE INTO items
         (id, item_code, name, description, category_id, brand, model, serial_number,
          barcode, qr_code, purchase_date, purchase_price, warranty_expiry, status,
          condition, notes, image_url, created_by, sync_status, created_at, updated_at, deleted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        item.id, item.item_code, item.name, item.description ?? null,
        item.category_id ?? null, item.brand ?? null, item.model ?? null,
        item.serial_number ?? null, item.barcode ?? null, item.qr_code ?? null,
        item.purchase_date ?? null, item.purchase_price ?? null,
        item.warranty_expiry ?? null, item.status, item.condition,
        item.notes ?? null, item.image_url ?? null, item.created_by ?? null,
        item.sync_status ?? 'synced', item.created_at, item.updated_at,
        item.deleted_at ?? null,
      ]
    );
  },

  upsertMany: (items: Item[]): void => {
    const database = getDb();
    database.withTransactionSync(() => {
      for (const item of items) {
        localItems.upsert(item);
      }
    });
  },

  markPending: (id: string): void => {
    const database = getDb();
    database.runSync(
      "UPDATE items SET sync_status = 'pending', updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );
  },
};

// ─── Sync Queue ──────────────────────────────────────────────

export const syncQueue = {
  add: (entityType: string, entityId: string, action: string, data: object): void => {
    const database = getDb();
    database.runSync(
      'INSERT INTO sync_queue (entity_type, entity_id, action, data, updated_at) VALUES (?,?,?,?,?)',
      [entityType, entityId, action, JSON.stringify(data), new Date().toISOString()]
    );
  },

  getPending: (): Array<{
    id: number;
    entity_type: string;
    entity_id: string;
    action: string;
    data: string;
    updated_at: string;
  }> => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM sync_queue ORDER BY created_at') as ReturnType<typeof syncQueue.getPending>;
  },

  remove: (id: number): void => {
    const database = getDb();
    database.runSync('DELETE FROM sync_queue WHERE id = ?', [id]);
  },

  clear: (): void => {
    const database = getDb();
    database.runSync('DELETE FROM sync_queue');
  },
};

// ─── Reference Data ──────────────────────────────────────────

export const localRef = {
  upsertCategories: (categories: Category[]): void => {
    const database = getDb();
    database.withTransactionSync(() => {
      for (const cat of categories) {
        database.runSync(
          'INSERT OR REPLACE INTO categories (id, name, parent_id, description, created_at) VALUES (?,?,?,?,?)',
          [cat.id, cat.name, cat.parent_id ?? null, cat.description ?? null, cat.created_at]
        );
      }
    });
  },

  getCategories: (): Category[] => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM categories ORDER BY name') as Category[];
  },

  upsertDepartments: (departments: Department[]): void => {
    const database = getDb();
    database.withTransactionSync(() => {
      for (const dept of departments) {
        database.runSync(
          'INSERT OR REPLACE INTO departments (id, name, description, manager_id, created_at, updated_at) VALUES (?,?,?,?,?,?)',
          [dept.id, dept.name, dept.description ?? null, dept.manager_id ?? null, dept.created_at, dept.updated_at]
        );
      }
    });
  },

  getDepartments: (): Department[] => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM departments ORDER BY name') as Department[];
  },

  upsertLocations: (locations: Location[]): void => {
    const database = getDb();
    database.withTransactionSync(() => {
      for (const loc of locations) {
        database.runSync(
          'INSERT OR REPLACE INTO locations (id, name, building, floor, room, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
          [loc.id, loc.name, loc.building ?? null, loc.floor ?? null, loc.room ?? null, loc.created_at, loc.updated_at]
        );
      }
    });
  },

  getLocations: (): Location[] => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM locations ORDER BY name') as Location[];
  },
};
