# API Reference — Starlight ITD Inventory

Base URL: `http://localhost:3000/api/v1`

All responses follow the envelope format:
```json
{ "success": true, "data": {...}, "error": null }
```

---

## Authentication

### POST /auth/login
```json
{ "email": "admin@starlight.com", "password": "Admin@1234", "device_id": "optional" }
```
Returns: `{ access_token, refresh_token, user }`

### POST /auth/refresh
```json
{ "refresh_token": "..." }
```

### POST /auth/logout *(requires auth)*
```json
{ "refresh_token": "..." }
```

### GET /auth/me *(requires auth)*

### POST /auth/change-password *(requires auth)*
```json
{ "current_password": "...", "new_password": "..." }
```

---

## Items

All item routes require `Authorization: Bearer <access_token>`

### GET /items
Query params: `search`, `status`, `condition`, `category_id`, `page`, `limit`, `sort_by`, `sort_order`

### GET /items/:id

### GET /items/scan/:code
Lookup by barcode, item_code, or serial number.

### POST /items *(manager+)*
```json
{
  "name": "Dell Laptop XPS 15",
  "category_id": "uuid",
  "brand": "Dell",
  "model": "XPS 15",
  "serial_number": "DL123456",
  "condition": "new",
  "status": "available"
}
```

### PATCH /items/:id *(manager+)*

### DELETE /items/:id *(manager+)* — Soft delete

---

## Assignments

### GET /assignments
Query: `item_id`, `employee_id`, `active=true`

### POST /assignments *(manager+)*
```json
{
  "item_id": "uuid",
  "employee_id": "uuid",
  "department_id": "uuid",
  "location_id": "uuid",
  "notes": "Assigned for WFH setup"
}
```

### POST /assignments/:id/return *(manager+)*

---

## Users *(admin only)*

### GET /users
### POST /users
### PATCH /users/:id
### DELETE /users/:id — Deactivates user

---

## Reference Data

### GET /categories
### POST /categories *(admin)*
### PATCH /categories/:id *(admin)*
### DELETE /categories/:id *(admin)*

### GET /departments
### POST /departments *(admin)*
### PATCH /departments/:id *(admin)*

### GET /locations
### POST /locations *(admin)*
### PATCH /locations/:id *(admin)*

---

## Sync

### POST /sync
```json
{
  "device_id": "device-uuid",
  "last_sync_at": "2026-03-01T00:00:00.000Z",
  "pending_items": [],
  "pending_assignments": []
}
```

### GET /sync/status?device_id=...

---

## Reports

### GET /reports/dashboard

### POST /reports/generate
```json
{
  "type": "full_inventory",
  "format": "pdf",
  "filters": { "status": "available" }
}
```
Returns binary file (PDF or XLSX).

---

## Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Server error |
