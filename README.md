# 🚀 Tech Launch — System Structure

MENA's premier product discovery platform. A full-stack web application built with Node.js, React, and PostgreSQL following the MVC pattern.

---

## 📁 Full Directory Structure

```
techlaunch/
├── README.md                          ← This file
├── docker-compose.yml                 ← Docker setup (PostgreSQL + API + Client)
│
├── backend/                           ← Node.js REST API (MVC)
│   ├── .env.example                   ← Environment variable template
│   ├── package.json
│   └── src/
│       ├── server.js                  ← Express app entry point
│       │
│       ├── config/
│       │   └── database.js            ← PostgreSQL pool (pg)
│       │
│       ├── migrations/
│       │   ├── 001_schema.sql         ← Full DB schema (tables, triggers, enums)
│       │   └── run.js                 ← Migration runner
│       │
│       ├── seeders/
│       │   └── run.js                 ← Demo data seeder (15 products, 14 users, entities)
│       │
│       ├── models/                    ← (Thin models — queries live in controllers)
│       │
│       ├── controllers/               ← MVC: business logic
│       │   ├── authController.js      ← Register, login, refresh, logout, me
│       │   ├── productController.js   ← CRUD, upvote, bookmark, waitlist, comments
│       │   ├── entityController.js    ← Accelerators, investors, studios
│       │   ├── userController.js      ← Profile, follow, bookmarks, notifications
│       │   └── adminController.js     ← Full admin panel backend
│       │
│       ├── routes/
│       │   └── index.js               ← All routes mounted here
│       │
│       ├── middleware/
│       │   ├── auth.js                ← JWT authentication + role guards
│       │   └── error.js               ← Validation, error handler, 404
│       │
│       └── utils/                     ← Helpers (as needed)
│
└── frontend/                          ← React + Tailwind CSS
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── index.js                   ← React entry point
        ├── App.jsx                    ← Router + protected routes
        │
        ├── styles/
        │   └── index.css              ← Tailwind + custom design tokens
        │
        ├── utils/
        │   └── api.js                 ← Axios instance + all API calls
        │
        ├── context/
        │   └── AuthContext.jsx        ← Global auth state (user, login, logout)
        │
        ├── components/
        │   ├── ui/
        │   │   └── index.jsx          ← Button, Badge, Modal, Input, Avatar, Toggle…
        │   ├── layout/
        │   │   └── Navbar.jsx         ← Responsive top nav
        │   ├── home/
        │   │   └── ProductCard.jsx    ← Product card with live upvote/bookmark
        │   └── admin/
        │       ├── AdminSidebar.jsx   ← Left nav with pending count badge
        │       └── AdminLayout.jsx    ← Sidebar + topbar wrapper
        │
        └── pages/
            ├── home/
            │   ├── HomePage.jsx       ← Product feed with filters + search
            │   └── AuthPages.jsx      ← Login + Register
            └── admin/
                ├── AdminDashboard.jsx ← Stats, queue, charts, activity
                ├── AdminProducts.jsx  ← Table with approve/reject/feature/delete
                └── AdminPages.jsx     ← Users, Entities, Applications, Reports, Settings, Profile
```

---

## 🗄️ Database Schema (PostgreSQL)

### Tables

| Table                      | Description                                      |
|----------------------------|--------------------------------------------------|
| `users`                    | All users — role, persona, status, verified      |
| `products`                 | Product listings with status, featured, upvotes  |
| `product_media`            | Screenshots/videos per product                   |
| `upvotes`                  | User ↔ product upvotes (unique per pair)         |
| `bookmarks`                | User ↔ product bookmarks                         |
| `comments`                 | Comments + threaded replies                      |
| `waitlist_signups`         | Email signups per product                        |
| `entities`                 | Accelerators, investors, venture studios         |
| `follows`                  | User → User follow graph                         |
| `accelerator_applications` | Founder → Accelerator applications               |
| `investor_pitches`         | Founder → Investor pitch requests                |
| `notifications`            | Per-user notification inbox                      |
| `platform_posts`           | Admin public profile posts                       |
| `platform_settings`        | Key-value store for all platform toggles         |
| `team_members`             | Admin team with role assignments                 |
| `activity_log`             | Audit trail for all admin actions                |
| `refresh_tokens`           | JWT refresh token store with revocation          |

### Enums

| Enum              | Values                                                          |
|-------------------|-----------------------------------------------------------------|
| `user_role`       | `user`, `admin`, `moderator`, `editor`, `analyst`              |
| `user_persona`    | `Founder`, `Investor`, `Product Manager`, `Accelerator`, `Enthusiast` |
| `user_status`     | `active`, `suspended`, `banned`, `pending_verification`        |
| `product_status`  | `pending`, `live`, `soon`, `rejected`, `draft`                 |
| `entity_type`     | `startup`, `accelerator`, `investor`, `venture_studio`         |
| `app_status`      | `pending`, `reviewing`, `accepted`, `rejected`                 |
| `pitch_status`    | `sent`, `reviewing`, `interested`, `follow-up`, `rejected`, `funded` |
| `post_type`       | `update`, `milestone`, `feature`, `news`                       |

