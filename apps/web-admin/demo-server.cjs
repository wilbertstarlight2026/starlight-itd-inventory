/**
 * Demo Server — in-memory mock backend for the web admin UI
 * Run: node demo-server.cjs
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const SECRET = 'demo_secret_key';
const ADMIN_HASH = bcrypt.hashSync('Admin@1234', 10);

// ─── In-memory data ───────────────────────────────────────────────────────────

const users = [
  { id: 'u1', name: 'IT Admin', email: 'admin@starlight.com', role: 'admin', department_id: 'd1', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'u2', name: 'Maria Santos', email: 'maria@starlight.com', role: 'manager', department_id: 'd2', is_active: true, created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'u3', name: 'Juan dela Cruz', email: 'juan@starlight.com', role: 'user', department_id: 'd3', is_active: true, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { id: 'u4', name: 'Ana Reyes', email: 'ana@starlight.com', role: 'user', department_id: 'd2', is_active: true, created_at: '2026-01-12T00:00:00Z', updated_at: '2026-01-12T00:00:00Z' },
  { id: 'u5', name: 'Carlo Bautista', email: 'carlo@starlight.com', role: 'manager', department_id: 'd1', is_active: false, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
];

const departments = [
  { id: 'd1', name: 'IT Department', description: 'Information Technology', manager_id: 'u1', department_name: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'd2', name: 'Finance', description: 'Finance and Accounting', manager_id: 'u2', department_name: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'd3', name: 'HR', description: 'Human Resources', manager_id: null, department_name: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'd4', name: 'Operations', description: 'Business Operations', manager_id: null, department_name: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'd5', name: 'Sales', description: 'Sales and Marketing', manager_id: null, department_name: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const categories = [
  { id: 'c1', name: 'Computer', parent_id: null, description: 'Computing devices', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c2', name: 'Printer', parent_id: null, description: 'Printing equipment', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c3', name: 'Network', parent_id: null, description: 'Networking equipment', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c4', name: 'Audio Visual', parent_id: null, description: 'AV equipment', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c5', name: 'Peripheral', parent_id: null, description: 'Computer peripherals', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c6', name: 'Accessories', parent_id: null, description: 'Cables and accessories', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c7', name: 'Spare Parts', parent_id: null, description: 'Computer spare parts', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c8', name: 'Office Supplies', parent_id: null, description: 'Office furniture', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c9', name: 'General Assets', parent_id: null, description: 'Other assets', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c10', name: 'Laptop', parent_id: 'c1', description: 'Laptop computers', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c11', name: 'Desktop', parent_id: 'c1', description: 'Desktop computers', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c12', name: 'Monitor', parent_id: 'c4', description: 'Monitors', created_at: '2026-01-01T00:00:00Z' },
];

const locations = [
  { id: 'l1', name: 'IT Room', building: 'Main Building', floor: '2nd Floor', room: 'Room 201', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'l2', name: 'Conference Room A', building: 'Main Building', floor: '1st Floor', room: 'Room 101', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'l3', name: 'Finance Office', building: 'Main Building', floor: '2nd Floor', room: 'Room 202', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'l4', name: 'Server Room', building: 'Main Building', floor: '3rd Floor', room: 'Room 301', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'l5', name: 'HR Office', building: 'Main Building', floor: '2nd Floor', room: 'Room 203', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const items = [
  { id: 'i1', item_code: 'STL-202601-0001', name: 'Dell XPS 15 Laptop', description: 'Primary workstation for IT Admin', category_id: 'c10', category_name: 'Laptop', brand: 'Dell', model: 'XPS 15 9500', serial_number: 'DL-XPS-001', barcode: 'STL-202601-0001', qr_code: null, purchase_date: '2024-06-15', purchase_price: 85000, warranty_expiry: '2027-06-15', status: 'in_use', condition: 'good', notes: null, image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z', deleted_at: null, assigned_to_name: 'IT Admin' },
  { id: 'i2', item_code: 'STL-202601-0002', name: 'HP LaserJet Pro M404n', description: 'Office laser printer', category_id: 'c2', category_name: 'Printer', brand: 'HP', model: 'LaserJet Pro M404n', serial_number: 'HP-LJ-002', barcode: 'STL-202601-0002', qr_code: null, purchase_date: '2024-03-01', purchase_price: 22000, warranty_expiry: '2026-03-01', status: 'available', condition: 'good', notes: 'Toner replaced Feb 2026', image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i3', item_code: 'STL-202601-0003', name: 'Cisco SG350 Network Switch', description: '24-port managed switch', category_id: 'c3', category_name: 'Network', brand: 'Cisco', model: 'SG350-28', serial_number: 'CS-SW-003', barcode: 'STL-202601-0003', qr_code: null, purchase_date: '2023-11-20', purchase_price: 35000, warranty_expiry: '2026-11-20', status: 'in_use', condition: 'good', notes: 'Located in server room', image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i4', item_code: 'STL-202601-0004', name: 'Lenovo ThinkPad E14', description: 'Finance department laptop', category_id: 'c10', category_name: 'Laptop', brand: 'Lenovo', model: 'ThinkPad E14 Gen 4', serial_number: 'LN-TP-004', barcode: 'STL-202601-0004', qr_code: null, purchase_date: '2024-09-01', purchase_price: 55000, warranty_expiry: '2027-09-01', status: 'in_use', condition: 'good', notes: null, image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z', deleted_at: null, assigned_to_name: 'Maria Santos' },
  { id: 'i5', item_code: 'STL-202601-0005', name: 'BenQ GW2780 Monitor', description: '27-inch FHD IPS monitor', category_id: 'c12', category_name: 'Monitor', brand: 'BenQ', model: 'GW2780', serial_number: 'BQ-MN-005', barcode: 'STL-202601-0005', qr_code: null, purchase_date: '2024-06-15', purchase_price: 14500, warranty_expiry: '2027-06-15', status: 'available', condition: 'new', notes: null, image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-20T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i6', item_code: 'STL-202601-0006', name: 'Epson EcoTank L3210', description: 'HR department printer', category_id: 'c2', category_name: 'Printer', brand: 'Epson', model: 'EcoTank L3210', serial_number: 'EP-ET-006', barcode: 'STL-202601-0006', qr_code: null, purchase_date: '2024-01-10', purchase_price: 10500, warranty_expiry: '2026-01-10', status: 'under_repair', condition: 'poor', notes: 'Paper jam issue — sent to service center', image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-02-15T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i7', item_code: 'STL-202601-0007', name: 'TP-Link Archer AX50 Router', description: 'Main office WiFi router', category_id: 'c3', category_name: 'Network', brand: 'TP-Link', model: 'Archer AX50', serial_number: 'TP-RT-007', barcode: 'STL-202601-0007', qr_code: null, purchase_date: '2025-01-15', purchase_price: 4800, warranty_expiry: '2027-01-15', status: 'in_use', condition: 'good', notes: null, image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-01-25T00:00:00Z', updated_at: '2026-01-25T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i8', item_code: 'STL-202601-0008', name: 'ASUS TUF Gaming Desktop', description: 'Graphics workstation', category_id: 'c11', category_name: 'Desktop', brand: 'ASUS', model: 'TUF Gaming GT501', serial_number: 'AS-DT-008', barcode: 'STL-202601-0008', qr_code: null, purchase_date: '2023-06-20', purchase_price: 120000, warranty_expiry: '2026-06-20', status: 'available', condition: 'fair', notes: 'Upgraded RAM to 32GB', image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i9', item_code: 'STL-202601-0009', name: 'Sony SRS-XB23 Speaker', description: 'Conference room speaker', category_id: 'c4', category_name: 'Audio Visual', brand: 'Sony', model: 'SRS-XB23', serial_number: 'SN-SP-009', barcode: 'STL-202601-0009', qr_code: null, purchase_date: '2025-03-01', purchase_price: 3200, warranty_expiry: '2027-03-01', status: 'reserved', condition: 'new', notes: 'Reserved for Conference Room A', image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-02-05T00:00:00Z', updated_at: '2026-02-05T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i10', item_code: 'STL-202601-0010', name: 'IBM ThinkCentre Desktop', description: 'Old finance workstation', category_id: 'c11', category_name: 'Desktop', brand: 'IBM', model: 'ThinkCentre M50', serial_number: 'IBM-DT-010', barcode: 'STL-202601-0010', qr_code: null, purchase_date: '2018-01-01', purchase_price: 28000, warranty_expiry: '2021-01-01', status: 'retired', condition: 'poor', notes: 'Replaced — kept for spare parts', image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z', deleted_at: null, assigned_to_name: null },
  { id: 'i11', item_code: 'STL-202601-0011', name: 'Logitech MX Master 3S Mouse', description: 'IT admin wireless mouse', category_id: 'c5', category_name: 'Peripheral', brand: 'Logitech', model: 'MX Master 3S', serial_number: 'LG-MS-011', barcode: 'STL-202601-0011', qr_code: null, purchase_date: '2025-06-01', purchase_price: 5500, warranty_expiry: '2027-06-01', status: 'in_use', condition: 'new', notes: null, image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-02-15T00:00:00Z', updated_at: '2026-02-15T00:00:00Z', deleted_at: null, assigned_to_name: 'IT Admin' },
  { id: 'i12', item_code: 'STL-202601-0012', name: 'ViewSonic VA2732 Monitor', description: '27-inch monitor for HR', category_id: 'c12', category_name: 'Monitor', brand: 'ViewSonic', model: 'VA2732-H', serial_number: 'VS-MN-012', barcode: 'STL-202601-0012', qr_code: null, purchase_date: '2024-11-01', purchase_price: 12000, warranty_expiry: '2027-11-01', status: 'in_use', condition: 'good', notes: null, image_url: null, created_by: 'u1', sync_status: 'synced', created_at: '2026-02-20T00:00:00Z', updated_at: '2026-02-20T00:00:00Z', deleted_at: null, assigned_to_name: 'Juan dela Cruz' },
];

const recentActivity = [
  { id: 'a1', entity_type: 'item', entity_id: 'i11', action: 'create', old_value: null, new_value: null, performed_by: 'u1', performed_by_name: 'IT Admin', performed_at: '2026-02-15T09:30:00Z' },
  { id: 'a2', entity_type: 'assignment', entity_id: 'i4', action: 'assign', old_value: null, new_value: null, performed_by: 'u1', performed_by_name: 'IT Admin', performed_at: '2026-02-12T14:20:00Z' },
  { id: 'a3', entity_type: 'item', entity_id: 'i6', action: 'update', old_value: null, new_value: null, performed_by: 'u2', performed_by_name: 'Maria Santos', performed_at: '2026-02-10T11:00:00Z' },
  { id: 'a4', entity_type: 'item', entity_id: 'i9', action: 'create', old_value: null, new_value: null, performed_by: 'u1', performed_by_name: 'IT Admin', performed_at: '2026-02-05T08:45:00Z' },
  { id: 'a5', entity_type: 'user', entity_id: 'u5', action: 'update', old_value: null, new_value: null, performed_by: 'u1', performed_by_name: 'IT Admin', performed_at: '2026-02-01T16:00:00Z' },
  { id: 'a6', entity_type: 'item', entity_id: 'i8', action: 'create', old_value: null, new_value: null, performed_by: 'u1', performed_by_name: 'IT Admin', performed_at: '2026-02-01T09:00:00Z' },
  { id: 'a7', entity_type: 'assignment', entity_id: 'i12', action: 'assign', old_value: null, new_value: null, performed_by: 'u2', performed_by_name: 'Maria Santos', performed_at: '2026-01-25T13:30:00Z' },
  { id: 'a8', entity_type: 'user', entity_id: 'u4', action: 'create', old_value: null, new_value: null, performed_by: 'u1', performed_by_name: 'IT Admin', performed_at: '2026-01-12T10:00:00Z' },
];

// ─── Auth middleware ──────────────────────────────────────────────────────────

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ success: false, data: null, error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, data: null, error: 'Token expired' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, data: null, error: 'Forbidden' });
  next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ status: 'ok', mode: 'demo', version: '1.0.0' }));

// Auth
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email?.toLowerCase());
  if (!user || !bcrypt.compareSync(password, ADMIN_HASH)) {
    return res.status(401).json({ success: false, data: null, error: 'Invalid email or password' });
  }
  const access_token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '24h' });
  return res.json({ success: true, data: { access_token, refresh_token: 'demo_refresh_token', user }, error: null });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  const admin = users[0];
  const access_token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, SECRET, { expiresIn: '24h' });
  return res.json({ success: true, data: { access_token, refresh_token: 'demo_refresh_token' }, error: null });
});

app.post('/api/v1/auth/logout', auth, (_, res) => res.json({ success: true, data: null, error: null }));
app.get('/api/v1/auth/me', auth, (req, res) => {
  const u = users.find(u => u.id === req.user.sub);
  return res.json({ success: true, data: u, error: null });
});

// Items
app.get('/api/v1/items', auth, (req, res) => {
  let result = items.filter(i => !i.deleted_at);
  const { search, status, page = 1, limit = 25 } = req.query;
  if (search) result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.item_code.includes(search) || (i.serial_number || '').includes(search));
  if (status) result = result.filter(i => i.status === status);
  const total = result.length;
  const p = parseInt(page), l = parseInt(limit);
  const paginated = result.slice((p - 1) * l, p * l);
  return res.json({ success: true, data: paginated, error: null, meta: { total, page: p, limit: l, total_pages: Math.ceil(total / l) } });
});

app.get('/api/v1/items/:id', auth, (req, res) => {
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, data: null, error: 'Item not found' });
  return res.json({ success: true, data: { ...item, assignment_history: [] }, error: null });
});

app.post('/api/v1/items', auth, (req, res) => {
  const newItem = { id: 'i' + Date.now(), item_code: 'STL-DEMO-' + String(items.length + 1).padStart(4, '0'), sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null, assigned_to_name: null, barcode: null, qr_code: null, image_url: null, created_by: req.user.sub, ...req.body };
  items.push(newItem);
  recentActivity.unshift({ id: 'al' + Date.now(), entity_type: 'item', entity_id: newItem.id, action: 'create', old_value: null, new_value: null, performed_by: req.user.sub, performed_by_name: users.find(u => u.id === req.user.sub)?.name || 'User', performed_at: new Date().toISOString() });
  return res.status(201).json({ success: true, data: newItem, error: null });
});

app.patch('/api/v1/items/:id', auth, (req, res) => {
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, data: null, error: 'Item not found' });
  items[idx] = { ...items[idx], ...req.body, updated_at: new Date().toISOString() };
  return res.json({ success: true, data: items[idx], error: null });
});

app.delete('/api/v1/items/:id', auth, (req, res) => {
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, data: null, error: 'Item not found' });
  items[idx].deleted_at = new Date().toISOString();
  return res.json({ success: true, data: null, error: null, message: 'Item deleted' });
});

// Reports
app.get('/api/v1/reports/dashboard', auth, (_, res) => {
  const active = items.filter(i => !i.deleted_at);
  const byCategory = categories.filter(c => !c.parent_id).map(c => ({
    category: c.name,
    count: active.filter(i => {
      const cat = categories.find(cat => cat.id === i.category_id);
      return cat && (cat.id === c.id || cat.parent_id === c.id);
    }).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  return res.json({
    success: true,
    data: {
      total_items: active.length,
      available: active.filter(i => i.status === 'available').length,
      in_use: active.filter(i => i.status === 'in_use').length,
      under_repair: active.filter(i => i.status === 'under_repair').length,
      reserved: active.filter(i => i.status === 'reserved').length,
      retired: active.filter(i => i.status === 'retired').length,
      disposed: active.filter(i => i.status === 'disposed').length,
      by_category: byCategory,
      recent_activity: recentActivity,
    },
    error: null,
  });
});

app.post('/api/v1/reports/generate', auth, (_, res) => {
  res.set('Content-Type', 'text/plain');
  res.set('Content-Disposition', 'attachment; filename="report.txt"');
  return res.send('[DEMO MODE] Report generation requires the full Docker backend.\nInstall Docker and run: npm run docker:up');
});

// Users
app.get('/api/v1/users', auth, adminOnly, (_, res) => {
  const result = users.map(u => ({ ...u, department_name: departments.find(d => d.id === u.department_id)?.name || null }));
  return res.json({ success: true, data: result, error: null });
});

app.post('/api/v1/users', auth, adminOnly, (req, res) => {
  const { name, email, role, department_id } = req.body;
  if (users.find(u => u.email === email?.toLowerCase())) return res.status(409).json({ success: false, data: null, error: 'Email already in use' });
  const newUser = { id: 'u' + Date.now(), name, email: email.toLowerCase(), role, department_id: department_id || null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  users.push(newUser);
  return res.status(201).json({ success: true, data: newUser, error: null });
});

app.patch('/api/v1/users/:id', auth, adminOnly, (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, data: null, error: 'User not found' });
  users[idx] = { ...users[idx], ...req.body, updated_at: new Date().toISOString() };
  return res.json({ success: true, data: users[idx], error: null });
});

// Reference data
app.get('/api/v1/categories', auth, (_, res) => res.json({ success: true, data: categories, error: null }));
app.post('/api/v1/categories', auth, adminOnly, (req, res) => {
  const c = { id: 'c' + Date.now(), ...req.body, created_at: new Date().toISOString() };
  categories.push(c);
  return res.status(201).json({ success: true, data: c, error: null });
});
app.delete('/api/v1/categories/:id', auth, adminOnly, (req, res) => {
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, data: null, error: 'Not found' });
  categories.splice(idx, 1);
  return res.json({ success: true, data: null, error: null });
});

app.get('/api/v1/departments', auth, (_, res) => res.json({ success: true, data: departments, error: null }));
app.post('/api/v1/departments', auth, adminOnly, (req, res) => {
  const d = { id: 'd' + Date.now(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  departments.push(d);
  return res.status(201).json({ success: true, data: d, error: null });
});
app.delete('/api/v1/departments/:id', auth, adminOnly, (req, res) => {
  const idx = departments.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, data: null, error: 'Not found' });
  departments.splice(idx, 1);
  return res.json({ success: true, data: null, error: null });
});

app.get('/api/v1/locations', auth, (_, res) => res.json({ success: true, data: locations, error: null }));
app.post('/api/v1/locations', auth, adminOnly, (req, res) => {
  const l = { id: 'l' + Date.now(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  locations.push(l);
  return res.status(201).json({ success: true, data: l, error: null });
});
app.delete('/api/v1/locations/:id', auth, adminOnly, (req, res) => {
  const idx = locations.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, data: null, error: 'Not found' });
  locations.splice(idx, 1);
  return res.json({ success: true, data: null, error: null });
});

app.listen(3000, () => {
  console.log('\n✓ Starlight ITD Inventory — Demo Server');
  console.log('  Backend:    http://localhost:3000');
  console.log('  Web Admin:  http://localhost:5173');
  console.log('\n  Login: admin@starlight.com / Admin@1234\n');
});
