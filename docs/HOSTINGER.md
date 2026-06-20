# Hosting on Hostinger — Step by Step (easy words)

This app has **3 parts**:

| Part | What it is | Where it goes on Hostinger |
|---|---|---|
| **Database** | MySQL (tables, triggers, your real data) | hPanel → MySQL + phpMyAdmin ✅ works everywhere |
| **Frontend** | React site (the pages you see) | `public_html` as static files ✅ works on any plan |
| **Backend** | Node + Socket.io API (live scoring) | **needs Node** → Hostinger **VPS** *or* a **Business/Cloud plan with “Node.js app”**. ❌ plain shared hosting cannot run it |

> **One‑line summary:** Import `database/hostinger-import.sql` in phpMyAdmin, upload `frontend/dist` to `public_html`, and run the `backend` folder as a Node app (VPS or Hostinger Node.js) with your DB details in a `.env` file.

---

## STEP 1 — Database (works on every Hostinger plan)

1. hPanel → **Databases → MySQL Databases**.
2. **Create** a new database + user. Hostinger gives names like `u123456_league`, user `u123456_admin`, and a password. **Write these down.**
3. Open **phpMyAdmin** (button next to the database).
4. Click your database on the left → top menu **Import** → **Choose File** → pick **`database/hostinger-import.sql`** (inside the zip) → **Go**.
5. Done — all tables, triggers, stored procedures, and your real teams/players/stats are now live.

> Login that already works after import: **admin@sportsleague.dev / Admin@123**
> If import shows a *trigger/routine permission* error, open a Hostinger support chat and ask them to “allow CREATE TRIGGER/ROUTINE” (most plans allow it). The app still works without triggers if you click **Recalc standings** in the UI.

---

## STEP 2 — Backend (the live API)

You need Node 18+. Two options:

### Option A — Hostinger VPS (recommended, full real‑time)
1. hPanel → **VPS** → open your server’s **Browser terminal** (or SSH).
2. Install Node + pm2 once:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm i -g pm2
   ```
3. Upload the **`backend`** folder (use hPanel File Manager or `scp`), then:
   ```bash
   cd backend
   cp .env.example .env        # then edit .env (see below)
   npm install
   npm run build
   pm2 start dist/src/server.js --name league-api
   pm2 save && pm2 startup
   ```
4. Open port **4000** (or put it behind Nginx on port 80/443).

### Option B — Hostinger “Node.js app” (Business/Cloud plans)
1. hPanel → **Advanced → Node.js** → **Create application**.
2. App root = the uploaded `backend` folder, **Startup file = `dist/src/server.js`**, Node 20.
3. Add the **environment variables** (below), then **NPM install** and **Build** (`npm run build`), then **Start**.

### Backend `.env` (fill with YOUR Hostinger DB details)
```
PORT=4000
NODE_ENV=production
CLIENT_ORIGIN=https://yourdomain.com
DB_HOST=localhost          # use the host shown in hPanel (often "localhost" if API runs on same server)
DB_PORT=3306
DB_USER=u123456_admin
DB_PASSWORD=your_db_password
DB_NAME=u123456_league
JWT_ACCESS_SECRET=put_a_long_random_string
JWT_REFRESH_SECRET=put_another_long_random_string
```
> If the backend runs **somewhere other than Hostinger**, enable **Remote MySQL** in hPanel (Databases → Remote MySQL → add the server’s IP) and use the DB host Hostinger shows.

---

## STEP 3 — Frontend (the website)

The frontend must know your backend address. Two easy ways:

**Easiest (same domain):** put the API behind `https://yourdomain.com/api` (Nginx reverse proxy on the VPS) — then the prebuilt `frontend/dist` already works. Just:
1. hPanel → **File Manager** → open `public_html`.
2. Upload **everything inside `frontend/dist`** (not the folder itself — its contents: `index.html`, `assets/…`).
3. Visit `https://yourdomain.com` — done.

**If backend is on a different URL:** rebuild the frontend once with that URL:
```bash
cd frontend
echo "VITE_API_URL=https://api.yourdomain.com" > .env
npm install && npm run build
# then upload the new frontend/dist contents to public_html
```

> SPA routing: a `public_html/.htaccess` is included so refreshing deep links (e.g. `/scoreboard`) works on Apache.

---

## Quick checklist
- [ ] DB imported in phpMyAdmin (Step 1)
- [ ] `backend/.env` filled with Hostinger DB user/password/name
- [ ] Backend running (`pm2 list` shows `league-api` online) and reachable at `/api/health`
- [ ] `frontend/dist` contents uploaded to `public_html`
- [ ] `CLIENT_ORIGIN` (backend) = your site URL, and frontend points to the API
- [ ] Open the site → log in → start **Auto‑Live** → matches play 🎉

## Don’t want to manage a server?
Keep the **database on Hostinger**, host the **backend free on Render** (`render.yaml` included) and the **frontend on Vercel** — see `docs/DEPLOYMENT.md`. Enable Remote MySQL so Render can reach your Hostinger DB.

---

# 🟢 RECOMMENDED for shared hosting (no Node): DB on Hostinger + Backend on Render + Frontend on Hostinger

This is the easiest path when your Hostinger plan **doesn’t run Node**. You do **not** need to rebuild the frontend — it reads its backend URL from an editable `config.js`.

### A) Database → Hostinger
1. hPanel → **MySQL Databases** → create DB + user (note `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
2. **phpMyAdmin** → select the DB → **Import** → `database/hostinger-import.sql` → **Go**.
3. hPanel → **Databases → Remote MySQL** → add host **`%`** (allows your Render backend to connect). Note the **DB hostname** Hostinger shows (e.g. `srvNNN.hstgr.io`).

### B) Backend → Render (free)
1. Push the project to a **GitHub** repo (or use Render’s “upload”). Render → **New → Web Service** → root directory **`backend`**.
2. Build: `npm install && npm run build` · Start: `node dist/src/server.js` · Health check: `/api/health`.
3. Add **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4000
   CLIENT_ORIGIN=https://yourdomain.com        # your Hostinger site URL
   DB_HOST=srvNNN.hstgr.io                      # the Remote MySQL host from step A3
   DB_PORT=3306
   DB_USER=u123456_admin
   DB_PASSWORD=your_db_password
   DB_NAME=u123456_league
   JWT_ACCESS_SECRET=long_random_string
   JWT_REFRESH_SECRET=another_long_random_string
   ```
4. Deploy → copy your service URL, e.g. `https://sportsleague-api.onrender.com`.

### C) Frontend → Hostinger `public_html`
1. File Manager → upload **everything inside `frontend/dist`** to `public_html`.
2. Open **`public_html/config.js`** and paste your Render URL:
   ```js
   window.__APP_CONFIG__ = { apiUrl: "https://sportsleague-api.onrender.com" };
   ```
   Save. **No rebuild needed.**
3. Visit `https://yourdomain.com` → log in (admin@sportsleague.dev / Admin@123) → start **Auto‑Live**. 🎉

> Notes: Render’s free tier sleeps after inactivity — the first request may take ~30s to wake. Live scoring (Socket.io) works on Render. If login fails with a CORS error, double‑check `CLIENT_ORIGIN` exactly matches your site URL (https, no trailing slash).