### Database Triggers (automatic)

| Trigger                   | Effect                                              |
|---------------------------|-----------------------------------------------------|
| `trg_upvote_count`        | Auto-increments `products.upvotes_count`            |
| `trg_bookmark_count`      | Auto-increments `products.bookmarks_count`          |
| `trg_follow_count`        | Syncs `users.followers_count` + `following_count`  |
| `trg_comment_count`       | Auto-increments `products.comments_count`           |
| `trg_*_updated_at`        | Auto-updates `updated_at` on all major tables       |

---

## 🔌 REST API Endpoints

### Auth  `/api/auth`
| Method | Path        | Auth | Description                   |
|--------|-------------|------|-------------------------------|
| POST   | `/register` | ✗    | Create account                |
| POST   | `/login`    | ✗    | Login → returns JWT tokens    |
| POST   | `/refresh`  | ✗    | Refresh access token          |
| POST   | `/logout`   | ✗    | Revoke refresh token          |
| GET    | `/me`       | ✓    | Get current user              |

### Products  `/api/products`
| Method | Path                    | Auth     | Description                   |
|--------|-------------------------|----------|-------------------------------|
| GET    | `/`                     | Optional | List with filters/pagination  |
| GET    | `/:id`                  | Optional | Product detail                |
| POST   | `/`                     | ✓        | Submit product                |
| PUT    | `/:id`                  | ✓ Owner  | Update product                |
| DELETE | `/:id`                  | ✓ Mod    | Delete product                |
| POST   | `/:id/upvote`           | ✓        | Toggle upvote                 |
| POST   | `/:id/bookmark`         | ✓        | Toggle bookmark               |
| POST   | `/:id/waitlist`         | Optional | Join waitlist                 |
| GET    | `/:id/comments`         | Optional | Get comments                  |
| POST   | `/:id/comments`         | ✓        | Post comment                  |

### Entities  `/api/entities`
| Method | Path         | Auth | Description                   |
|--------|--------------|------|-------------------------------|
| GET    | `/`          | ✗    | List (filter by type)         |
| GET    | `/:slug`     | ✗    | Entity detail                 |
| POST   | `/:id/apply` | ✓    | Apply to accelerator          |
| POST   | `/:id/pitch` | ✓    | Send investor pitch           |

### Users  `/api/users`
| Method | Path                        | Auth | Description          |
|--------|-----------------------------|------|----------------------|
| GET    | `/:handle`                  | Optional | Public profile   |
| PUT    | `/me`                       | ✓    | Update profile       |
| POST   | `/me/change-password`       | ✓    | Change password      |
| POST   | `/:id/follow`               | ✓    | Toggle follow        |
| GET    | `/me/bookmarks`             | ✓    | My bookmarks         |
| GET    | `/me/notifications`         | ✓    | My notifications     |
| PUT    | `/me/notifications/read`    | ✓    | Mark all read        |

### Admin  `/api/admin`  (requires admin/moderator role)
| Method | Path                        | Role     | Description               |
|--------|-----------------------------|----------|---------------------------|
| GET    | `/dashboard`                | Mod      | Full dashboard stats      |
| GET    | `/products`                 | Mod      | All products (admin view) |
| POST   | `/products/:id/approve`     | Mod      | Approve product           |
| POST   | `/products/:id/reject`      | Mod      | Reject product            |
| POST   | `/products/:id/featured`    | Editor   | Toggle featured           |
| GET    | `/users`                    | Mod      | All users                 |
| GET    | `/users/:id`                | Mod      | User detail               |
| POST   | `/users/:id/verify`         | Mod      | Verify user badge         |
| POST   | `/users/:id/suspend`        | Mod      | Suspend user              |
| POST   | `/users/:id/reinstate`      | Mod      | Reinstate user            |
| GET    | `/entities`                 | Mod      | All entities              |
| POST   | `/entities/:id/verify`      | Mod      | Verify entity             |
| GET    | `/applications`             | Mod      | All applications (r/o)    |
| GET    | `/settings`                 | Admin    | Platform settings         |
| PUT    | `/settings`                 | Admin    | Update settings           |
| GET    | `/team`                     | Admin    | Team members              |
| POST   | `/team`                     | Admin    | Add team member           |
| DELETE | `/team/:id`                 | Admin    | Remove team member        |
| GET    | `/reports`                  | Mod      | Analytics & reports       |
| GET    | `/posts`                    | Mod      | Platform posts            |
| POST   | `/posts`                    | Mod      | Create platform post      |
| DELETE | `/posts/:id`                | Mod      | Delete platform post      |

