# Tech Launch MENA

A full-stack product discovery platform for the MENA region, similar to Product Hunt.

## Architecture

- **Frontend**: React (Create React App) — runs on port 5000
- **Backend**: Express.js REST API — runs on port 3001
- **Database**: PostgreSQL (Replit built-in)

## Project Structure

```
/
├── frontend/          # React CRA app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/  (ui, layout, home, admin)
│   │   ├── context/     (AuthContext)
│   │   ├── pages/       (home, admin)
│   │   ├── styles/      (index.css - custom CSS + Tailwind)
│   │   └── utils/       (api.js - axios client)
│   ├── .env             (PORT=5000, HOST=0.0.0.0, proxy config)
│   └── package.json     (proxy → http://localhost:3001)
│
├── backend/           # Express API
│   ├── src/
│   │   ├── server.js
│   │   ├── config/      (database.js - pg Pool)
│   │   ├── controllers/ (auth, products, entities, users, admin)
│   │   ├── middleware/  (auth JWT, error handling)
│   │   ├── migrations/  (001_schema.sql)
│   │   ├── routes/      (index.js)
│   │   └── seeders/
│   └── .env             (PORT=3001, DB credentials, JWT secrets)
│
└── prototypes/        # Static HTML prototypes
```

## Workflows

- **Start application**: runs the admin panel in production mode on port 5000 (webview)
  - Command: `ADMIN_PORT=5000 NODE_ENV=production node admin-app/backend/server.js`
  - Serves the built admin Vite frontend from `admin-app/frontend/dist`
  - To rebuild the admin frontend: `cd admin-app/frontend && npm run build`
  - To run the public site instead: `cd backend && PORT=3001 node src/server.js & cd frontend && BROWSER=none PORT=5000 npm start`

## Database

Uses both Replit built-in PostgreSQL (heliumdb) and Neon (NEON_DATABASE_URL). The admin panel uses Neon (same DB as public site). Schema includes:
- `users` — roles: user/admin/moderator/editor; status: active/suspended/banned/pending_verification; persona: Founder/Investor/Product Manager/etc.
- `products` — status enum: pending/live/soon/rejected/draft
- `entities` — type enum: accelerator/investor/venture_studio
- `accelerator_applications` — status enum (app_status): pending/reviewing/accepted/rejected; fields: applicant_id, entity_id, product_id, startup_name, stage, pitch, notes, reviewed_by, reviewed_at
- `investor_pitches` — status enum (pitch_status): sent/reviewing/interested/follow-up/rejected/funded; fields: founder_id, investor_id, product_id, ask_amount, pitch_deck, description, notes
- `waitlist_signups` — product_id, email, user_id
- `comments, upvotes, bookmarks, suggestions, notifications, platform_settings, team_members, activity_log, refresh_tokens`

Run migrations: `cd backend && node src/migrations/run.js`

## Environment

- Backend `.env`: DB_HOST=helium, DB_PORT=5432, DB_NAME=heliumdb, DB_USER=postgres, PORT=3001
- Frontend `.env`: PORT=5000, HOST=0.0.0.0, DANGEROUSLY_DISABLE_HOST_CHECK=true

## Production Deployment

- Build: `cd frontend && npm run build`
- Run: `cd backend && NODE_ENV=production PORT=5000 node src/server.js`
  - In production, Express serves the built React app as static files
