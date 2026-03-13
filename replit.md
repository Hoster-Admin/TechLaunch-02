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

Uses Replit's built-in PostgreSQL. Schema includes:
- users, products, entities, comments, upvotes, bookmarks
- accelerator_applications, investor_pitches, notifications
- platform_settings, team_members, activity_log, refresh_tokens

Run migrations: `cd backend && node src/migrations/run.js`

## Environment

- Backend `.env`: DB_HOST=helium, DB_PORT=5432, DB_NAME=heliumdb, DB_USER=postgres, PORT=3001
- Frontend `.env`: PORT=5000, HOST=0.0.0.0, DANGEROUSLY_DISABLE_HOST_CHECK=true

## Production Deployment

- Build: `cd frontend && npm run build`
- Run: `cd backend && NODE_ENV=production PORT=5000 node src/server.js`
  - In production, Express serves the built React app as static files
