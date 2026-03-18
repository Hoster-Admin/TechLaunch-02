# Tech Launch MENA

A full-stack product discovery platform for the MENA region, similar to Product Hunt.

## Key Features (latest)
- **Unified Industry Dropdowns**: All 6 industry dropdown spots (HomePage filter, AllProductsPage filter, ListingPages filter, SubmitProductModal, CompanyTab settings, SubmitProductForm) now pull from a single source (`frontend/src/utils/menaIndustries.js`) with 15 canonical MENA industries, emoji icons, and search/filter functionality. No more native `<select>` elements for industry — all custom dropdowns with click-outside, overscroll containment, and hover states.
- **18-Bug QA Fix**: Comment edit/delete (3-dot menu), comment read-more truncation (280 chars), 1000-char limit with live counter, post content `pre-wrap`, custom delete modal with trash icon, post & article 3-dot owner menu, post read-more truncation (300 chars), broken image `onError` fallback, article image upload error handling, Follow button disabled during auth loading.
- **Launcher Routes**: Added `PATCH /api/launcher/:id` (editPost), `PATCH /api/launcher/comments/:id` (editComment), `DELETE /api/launcher/comments/:id` (deleteComment). Added `edited` column to `launcher_post_comments`.
- **ProductCard layout**: Vote/save buttons now in a row (horizontal), broken logo falls back to emoji, comment count badge shown.
- **Security Tab in Settings**: Users can change their password from Settings → Security tab. Uses `PUT /api/users/me/change-password` with toggle visibility and validation.
- **Product image upload fix**: `SubmitProductModal` now correctly parses `uploadRes.data?.data?.url` (not `data?.url`) from `/api/upload/post-image` response.
- **Email system**: Welcome, invite, password reset, submission confirmation, approval, and rejection emails via Resend.
- **Forgot/Reset password flow**: `POST /api/auth/forgot-password` + `POST /api/auth/reset-password` + `ResetPasswordPage` at `/reset-password`.
- **Navbar**: "Join Launcher" → "Community" (desktop + mobile); "Events" and "Weekly Digest" links removed; "Launcher" added to footer.
- **AllProductsPage**: Shows only `live,soon` products, URL-syncs `?q=` search param.
- **robots.txt**: Served statically from public folder.
- **Discount Signup Box**: Live product pages have an orange-styled "Launch Discount — 40% off" card where users enter name + email. Stored in `discount_signups` table.
- **Waitlist Modal**: Collects name + email (name field added). Stored in `waitlist_signups.name` column.
- **Product Comments**: Show real user name/handle/avatar (fixed "Anonymous" bug — backend returns `author_name`/`author_handle` flat fields).
- **Admin Email Signups**: `/admin/email-signups` page shows both waitlist and discount signup emails with product info, with CSV export.
- **Threaded Launcher Comments**: Replies nested under parent comments with collapsible toggle.
- **Community Posts System**: Full CRUD for posts and articles. `SubmitPostModal` supports drafts, publish, edit. Auth-gated buttons on Articles/Home pages.
- **Settings My Drafts Tab**: Users can view, edit, publish, and delete their drafts from the Settings page.
- **Signup Welcome Flow**: New users redirected to `/u/:handle?welcome=1` showing a welcome modal.

## Architecture

- **Public Frontend**: React (CRA) in `frontend/` — zero admin code, served at `/` by Express on port 5000
- **Admin Frontend**: React (Vite) in `admin/` — fully separate app, served at `/admin/*` by same Express server
  - Login at `/admin/login` (own auth, blocks non-admin roles at login time)
  - `basename="/admin"` in BrowserRouter, own `adminAccessToken` localStorage keys
  - Build: `cd admin && npm run build` → `admin/dist/`
- **Backend**: Express.js REST API — runs on port 5000 (production)
- **Database**: PostgreSQL on Neon (via NEON_DATABASE_URL)
- **Auth**: JWT (access token 7d) + UUID refresh tokens stored in `refresh_tokens` table

## Security Notes (Production-hardened)

- Helmet `frameguard` is **disabled** (`frameguard: false`) to allow iframe embedding (Replit preview, partner embeds). CSP `frame-ancestors 'self' https:` allows embedding from any HTTPS origin.
- CSP `connectSrc` includes `wss:` for WebSocket support.
- Rate limiting: 100 req/15 min on `/api/*`, 20 req/15 min on `/api/auth/login` and `/api/auth/register`.
- API client (`frontend/src/utils/api.js`) does NOT show global error toasts — each component handles its own errors. This prevents double-toast scenarios.
- `entity_type` enum values: `startup`, `accelerator`, `investor`, `venture_studio` (NOT "company").

## Database (Neon)

- Server uses `NEON_DATABASE_URL` (not `DATABASE_URL`)
- All community tables have UUID primary keys
- `community_tags.created_by` is UUID type
- DB is currently empty (purged for launch). Tags preserved: 5 community tags, 11 product tags.

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
│   │   ├── migrations/  (001_schema.sql, 002_invite_tokens.sql, 003_community.sql)
│   │   ├── services/    (emailService.js - Resend transactional email)
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