---

## 🎨 Frontend Pages

### Public / Home Site
| Route              | Page              | Description                              |
|--------------------|-------------------|------------------------------------------|
| `/`                | HomePage          | Product feed with filters, search, hero  |
| `/login`           | LoginPage         | Sign in form                             |
| `/register`        | RegisterPage      | Registration with persona selector       |
| `/products`        | HomePage          | Filtered product listing                 |
| `/products/:id`    | ProductDetail     | Full product page, comments, waitlist    |
| `/entities`        | EntitiesPage      | Accelerators / Investors / Studios       |
| `/u/:handle`       | UserProfile       | Public user profile                      |
| `/submit`          | SubmitProduct     | Multi-step product submission form       |
| `/bookmarks`       | Bookmarks         | Saved products                           |
| `/notifications`   | Notifications     | User notification inbox                  |

### Admin Panel  `/admin/*`
| Route                   | Page               | Description                            |
|-------------------------|--------------------|----------------------------------------|
| `/admin`                | AdminDashboard     | Stats, pending queue, charts, activity |
| `/admin/products`       | AdminProducts      | Table with approve/reject/feature      |
| `/admin/users`          | AdminUsers         | User management + detail modal         |
| `/admin/entities`       | AdminEntities      | Verify entities by type                |
| `/admin/applications`   | AdminApplications  | Accel apps, pitches, waitlists         |
| `/admin/featured`       | AdminFeatured      | Homepage spotlight management          |
| `/admin/reports`        | AdminReports       | KPIs, country/industry/persona charts  |
| `/admin/settings`       | AdminSettings      | Toggles + roles + team management      |
| `/admin/profile`        | AdminProfile       | Platform profile + post composer       |

---

## 🔐 Security

| Layer            | Implementation                                              |
|------------------|-------------------------------------------------------------|
| Auth             | JWT access tokens (7d) + rotating refresh tokens (30d)     |
| Passwords        | bcrypt hash (cost factor 12)                               |
| Role Guards      | `authenticate` → `requireAdmin` / `requireMod` / `requireEditor` |
| Rate Limiting    | 100 req/15min global; 20 req/15min on auth routes          |
| SQL Injection    | Parameterized queries throughout (no string interpolation) |
| XSS              | Helmet.js headers + React auto-escaping                    |
| CORS             | Whitelist: `CLIENT_URL` env variable only                  |
| Token Revocation | Refresh tokens stored in DB with `revoked` flag            |
| Input Validation | express-validator on all mutation endpoints                 |

---

## ⚙️ Tech Stack

| Layer        | Technology                           |
|--------------|--------------------------------------|
| Backend      | Node.js + Express.js (MVC)           |
| Database     | PostgreSQL 15 + pg driver            |
| Auth         | JWT + bcryptjs + refresh tokens      |
| Frontend     | React 18 + React Router v6           |
| Styling      | Tailwind CSS 3 + custom design tokens|
| HTTP Client  | Axios with interceptors              |
| State        | React Context (auth) + local state   |
| Toasts       | react-hot-toast                      |
| Validation   | express-validator (backend)          |
| Security     | Helmet, CORS, rate-limit             |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm

### 1. Clone and install

```bash
git clone <repo>
cd techlaunch

# Backend
cd backend
cp .env.example .env        # Edit DB credentials
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup PostgreSQL

```bash
createdb techlaunch
cd backend
npm run migrate             # Run schema migrations
npm run seed                # Load demo data
```

### 3. Run development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev                 # http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm start                   # http://localhost:3000
```

### 4. Demo credentials

| Role  | Email                     | Password    |
|-------|---------------------------|-------------|
| Admin | admin@techlaunch.io       | admin123    |
| User  | sara@example.com          | password123 |

---

## 🌍 Environment Variables

### Backend `.env`

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techlaunch
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### Frontend (optional)
```env
REACT_APP_API_URL=/api
```

---

## 🏗️ Architecture (MVC)

```
HTTP Request
    ↓
Express Router (routes/index.js)
    ↓
Middleware (auth.js → authenticate → requireRole)
    ↓
Controller (authController / productController / adminController…)
    ↓
Database Query (config/database.js → pg pool)
    ↓
PostgreSQL (triggers auto-maintain counters)
    ↓
JSON Response
```

---

## 📦 Key Design Decisions

1. **No ORM** — Raw SQL with parameterized queries for full control and performance
2. **DB Triggers** — Upvote/bookmark/follow counters maintained automatically
3. **Rotating refresh tokens** — Revoked on use, stored in DB for security
4. **Optional auth** — Public endpoints work with or without token
5. **Lazy section rendering** — Admin panel only fetches data when section is opened
6. **Role hierarchy** — `admin > moderator > editor > analyst > user`
7. **Single repo** — Backend and frontend in one repo, served together in production

---

*Built for the MENA tech ecosystem 🌍*
