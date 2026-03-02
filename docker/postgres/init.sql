-- ============================================================
-- Starlight ITD Inventory System — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ─── ENUMS ──────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

CREATE TYPE item_status AS ENUM (
  'available',
  'in_use',
  'under_repair',
  'reserved',
  'retired',
  'disposed'
);

CREATE TYPE item_condition AS ENUM (
  'new',
  'good',
  'fair',
  'poor',
  'damaged'
);

CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');

CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'assign',
  'return',
  'login',
  'logout'
);

-- ─── DEPARTMENTS ─────────────────────────────────────────────

CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USERS ───────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update departments to allow manager_id reference
ALTER TABLE departments ADD COLUMN manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ─── REFRESH TOKENS ──────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_id   VARCHAR(255),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LOCATIONS ───────────────────────────────────────────────

CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  building    VARCHAR(100),
  floor       VARCHAR(50),
  room        VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(building, floor, room)
);

-- ─── CATEGORIES ──────────────────────────────────────────────

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ITEMS ───────────────────────────────────────────────────

CREATE TABLE items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code        VARCHAR(50) NOT NULL UNIQUE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand            VARCHAR(100),
  model            VARCHAR(100),
  serial_number    VARCHAR(100) UNIQUE,
  barcode          VARCHAR(255) UNIQUE,
  qr_code          TEXT,
  purchase_date    DATE,
  purchase_price   NUMERIC(12, 2),
  warranty_expiry  DATE,
  status           item_status NOT NULL DEFAULT 'available',
  condition        item_condition NOT NULL DEFAULT 'good',
  notes            TEXT,
  image_url        VARCHAR(500),
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  sync_status      sync_status NOT NULL DEFAULT 'synced',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

-- Indexes for search performance
CREATE INDEX idx_items_status ON items(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_category ON items(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_name_trgm ON items USING GIN (name gin_trgm_ops);
CREATE INDEX idx_items_barcode ON items(barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_updated_at ON items(updated_at);

-- ─── ASSIGNMENTS ─────────────────────────────────────────────

CREATE TABLE assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  employee_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  location_id   UUID REFERENCES locations(id) ON DELETE SET NULL,
  assigned_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_item ON assignments(item_id);
CREATE INDEX idx_assignments_employee ON assignments(employee_id);
CREATE INDEX idx_assignments_active ON assignments(item_id) WHERE returned_at IS NULL;

-- ─── AUDIT LOG ───────────────────────────────────────────────

CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type  VARCHAR(50) NOT NULL,
  entity_id    UUID,
  action       audit_action NOT NULL,
  old_value    JSONB,
  new_value    JSONB,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_performed_at ON audit_log(performed_at);
CREATE INDEX idx_audit_performed_by ON audit_log(performed_by);

-- ─── SYNC METADATA ───────────────────────────────────────────

CREATE TABLE sync_metadata (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id    VARCHAR(255) NOT NULL,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  table_name   VARCHAR(50) NOT NULL,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(device_id, table_name)
);

-- ─── AUTO-UPDATE updated_at TRIGGER ──────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── SEED: CATEGORIES ────────────────────────────────────────

INSERT INTO categories (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Computer', 'Computing devices'),
  ('11111111-1111-1111-1111-111111111102', 'Printer', 'Printing equipment'),
  ('11111111-1111-1111-1111-111111111103', 'Network', 'Networking equipment'),
  ('11111111-1111-1111-1111-111111111104', 'Audio Visual', 'AV equipment'),
  ('11111111-1111-1111-1111-111111111105', 'Peripheral', 'Computer peripherals'),
  ('11111111-1111-1111-1111-111111111106', 'Accessories', 'Cables and accessories'),
  ('11111111-1111-1111-1111-111111111107', 'Spare Parts', 'Computer spare parts'),
  ('11111111-1111-1111-1111-111111111108', 'Office Supplies', 'Office furniture and supplies'),
  ('11111111-1111-1111-1111-111111111109', 'General Assets', 'Other company-owned property');

INSERT INTO categories (name, parent_id, description) VALUES
  ('Desktop', '11111111-1111-1111-1111-111111111101', 'Desktop computers'),
  ('Laptop', '11111111-1111-1111-1111-111111111101', 'Laptop computers'),
  ('Tablet', '11111111-1111-1111-1111-111111111101', 'Tablet devices'),
  ('Server', '11111111-1111-1111-1111-111111111101', 'Server hardware'),
  ('Inkjet Printer', '11111111-1111-1111-1111-111111111102', 'Inkjet printers'),
  ('Laser Printer', '11111111-1111-1111-1111-111111111102', 'Laser printers'),
  ('Label Printer', '11111111-1111-1111-1111-111111111102', 'Label printers'),
  ('MFP', '11111111-1111-1111-1111-111111111102', 'Multi-function printers'),
  ('Router', '11111111-1111-1111-1111-111111111103', 'Network routers'),
  ('Switch', '11111111-1111-1111-1111-111111111103', 'Network switches'),
  ('Access Point', '11111111-1111-1111-1111-111111111103', 'WiFi access points'),
  ('Modem', '11111111-1111-1111-1111-111111111103', 'Modems'),
  ('Projector', '11111111-1111-1111-1111-111111111104', 'Projectors'),
  ('Monitor', '11111111-1111-1111-1111-111111111104', 'Monitors and displays'),
  ('Keyboard', '11111111-1111-1111-1111-111111111105', 'Keyboards'),
  ('Mouse', '11111111-1111-1111-1111-111111111105', 'Mice'),
  ('Webcam', '11111111-1111-1111-1111-111111111105', 'Webcams');

-- ─── SEED: DEPARTMENTS ───────────────────────────────────────

INSERT INTO departments (name, description) VALUES
  ('IT Department', 'Information Technology'),
  ('Finance', 'Finance and Accounting'),
  ('HR', 'Human Resources'),
  ('Operations', 'Business Operations'),
  ('Sales', 'Sales and Marketing'),
  ('Management', 'Executive Management');

-- ─── SEED: LOCATIONS ─────────────────────────────────────────

INSERT INTO locations (name, building, floor, room) VALUES
  ('IT Room', 'Main Building', '2nd Floor', 'Room 201'),
  ('Conference Room A', 'Main Building', '1st Floor', 'Room 101'),
  ('Conference Room B', 'Main Building', '1st Floor', 'Room 102'),
  ('Finance Office', 'Main Building', '2nd Floor', 'Room 202'),
  ('HR Office', 'Main Building', '2nd Floor', 'Room 203'),
  ('Server Room', 'Main Building', '3rd Floor', 'Room 301'),
  ('Reception', 'Main Building', '1st Floor', 'Lobby'),
  ('Warehouse', 'Annex Building', '1st Floor', 'Storage');

-- Note: Default admin user is created via npm run seed in the backend
