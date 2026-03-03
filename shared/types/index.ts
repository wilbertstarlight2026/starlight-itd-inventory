// ============================================================
// Starlight ITD Inventory System — Shared TypeScript Types
// ============================================================

// ─── ENUMS ──────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'user';

export type ItemStatus =
  | 'available'
  | 'in_use'
  | 'under_repair'
  | 'reserved'
  | 'retired'
  | 'disposed';

export type ItemCondition = 'new' | 'good' | 'fair' | 'poor' | 'damaged';

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'return'
  | 'login'
  | 'logout';

// ─── ENTITIES ────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department_name?: string | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  item_code: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  barcode: string | null;
  qr_code: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;
  status: ItemStatus;
  condition: ItemCondition;
  notes: string | null;
  image_url: string | null;
  created_by: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined fields (nested — single item GET)
  category?: Category;
  current_assignment?: Assignment;
  // Flat joined fields (list GET responses)
  category_name?: string | null;
  category_parent_id?: string | null;
  assignment_id?: string | null;
  assignment_employee_id?: string | null;
  assignment_department_id?: string | null;
  assignment_location_id?: string | null;
  assignment_assigned_at?: string | null;
  assigned_to_name?: string | null;
}

export interface Assignment {
  id: string;
  item_id: string;
  employee_id: string | null;
  department_id: string | null;
  location_id: string | null;
  assigned_by: string | null;
  assigned_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: User;
  department?: Department;
  location?: Location;
  assigned_by_user?: User;
  item?: Item;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: AuditAction;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  performed_by: string | null;
  performed_at: string;
  performed_by_user?: User;
  performed_by_name?: string | null;
}

export interface SyncMetadata {
  id: string;
  device_id: string;
  user_id: string | null;
  table_name: string;
  last_sync_at: string;
  created_at: string;
}

// ─── API REQUEST TYPES ───────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface CreateItemRequest {
  item_code?: string; // Auto-generated if not provided
  name: string;
  description?: string;
  category_id?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  status?: ItemStatus;
  condition?: ItemCondition;
  notes?: string;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  status?: ItemStatus;
  condition?: ItemCondition;
}

export interface AssignItemRequest {
  item_id: string;
  employee_id?: string;
  department_id?: string;
  location_id?: string;
  notes?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department_id?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  department_id?: string;
  is_active?: boolean;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  manager_id?: string;
}

export interface CreateLocationRequest {
  name: string;
  building?: string;
  floor?: string;
  room?: string;
}

export interface CreateCategoryRequest {
  name: string;
  parent_id?: string;
  description?: string;
}

// ─── API RESPONSE TYPES ──────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  error: string | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ─── QUERY FILTERS ───────────────────────────────────────────

export interface ItemFilters {
  search?: string;
  status?: ItemStatus;
  condition?: ItemCondition;
  category_id?: string;
  department_id?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'status';
  sort_order?: 'asc' | 'desc';
}

// ─── SYNC TYPES ───────────────────────────────────────────────

export interface SyncPayload {
  device_id: string;
  last_sync_at: string;
  pending_items: PendingSyncItem[];
  pending_assignments: PendingSyncAssignment[];
}

export interface PendingSyncItem {
  local_id: string;
  action: 'create' | 'update' | 'delete';
  data: Partial<Item>;
  updated_at: string;
}

export interface PendingSyncAssignment {
  local_id: string;
  action: 'create' | 'update';
  data: Partial<Assignment>;
  updated_at: string;
}

export interface SyncResponse {
  server_time: string;
  items: Item[];
  assignments: Assignment[];
  categories: Category[];
  departments: Department[];
  locations: Location[];
  users: Pick<User, 'id' | 'name' | 'email' | 'role' | 'department_id'>[];
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  entity_type: 'item' | 'assignment';
  entity_id: string;
  local_version: Partial<Item | Assignment>;
  server_version: Partial<Item | Assignment>;
  resolution: 'server_wins' | 'client_wins';
}

// ─── REPORT TYPES ────────────────────────────────────────────

export type ReportType =
  | 'full_inventory'
  | 'by_category'
  | 'by_department'
  | 'by_status';

export type ReportFormat = 'pdf' | 'excel';

export interface ReportRequest {
  type: ReportType;
  format: ReportFormat;
  filters?: {
    category_id?: string;
    department_id?: string;
    status?: ItemStatus;
    date_from?: string;
    date_to?: string;
  };
}

// ─── LIVE SYNC / WEBSOCKET TYPES ─────────────────────────────

export type LiveEventType =
  | 'item:created'
  | 'item:updated'
  | 'item:deleted'
  | 'assignment:created'
  | 'assignment:returned'
  | 'category:created'
  | 'category:deleted'
  | 'ping';

export interface LiveEvent {
  type: LiveEventType;
  data?: unknown;
  timestamp: string;
}

// ─── DASHBOARD TYPES ─────────────────────────────────────────

export interface DashboardSummary {
  total_items: number;
  available: number;
  in_use: number;
  under_repair: number;
  reserved: number;
  retired: number;
  disposed: number;
  by_category: { category: string; count: number }[];
  recent_activity: AuditLog[];
}
