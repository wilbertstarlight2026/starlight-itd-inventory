# Starlight ITD Inventory System

**Client:** Starlight Business Consulting Services Inc
**Department:** IT Department
**Version:** 1.0.0

A mobile-first, offline-capable inventory management system for tracking IT and general company assets using QR codes and barcodes.

---

## Features

- QR Code & Barcode scanning and generation
- Full offline support with background sync
- Role-based access (Admin / Manager / User)
- Asset lifecycle tracking (Available → In Use → Under Repair → Retired → Disposed)
- Assignment tracking (employee, department, location)
- PDF & Excel report export
- Self-hosted with Docker

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Backend | Node.js + Fastify + TypeScript |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Local DB | SQLite (expo-sqlite) |
| State | Zustand |
| Web Admin | React + Vite + Tailwind CSS |
| Deploy | Docker + Docker Compose |

---

## Project Structure

```
starlight-itd-inventory/
├── apps/
│   ├── mobile/          # React Native + Expo
│   ├── backend/         # Fastify API
│   └── web-admin/       # React Web Dashboard
├── shared/              # Shared TypeScript types
├── docker/              # Docker configs
└── docs/                # Documentation
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/wilbertstarlight2026/starlight-itd-inventory.git
cd starlight-itd-inventory
cp .env.example .env
# Edit .env with your values
npm install
```

### 2. Start with Docker

```bash
npm run docker:up
```

Backend runs on `http://localhost:3000`
Web Admin runs on `http://localhost:5173`

### 3. Run Mobile App

```bash
cd apps/mobile
npx expo start
```

---

## Default Admin Credentials

After first run, seed the database:

```bash
cd apps/backend
npm run seed
```

Default admin: `admin@starlight.com` / `Admin@1234`

> **Change password immediately after first login.**

---

## Documentation

- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [PRD](./docs/PRD.md)
