# Deployment Guide

Three pieces deploy independently: **frontend (Vercel)**, **backend (Render/Railway)**,
**database (managed MySQL)**.

## 1. Database (managed MySQL)
Use PlanetScale, Railway MySQL, or Aiven. Once provisioned, load the schema:
```bash
# from the database/ folder, against the managed instance
mysql -h <host> -P <port> -u <user> -p <db> < schema.sql
mysql -h <host> -P <port> -u <user> -p <db> < views.sql
mysql -h <host> -P <port> -u <user> -p <db> < procedures.sql
mysql -h <host> -P <port> -u <user> -p <db> < triggers.sql
mysql -h <host> -P <port> -u <user> -p <db> < seed.sql
```
(Or run `npm run db:setup` with the managed `DB_*` values in `backend/.env`.)

## 2. Backend → Render
- New **Web Service** from the repo, root directory `backend`.
- Build: `npm install && npm run build` · Start: `node dist/server.js`
- Health check path: `/api/health`
- Env vars: `DB_HOST/PORT/USER/PASSWORD/NAME`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `CLIENT_ORIGIN` = your Vercel URL.
- `render.yaml` in the repo root can be used as a Blueprint.

### Backend → Railway (alternative)
- New project → Deploy from repo → set root to `backend`.
- Add a MySQL plugin and copy its connection vars into the service.
- Start command: `npm run build && npm start`.

## 3. Frontend → Vercel
- Import the repo, set **Root Directory** to `frontend`.
- Framework preset: **Vite** (build `npm run build`, output `dist`).
- Env var: `VITE_API_URL` = your backend origin (e.g. `https://sportsleague-api.onrender.com`).
- `frontend/vercel.json` handles SPA rewrites.

## CORS / sockets
Set the backend `CLIENT_ORIGIN` to the exact Vercel URL so CORS and Socket.io
allow it. Socket.io uses the same origin as `VITE_API_URL`.

## Post-deploy checklist
- [ ] `GET <backend>/api/health` returns ok
- [ ] Login works (run `db:seed` once for the admin user)
- [ ] Live scoring pushes to the public scoreboard
- [ ] PDF reports download
