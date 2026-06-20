# 🏆 Sports League Management & Live Scoring Platform

A complete, production-ready full-stack platform for running football, cricket, and
basketball tournaments — fixtures, **real-time live scoring**, automatic standings
(via database triggers), player statistics, PDF reports, and a public scoreboard.

## ✨ Features

- **Tournaments** — round-robin & knockout, full CRUD, search/filter
- **Teams & Players** — rosters, logos/photos (uploads), pagination
- **Fixture generator** — auto round-robin and knockout brackets (MySQL stored procedures)
- **Live scoring** — Socket.io real-time updates for football / cricket / basketball
- **Standings** — calculated automatically by **database triggers** (points, GD, W/D/L)
- **Player statistics** — leaderboards & charts (top scorers, assists, cards, runs, wickets)
- **Public scoreboard** — no login, live updates
- **PDF reports** — fixtures, results, standings, player stats, tournament report, certificates
- **Global search**, **real-time notifications**, **dark/light mode**, fully responsive
- **Auth** — JWT access + rotating refresh tokens, bcrypt, RBAC (4 roles)

## 🧱 Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind, shadcn-style UI, React Router, React Query, Chart.js, Socket.io-client, Framer Motion, React Hook Form, Zod |
| Backend | Node + Express + TypeScript, Socket.io, JWT, Multer, bcrypt, Helmet, rate-limiting, mysql2 |
| Database | MySQL 8 — normalized (3NF), views, stored procedures, triggers, transactions, indexes |
| Reports | PDFKit |

## 📁 Structure

```
sports-league-platform/
├── database/        # schema, views, procedures, triggers, seed (raw SQL)
├── backend/         # Express API (controllers / services / repositories / routes / middlewares / validators)
│   └── scripts/     # db setup + Faker seed
├── frontend/        # React app (pages / components / services / store / hooks)
├── docs/            # setup, deployment, database guides
└── docker-compose.yml
```

## 🚀 Quick Start

### Option A — Docker (one command)
```bash
docker compose up -d        # MySQL (auto-loads schema+seed) + API on :4000
cd frontend && npm install && npm run dev   # http://localhost:5173
```
> Compose maps MySQL to host port **3307** to avoid clashing with a local MySQL.

### Option B — Local MySQL
```bash
# 1) Database
cd backend
cp .env.example .env         # edit DB_USER / DB_PASSWORD to match your MySQL
npm install
npm run db:setup             # loads schema → views → procedures → triggers → seed
npm run db:seed              # bulk Faker data + admin user

# 2) API
npm run dev                  # http://localhost:4000

# 3) Frontend (new terminal)
cd ../frontend
npm install
npm run dev                  # http://localhost:5173
```

### Default login
```
admin@sportsleague.dev  /  Admin@123
```

## 🧪 Verify it works
- `GET http://localhost:4000/api/health` → `{ success: true }`
- Log in → **Tournaments** → open one → **Generate fixtures**
- **Live Scoring** → start a match → add a goal → watch the **public /scoreboard** update live
- **Statistics** → standings update automatically (database trigger)
- **Reports** → download any PDF

## 📜 Scripts
| Location | Command | Description |
|---|---|---|
| backend | `npm run dev` | API + Socket.io (watch mode) |
| backend | `npm run build` / `npm start` | compile / run production |
| backend | `npm run db:setup` | load all SQL |
| backend | `npm run db:seed` | seed Faker data + admin |
| backend | `npm run test:db` | **automated smoke test** — asserts every trigger/procedure/view works |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | production build |

## 🌐 Deployment
- **Frontend → Vercel** (set `VITE_API_URL` to your backend origin) — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Backend → Render/Railway** (`render.yaml` included)
- **Database → managed MySQL** (PlanetScale / Railway / Aiven)

See [docs/SETUP.md](docs/SETUP.md), [docs/DATABASE.md](docs/DATABASE.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 👥 Roles
`SUPER_ADMIN` · `TOURNAMENT_ADMIN` · `MATCH_OFFICIAL` · `PUBLIC_VIEWER`

---
© 2026 SportsLeague Platform
