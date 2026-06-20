# Local Setup Guide

## Prerequisites
- Node.js 20+
- MySQL 8 (local) **or** Docker

## 1. Database

### With Docker
```bash
docker compose up -d db
# schema + seed auto-load on first boot (host port 3307)
```
Then in `backend/.env` set `DB_PORT=3307`, `DB_USER=sl_app`, `DB_PASSWORD=sl_app_pw_2026`.

### With local MySQL
Create a dedicated user (in MySQL Workbench / CLI):
```sql
CREATE DATABASE IF NOT EXISTS sportsleague;
CREATE USER 'sl_app'@'localhost' IDENTIFIED BY 'sl_app_pw_2026';
GRANT ALL PRIVILEGES ON sportsleague.* TO 'sl_app'@'localhost';
FLUSH PRIVILEGES;
```
```bash
cd backend
cp .env.example .env        # confirm DB_* values
npm install
npm run db:setup            # load schema/views/procedures/triggers/seed
npm run db:seed             # Faker data + admin user
```

## 2. Backend
```bash
cd backend
npm run dev                 # http://localhost:4000  (GET /api/health)
```

## 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```
The Vite dev server proxies `/api` and Socket.io to the backend automatically.

## Default credentials
| Role | Email | Password |
|---|---|---|
| Super Admin | admin@sportsleague.dev | Admin@123 |
| Tournament Admin | organizer@sportsleague.dev | Admin@123 |
| Match Official | official@sportsleague.dev | Admin@123 |

## Troubleshooting
- **`ER_ACCESS_DENIED`** → check `DB_USER`/`DB_PASSWORD` in `backend/.env`.
- **Port 3306 in use** → use Docker's 3307 mapping or change `DB_PORT`.
- **Sockets not updating** → ensure backend is running; the dev proxy forwards `/socket.io`.
- **Uploads 404** → backend serves `/uploads`; the dev proxy forwards it.
