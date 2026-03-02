# Deployment Guide — Starlight ITD Inventory System

## Requirements

- Docker Engine 24+ and Docker Compose v2
- 2 GB RAM minimum (4 GB recommended)
- Ubuntu 22.04 / Windows Server 2022 / macOS (for local)

---

## Quick Start (Self-Hosted)

### 1. Clone and Configure

```bash
git clone https://github.com/wilbertstarlight2026/starlight-itd-inventory.git
cd starlight-itd-inventory
cp .env.example .env
```

Edit `.env` — **change all secrets**:

```env
POSTGRES_PASSWORD=your_strong_password
JWT_ACCESS_SECRET=your_64_char_random_string
JWT_REFRESH_SECRET=another_64_char_random_string
```

### 2. Start Services

```bash
npm run docker:up
```

Or directly:

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Seed Admin User

```bash
docker exec starlight_backend node -e "require('./dist/db/seed.js')"
```

Default: `admin@starlight.com` / `Admin@1234`
**Change immediately after first login.**

### 4. Access

| Service | URL |
|---|---|
| Backend API | `http://localhost:3000/api/v1` |
| Web Admin | `http://localhost:5173` |
| Health Check | `http://localhost:3000/health` |

---

## Mobile App Setup

### Development (Expo Go)

```bash
cd apps/mobile
npx expo start
```

Scan the QR with Expo Go app.

### Production Build (APK)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

### Configure Backend URL

Edit `apps/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_SERVER_IP:3000/api/v1"
    }
  }
}
```

---

## Docker Services

| Container | Port | Description |
|---|---|---|
| `starlight_db` | 5432 | PostgreSQL database |
| `starlight_backend` | 3000 | Fastify API server |
| `starlight_web_admin` | 5173 | React web admin |

---

## Backup

### Database Backup

```bash
docker exec starlight_db pg_dump -U starlight_admin starlight_inventory > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
cat backup_20260101.sql | docker exec -i starlight_db psql -U starlight_admin -d starlight_inventory
```

---

## Updating

```bash
git pull
npm run docker:down
npm run docker:up
```

---

## Troubleshooting

**Backend won't connect to database:**
```bash
docker logs starlight_backend
docker logs starlight_db
```

**Reset database (DESTRUCTIVE):**
```bash
docker compose -f docker/docker-compose.yml down -v
npm run docker:up
```

**Mobile app can't reach backend:**
- Make sure device and server are on the same network
- Use local IP address (not `localhost`) in `apiUrl`
- Check firewall rules for port 3000
