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

## File Uploads

- **Endpoint**: `POST /api/upload` — authenticated, accepts `multipart/form-data` with field `file` (images only, max 5MB)
- **Storage**: `backend/uploads/` directory (shared by both servers)
- **Served at**: `/uploads/<filename>` on both the public API (port 3001) and admin panel (port 5000)
- **Used for**: entity logos, user avatars, product images
- **Available in**: public backend (`routes/index.js`) and admin backend (`admin-app/backend/server.js`)

## Platform Profile (TechLaunch MENA Account)

- **DB record**: user with `handle='techlaunchmena'`, `role='user'`, `verified=true`
- **ID**: `e0cb08b1-3c3d-4db5-8e39-70a099d4f77d`
- **Purpose**: Official platform account; all new users auto-follow it on registration
- **Auto-follow**: Added to `authController.js` `register` function — inserts into `follows` table after user creation
- **Public endpoint**: `GET /api/platform-profile` (read-only, public)
- **Admin endpoint**: `GET/PUT /api/admin/platform-profile` (admin-only write)
- **Admin UI**: "Platform Profile" card in Settings page — edits name, headline, bio, website, twitter, linkedin, avatar

## Email (Resend)

- **Package**: `resend` installed in both `backend/` and root `node_modules`
- **Service**: `backend/src/services/emailService.js` — `sendWelcomeEmail`, `sendAdminCreatedAccountEmail`
- **Triggers**:
  - `authController.js` — welcome email on public registration
  - `admin-app/backend/server.js` — invitation email with activation link on admin user creation
- **Secrets**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (hello@tlmena.com), `APP_URL` (https://tlmena.com)

## Account Activation Flow

When admin creates a user via the admin panel:
1. A 72-hour token is generated and stored in `activation_tokens` table
2. An invitation email is sent with an "Activate My Account" button linking to `APP_URL/activate?token=...`
3. User sets their own password at `/activate?token=...` (ActivatePage in AuthPages.jsx)
4. On success, user is redirected to `/login` to sign in normally

- **Backend routes**: `GET /api/auth/activate/:token` (validate), `POST /api/auth/activate` (set password)
- **Frontend page**: `/activate` — `ActivatePage` in `frontend/src/pages/home/AuthPages.jsx`

## Production Deployment

- Build: `cd frontend && npm run build`
- Run: `cd backend && NODE_ENV=production PORT=5000 node src/server.js`
  - In production, Express serves the built React app as static files
