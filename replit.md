# Tech Launch MENA

A full-stack product discovery platform for the MENA region, similar to Product Hunt.

## Architecture

- **Frontend**: React (Vite) — served by Express in production on port 5000
- **Backend**: Express.js REST API — runs on port 5000 (production)
- **Database**: PostgreSQL (Replit built-in, also mirrors Neon via NEON_DATABASE_URL)
- **Standalone Admin**: Separate Express + React Vite app — runs on port 4000

## Project Structure

```
/
├── frontend/          # React + Vite public site
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/  (ui, layout, home, admin)
│   │   ├── context/     (AuthContext)
│   │   ├── pages/       (home, admin)
│   │   └── utils/       (api.js - fetch client)
│   └── package.json
│
├── backend/           # Main Express API (serves frontend build in production)
│   ├── src/
│   │   ├── server.js
│   │   ├── config/      (database.js - pg Pool, uses NEON_DATABASE_URL if set)
│   │   ├── controllers/ (auth, products, entities, users, admin)
│   │   ├── middleware/  (auth JWT, error handling)
│   │   ├── migrations/  (001_schema.sql)
│   │   └── routes/
│   └── .env             (PORT=5000 in production, DB credentials)
│
├── admin-app/         # Standalone Admin Panel (separate deployment)
│   ├── backend/
│   │   ├── server.js  (Express, port 4000, JWT auth, serves React build)
│   │   └── package.json
│   └── frontend/      (React + Vite)
│       ├── index.html
│       ├── vite.config.js
│       └── src/
│           ├── App.jsx          (AuthCtx, login gate)
│           ├── index.css        (sidebar + layout styles)
│           ├── main.jsx
│           ├── utils/api.js     (fetch wrapper, localStorage token)
│           ├── components/
│           │   ├── AdminLayout.jsx
│           │   └── AdminSidebar.jsx
│           └── pages/
│               ├── LoginPage.jsx
│               ├── shared.jsx   (SCard, Badge, Tbl, ActionBtn, EmptyState)
│               ├── Dashboard.jsx
│               ├── Products.jsx
│               ├── Users.jsx
│               ├── Entities.jsx
│               ├── Applications.jsx
│               ├── Featured.jsx
│               ├── Reports.jsx
│               ├── Settings.jsx
│               └── Suggestions.jsx
└── prototypes/        # Static HTML prototypes
```

## Workflows

- **Start application**: `cd backend && node src/server.js` — main site on port 5000

## Standalone Admin App

To run the standalone admin panel:
1. `cd admin-app/frontend && npm run build`
2. `node admin-app/backend/server.js`   (runs on port 4000)

Admin login: `admin@techlaunch.io` / `admin123` (admin/moderator/editor roles only)

## Database

Uses Replit's built-in PostgreSQL. Schema includes:
- users, products, entities, comments, upvotes, bookmarks
- accelerator_applications, investor_pitches, notifications
- platform_settings, team_members, activity_log, refresh_tokens
- suggestions, waitlist_signups, platform_posts

If NEON_DATABASE_URL is set, both apps connect to Neon instead of local DB.

Run migrations: `cd backend && node src/migrations/run.js`

## Environment

- Backend: DB_HOST=helium, DB_PORT=5432, DB_NAME=heliumdb, DB_USER=postgres
- Use NEON_DATABASE_URL to point to Neon production database
- JWT_SECRET for token signing (defaults to tlmena_dev_secret in dev)
- Admin panel port: ADMIN_PORT=4000

## Production Build

- Build main frontend: `cd frontend && npm run build`
- Build admin frontend: `cd admin-app/frontend && npm run build`
- Run main app: `cd backend && NODE_ENV=production node src/server.js`
- Run admin app: `node admin-app/backend/server.js`

## GitHub

Repo: `Hoster-Admin/TechLaunch-02` (main branch)
Push via GitHub Contents API (git push blocked by Replit environment).
