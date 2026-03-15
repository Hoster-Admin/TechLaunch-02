# TechLaunch MENA

A full-stack product discovery platform for the MENA region.

## Architecture

Two separate applications share one PostgreSQL database:

| App | Port | Purpose |
|-----|------|---------|
| `admin-app/` | 5000 | Admin panel (Vite React + Express) |
| `backend/` | 3001 | Public REST API (Express) |
| `frontend/` | — | Public-facing React site (built/served by backend in production) |

## Workflows

- **Start application**: `ADMIN_PORT=5000 NODE_ENV=production node admin-app/backend/server.js`
  - Serves the built Vite frontend from `admin-app/frontend/dist/`
  - Rebuild: `cd admin-app/frontend && npm run build`
- **Public API**: `PORT=3001 node backend/src/server.js`

## Project Structure

```
/
├── admin-app/
│   ├── backend/server.js       # Admin Express server (port 5000)
│   └── frontend/
│       ├── src/
│       │   ├── components/     # AdminLayout, AdminSidebar
│       │   ├── pages/          # Dashboard, Products, Users, Settings, PlatformProfile, …
│       │   └── utils/api.js    # All admin API helpers
│       └── dist/               # Built output (served by admin backend)
│
├── backend/
│   └── src/
│       ├── server.js           # Public API
│       ├── config/database.js
│       ├── controllers/        # auth, products, entities, users
│       ├── middleware/
│       ├── migrations/001_schema.sql
│       ├── seeders/run.js      # Dev-only seeder — do NOT run in production
│       └── services/emailService.js
│
└── frontend/                   # Public React site
    └── src/
```

## Database

PostgreSQL (Replit built-in + Neon NEON_DATABASE_URL). Key tables:

- `users` — roles: user/admin/moderator/editor
- `products` — status: pending/live/soon/rejected/draft
- `entities` — type: accelerator/investor/venture_studio
- `platform_settings` — key/value store for all platform config
- `platform_posts` — posts made by the TechLaunch MENA platform account
- `tags` — category: role/user/product/article
- `activity_log`, `refresh_tokens`, `notifications`, `comments`, `upvotes`, `follows`, `bookmarks`

Run migrations: `cd backend && node src/migrations/run.js`

## Production Database State (Clean)

After cleanup, the database contains only:

| Table | Contents |
|-------|----------|
| `users` | 2 rows: `admin@tlmena.com` (admin) + `platform@techlaunchmena.com` (platform account) |
| `products` | Empty — ready for real submissions |
| `tags` | 13 system tags (role/user/product/article categories) |
| `platform_settings` | 35 config rows — platform name, feature flags, notification prefs |
| All others | Empty |

## Platform Account

- **Handle**: `techlaunchmena`
- **UUID**: `e0cb08b1-3c3d-4db5-8e39-70a099d4f77d` (hardcoded in `admin-app/backend/server.js` as `TLMENA_ID`)
- **Purpose**: Official posting identity used on Platform Profile page
- **Email**: `platform@techlaunchmena.com` (internal — not used for login)

## Admin Panel Identity vs Public Profile

Two separate concepts:

- **Settings → Public Profile** — controls logo + display name shown in the admin panel sidebar (stored in `platform_settings` keys `panel_display_name`, `panel_avatar_url`)
- **Admin Profile page (Public Profile)** — edits the public TechLaunch MENA user account (stored in `users` table via `TLMENA_ID`). Fields: name, handle, headline, bio, website, twitter, linkedin, avatar

## File Uploads

- **Endpoint**: `POST /api/upload` — authenticated, `multipart/form-data`, field `file` (images only, max 5 MB)
- **Storage**: `backend/uploads/`
- **Served at**: `/uploads/<filename>` on both servers

## Email (Resend)

- **Service**: `backend/src/services/emailService.js`
- **Secrets**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`
- **Triggers**: welcome email on registration; invitation email when admin creates a user

## Account Activation

Admin-created users receive an invitation email with a 72-hour activation link (`/activate?token=…`). User sets their own password there.

## Security Notes

- JWT secret: `JWT_SECRET` env var
- Admin password for `admin@tlmena.com` should be changed before go-live
- `backend/src/seeders/run.js` is dev-only — never run in production (it TRUNCATEs all data)

## Environment Variables Required

| Variable | Used By |
|----------|---------|
| `DATABASE_URL` / `NEON_DATABASE_URL` | Both servers |
| `JWT_SECRET` | Both servers |
| `RESEND_API_KEY` | Public backend (emails) |
| `RESEND_FROM_EMAIL` | Public backend |
| `APP_URL` | Public backend |
