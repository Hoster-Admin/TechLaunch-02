require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const { Pool }   = require('pg');
const path       = require('path');
const { sendAdminCreatedAccountEmail, sendPublicInvitationEmail } = require('../../backend/src/services/emailService');

// ─── FIX 15: Startup validation — crash fast if critical env vars are missing ─
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}
if (!process.env.NEON_DATABASE_URL && !process.env.DATABASE_URL) {
  console.error('FATAL: NEON_DATABASE_URL environment variable is not set. Refusing to start.');
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || process.env.ADMIN_PORT || 5000;
// FIX 1: JWT_SECRET fallback removed — crashes above if missing
const JWT_SECRET = process.env.JWT_SECRET;

const getAdminUrl = () => {
  if (process.env.ADMIN_URL) return process.env.ADMIN_URL;
  if (process.env.REPLIT_DOMAINS) return 'https://' + process.env.REPLIT_DOMAINS.split(',')[0].trim();
  if (process.env.REPLIT_DEV_DOMAIN) return 'https://' + process.env.REPLIT_DEV_DOMAIN;
  return `http://localhost:${PORT}`;
};

// ─── DATABASE ─────────────────────────────────────────────────────────────────
const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool(
  dbUrl
    ? { connectionString: dbUrl, ssl: { rejectUnauthorized: false }, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 }
    : { host: process.env.PGHOST || 'localhost', port: parseInt(process.env.PGPORT || 5432), database: process.env.PGDATABASE || 'techlaunch', user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'password' }
);
pool.on('connect', () => console.log('✅ DB connected'));
pool.on('error',   e  => console.error('❌ DB error:', e.message));
const q = (sql, p) => pool.query(sql, p);

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
// FIX 4: Re-enabled Helmet CSP and frameguard
app.use(helmet());
const isProd = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = [
  'https://tlmena.com',
  'https://www.tlmena.com',
  'https://admin.tlmena.com',
  process.env.CORS_ORIGIN || null,
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
  !isProd ? 'http://localhost:5174' : null,
  !isProd ? 'http://localhost:5000' : null,
  ...(process.env.ADMIN_CLIENT_URL ? [process.env.ADMIN_CLIENT_URL] : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);  // same-origin / server-to-server
    if (ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + '/'))) return cb(null, true);
    if (!isProd && (origin.startsWith('http://localhost') || origin.includes('.replit.dev'))) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
// FIX 12: Reduce body limit from 10mb to 100kb
app.use(express.json({ limit: '100kb' }));
// FIX 16: Use 'combined' format in production
app.use(morgan(isProd ? 'combined' : 'dev'));

// FIX 2: Rate limiting on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'No token' });
  try {
    const { userId } = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const { rows } = await q('SELECT id,name,handle,email,role,status,avatar_color,force_password_change FROM users WHERE id=$1', [userId]);
    if (!rows.length) return res.status(401).json({ success:false, message:'User not found' });
    if (rows[0].status !== 'active') return res.status(403).json({ success:false, message:'Account suspended' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ success:false, message:'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success:false, message:'Not authenticated' });
  if (!['admin','moderator','editor'].includes(req.user.role))
    return res.status(403).json({ success:false, message:'Admin access required' });
  next();
};

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success:false, message:'Email and password required' });
  try {
    const { rows } = await q('SELECT id,name,handle,email,role,status,avatar_color,password_hash FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (!rows.length) return res.status(401).json({ success:false, message:'Invalid credentials' });
    const user = rows[0];
    if (!['admin','moderator','editor'].includes(user.role))
      return res.status(403).json({ success:false, message:'Admin access only' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success:false, message:'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    const { password_hash, ...safeUser } = user;
    res.json({ success:true, data: { token, user: safeUser } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

app.get('/api/auth/me', authenticate, requireAdmin, (req, res) => {
  res.json({ success:true, data: { user: req.user } });
});

// ─── ACCOUNT ACTIVATION ───────────────────────────────────────────────────────
app.get('/api/auth/activate/:token', async (req, res) => {
  try {
    const { rows } = await q(
      `SELECT at.id, at.user_id, at.used_at, at.expires_at, u.name, u.email, u.role
       FROM activation_tokens at JOIN users u ON u.id = at.user_id
       WHERE at.token = $1`, [req.params.token]
    );
    if (!rows.length) return res.json({ success:false, message:'Invalid or expired link' });
    const r = rows[0];
    if (r.used_at) return res.json({ success:false, message:'This link has already been used' });
    if (new Date(r.expires_at) < new Date()) return res.json({ success:false, message:'This link has expired. Please ask your admin to resend the invitation.' });
    res.json({ success:true, data:{ name: r.name, email: r.email, role: r.role } });
  } catch (e) { res.status(500).json({ success:false, message:'Internal server error' }); }
});

app.post('/api/auth/activate', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8)
    return res.status(400).json({ success:false, message:'Password must be at least 8 characters' });
  try {
    const { rows } = await q(
      `SELECT at.id, at.user_id, at.used_at, at.expires_at FROM activation_tokens at WHERE at.token = $1`,
      [token]
    );
    if (!rows.length) return res.status(400).json({ success:false, message:'Invalid or expired link' });
    const r = rows[0];
    if (r.used_at) return res.status(400).json({ success:false, message:'This link has already been used' });
    if (new Date(r.expires_at) < new Date()) return res.status(400).json({ success:false, message:'Link expired' });
    const hash = await bcrypt.hash(password, 10);
    await q(`UPDATE users SET password_hash=$1, email_verified=true, status='active', force_password_change=false WHERE id=$2`, [hash, r.user_id]);
    await q(`UPDATE activation_tokens SET used_at=NOW() WHERE id=$1`, [r.id]);
    res.json({ success:true, message:'Account activated! You can now log in.' });
  } catch (e) { res.status(500).json({ success:false, message:'Internal server error' }); }
});

app.post('/api/admin/auth/change-password', authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 8)
    return res.status(400).json({ success:false, message:'New password must be at least 8 characters' });
  try {
    const { rows } = await q(`SELECT password_hash FROM users WHERE id=$1`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'User not found' });
    if (current_password) {
      const ok = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!ok) return res.status(401).json({ success:false, message:'Current password is incorrect' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await q(`UPDATE users SET password_hash=$1, force_password_change=false WHERE id=$2`, [hash, req.user.id]);
    res.json({ success:true, message:'Password updated successfully' });
  } catch(e) { res.status(500).json({ success:false, message:'Internal server error' }); }
});

app.get('/activate', (req, res) => {
  const adminUrl = getAdminUrl();
  const publicUrl = process.env.APP_URL || 'https://tlmena.com';
  const logoUrl = `${adminUrl}/logo-icon.png`;
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Activate Account — TechLaunch MENA</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px}
    .wrap{width:100%;max-width:420px}
    .logo-bar{text-align:center;margin-bottom:24px}
    .logo-bar img{height:52px;border-radius:14px}
    .card{background:#fff;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.09);overflow:hidden}
    .card-top{background:#0a0a0a;padding:32px 36px;text-align:center}
    .card-top h1{color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.3px;margin:0}
    .card-top p{color:rgba(255,255,255,0.4);font-size:13px;margin:6px 0 0}
    .card-body{padding:32px 36px}
    .greeting{font-size:15px;color:#374151;line-height:1.6;text-align:center;margin-bottom:28px}
    .greeting strong{color:#111827}
    label{display:block;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
    input[type=password]{width:100%;padding:13px 16px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:15px;color:#111827;outline:none;transition:border-color .15s;background:#fff}
    input[type=password]:focus{border-color:#E15033;box-shadow:0 0 0 3px rgba(225,80,51,0.1)}
    .field{margin-bottom:18px}
    .submit-btn{width:100%;padding:14px;background:#E15033;color:#fff;font-size:15px;font-weight:700;border:none;border-radius:10px;cursor:pointer;margin-top:8px;letter-spacing:0.1px;transition:opacity .15s}
    .submit-btn:hover:not(:disabled){opacity:.9}
    .submit-btn:disabled{opacity:.45;cursor:not-allowed}
    .msg{display:none;padding:14px 16px;border-radius:10px;font-size:14px;margin-top:18px;text-align:center;line-height:1.5}
    .msg.error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
    .msg.success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
    .redirect-note{font-size:13px;color:#6b7280;text-align:center;margin-top:14px}
    .redirect-note a{color:#E15033;text-decoration:none;font-weight:600}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo-bar"><img src="${logoUrl}" alt="TechLaunch MENA"/></div>
    <div class="card">
      <div class="card-top">
        <h1>Activate Your Account</h1>
        <p>TechLaunch MENA</p>
      </div>
      <div class="card-body">
        <p class="greeting" id="greeting">Loading your invitation&hellip;</p>
        <div id="form-area" style="display:none">
          <div class="field">
            <label>New Password</label>
            <input type="password" id="pw1" placeholder="At least 8 characters" autocomplete="new-password"/>
          </div>
          <div class="field">
            <label>Confirm Password</label>
            <input type="password" id="pw2" placeholder="Repeat your password" autocomplete="new-password"/>
          </div>
          <button class="submit-btn" id="btn" onclick="activate()">Activate My Account</button>
        </div>
        <div class="msg" id="msg"></div>
        <div class="redirect-note" id="redirect-note" style="display:none"></div>
      </div>
    </div>
  </div>
  <script>
    const ADMIN_URL  = '${adminUrl}';
    const PUBLIC_URL = '${publicUrl}';
    const token = new URLSearchParams(location.search).get('token');
    const msg      = document.getElementById('msg');
    const formArea = document.getElementById('form-area');
    const greeting = document.getElementById('greeting');
    const redirectNote = document.getElementById('redirect-note');
    let userRole = null;

    function show(text, type) {
      msg.textContent = text; msg.className = 'msg ' + type; msg.style.display = 'block';
    }

    if (!token) {
      greeting.innerHTML = '<span style="color:#b91c1c">No activation token found in this link.</span>';
    } else {
      fetch('/api/auth/activate/' + token)
        .then(r => r.json())
        .then(data => {
          if (!data.success) {
            greeting.innerHTML = '<span style="color:#b91c1c">' + data.message + '</span>';
          } else {
            userRole = data.data.role;
            const isTeam = userRole !== 'user';
            greeting.innerHTML = 'Hi <strong>' + data.data.name + '</strong>! Set a password to activate your ' + (isTeam ? 'admin' : '') + ' account.';
            formArea.style.display = 'block';
          }
        })
        .catch(() => {
          greeting.innerHTML = '<span style="color:#b91c1c">Could not load invitation. Please try again.</span>';
        });
    }

    async function activate() {
      const pw1 = document.getElementById('pw1').value;
      const pw2 = document.getElementById('pw2').value;
      const btn = document.getElementById('btn');
      if (!pw1 || pw1.length < 8) return show('Password must be at least 8 characters.', 'error');
      if (pw1 !== pw2) return show('Passwords do not match.', 'error');
      btn.disabled = true; btn.textContent = 'Activating…';
      try {
        const res  = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: pw1 })
        });
        const data = await res.json();
        if (data.success) {
          formArea.style.display = 'none';
          greeting.textContent = '';
          const isTeam = userRole !== 'user';
          const loginUrl = isTeam ? ADMIN_URL + '/' : PUBLIC_URL + '/login';
          show('Account activated! Redirecting you to sign in…', 'success');
          redirectNote.innerHTML = 'Not redirecting? <a href="' + loginUrl + '">Click here to log in</a>';
          redirectNote.style.display = 'block';
          setTimeout(() => { window.location.href = loginUrl; }, 2500);
        } else {
          show(data.message || 'Something went wrong.', 'error');
          btn.disabled = false; btn.textContent = 'Activate My Account';
        }
      } catch {
        show('Network error. Please try again.', 'error');
        btn.disabled = false; btn.textContent = 'Activate My Account';
      }
    }
  </script>
</body>
</html>`);
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
const admin = express.Router();
admin.use(authenticate, requireAdmin);

// ─── AUDIT LOG HELPER ────────────────────────────────────────────────────────
// FIX 10: logAction now accepts optional ip parameter — stored inside details JSON
async function logAction(actorId, action, entity, entityId, details, ip) {
  try {
    const detailsWithIp = { ...(details || {}), ...(ip ? { _ip: ip } : {}) };
    await q(`INSERT INTO activity_log (actor_id,action,entity,entity_id,details) VALUES ($1,$2,$3,$4,$5)`,
      [actorId||null, action, entity||null, entityId||null, JSON.stringify(detailsWithIp)]);
  } catch(_) { /* non-fatal */ }
}

// FIX 17: 30-second in-memory cache for dashboard stat queries
const _dashCache = { data: null, ts: 0 };
const DASH_TTL = 30_000;

// Dashboard
admin.get('/dashboard', async (req, res) => {
  try {
    if (_dashCache.data && Date.now() - _dashCache.ts < DASH_TTL) {
      return res.json({ success: true, data: _dashCache.data });
    }
    const [products, users, upvotes, apps, waitlist, activity, topProducts, newUsers, upvoteChart, signupChart] =
      await Promise.all([
        q(`SELECT COUNT(*) FILTER(WHERE status='live') AS live, COUNT(*) FILTER(WHERE status='pending') AS pending, COUNT(*) FILTER(WHERE status='soon') AS soon, COUNT(*) FILTER(WHERE status='rejected') AS rejected, COUNT(*) AS total FROM products`),
        q(`SELECT COUNT(*) FILTER(WHERE status='active') AS active, COUNT(*) AS total FROM users WHERE role='user'`),
        q(`SELECT COALESCE(SUM(upvotes_count),0) AS total FROM products`),
        q(`SELECT COUNT(*) FILTER(WHERE status IN ('pending','reviewing')) AS pending FROM accelerator_applications`),
        q(`SELECT COALESCE(SUM(waitlist_count),0) AS total FROM products`),
        q(`SELECT al.action, al.created_at, al.details, u.name AS actor_name, u.handle AS actor_handle, u.avatar_color FROM activity_log al LEFT JOIN users u ON u.id=al.actor_id ORDER BY al.created_at DESC LIMIT 10`),
        q(`SELECT id,name,logo_emoji,industry,upvotes_count,status FROM products WHERE status='live' ORDER BY upvotes_count DESC LIMIT 5`),
        q(`SELECT id,name,handle,persona,country,avatar_color,created_at FROM users WHERE role='user' ORDER BY created_at DESC LIMIT 8`),
        q(`SELECT TO_CHAR(DATE_TRUNC('day',created_at),'Dy') AS day, COUNT(*) AS count FROM upvotes WHERE created_at>NOW()-INTERVAL '7 days' GROUP BY DATE_TRUNC('day',created_at),day ORDER BY DATE_TRUNC('day',created_at)`),
        q(`SELECT TO_CHAR(DATE_TRUNC('week',created_at),'WW') AS week, COUNT(*) AS count FROM users WHERE role='user' AND created_at>NOW()-INTERVAL '8 weeks' GROUP BY DATE_TRUNC('week',created_at),week ORDER BY DATE_TRUNC('week',created_at)`),
      ]);
    const dashData = {
      stats: { products:products.rows[0], users:users.rows[0], upvotes:parseInt(upvotes.rows[0].total), apps_pending:parseInt(apps.rows[0].pending), waitlist:parseInt(waitlist.rows[0].total) },
      topProducts: topProducts.rows, newUsers: newUsers.rows, activity: activity.rows,
      charts: { upvotes: upvoteChart.rows, signups: signupChart.rows },
    };
    _dashCache.data = dashData;
    _dashCache.ts = Date.now();
    res.json({ success:true, data: dashData });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Products
admin.get('/products', async (req, res) => {
  try {
    const { status, search, page=1, limit=50, sortBy='created_at', sortDir='desc' } = req.query;
    const SAFE_COLS_P = { name:1, status:1, upvotes_count:1, created_at:1, country:1 };
    const col_p = SAFE_COLS_P[sortBy] ? `p.${sortBy}` : 'p.created_at';
    const dir_p = sortDir === 'asc' ? 'ASC' : 'DESC';
    const params = [], conds = [];
    if (status && status !== 'all') {
      if (status === 'featured') conds.push('p.featured=true');
      else { params.push(status); conds.push(`p.status=$${params.length}`); }
    }
    if (search) { params.push(`%${search}%`); conds.push(`(p.name ILIKE $${params.length} OR p.tagline ILIKE $${params.length})`); }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await q(`SELECT p.*,u.name AS submitter_name,u.handle AS submitter_handle,COUNT(*) OVER() AS total_count FROM products p JOIN users u ON u.id=p.submitted_by ${where} ORDER BY ${col_p} ${dir_p} LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json({ success:true, data: rows.map(({total_count,...r})=>r), pagination:{total:parseInt(rows[0]?.total_count||0)} });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.get('/products/:id', async (req, res) => {
  try {
    const { rows } = await q(`
      SELECT p.*, u.name AS submitter_name, u.handle AS submitter_handle,
             u.email AS submitter_email, u.persona AS submitter_persona,
             u.avatar_color AS submitter_avatar_color, u.verified AS submitter_verified
      FROM products p
      JOIN users u ON u.id = p.submitted_by
      WHERE p.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: rows[0] });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/products/:id/approve', async (req, res) => {
  try {
    const { note } = req.body;
    const { rows } = await q(
      `UPDATE products SET status='live', approved_by=$1, approved_at=NOW(), approval_note=$2
       WHERE id=$3 RETURNING name, slug, submitted_by`,
      [req.user.id, note?.trim() || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'product.approve', 'product', req.params.id, { name:rows[0].name, note: note?.trim()?.slice(0,80) || null }, req.ip);
    if (rows[0].submitted_by) {
      const { rows: founder } = await q(`SELECT email, name FROM users WHERE id=$1`, [rows[0].submitted_by]);
      if (founder[0]?.email) {
        const { sendApprovalEmail } = require('../../backend/src/services/emailService');
        sendApprovalEmail({
          to: founder[0].email,
          founderName: founder[0].name,
          productName: rows[0].name,
          productSlug: rows[0].slug,
          note: note?.trim() || null,
        }).catch(err => console.error('[Email] approval failed:', err.message));
      }
    }
    res.json({ success:true, message:`${rows[0].name} approved` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/products/:id/reject', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE products SET status='rejected',rejected_reason=$1 WHERE id=$2 RETURNING name`, [req.body.reason||null, req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'product.rejected', 'product', req.params.id, { name:rows[0].name, reason:req.body.reason||null }, req.ip);
    res.json({ success:true, message:`${rows[0].name} rejected` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/products/:id/featured', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE products SET featured=NOT featured WHERE id=$1 RETURNING name,featured`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, rows[0].featured ? 'product.featured' : 'product.unfeatured', 'product', req.params.id, { name:rows[0].name }, req.ip);
    res.json({ success:true, data:rows[0] });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Users
admin.get('/users', async (req, res) => {
  try {
    const { status, persona, verified, search, page=1, limit=50, sortBy='created_at', sortDir='desc' } = req.query;
    const SAFE_COLS_U = { name:1, status:1, created_at:1, persona:1, products_count:1, verified:1 };
    const col_u = SAFE_COLS_U[sortBy] ? `u.${sortBy}` : 'u.created_at';
    const dir_u = sortDir === 'asc' ? 'ASC' : 'DESC';
    const params = [], conds = [`u.role='user'`];
    if (status)  { params.push(status);  conds.push(`u.status=$${params.length}`); }
    if (persona) { params.push(persona); conds.push(`u.persona=$${params.length}`); }
    if (verified==='true') conds.push('u.verified=true');
    if (search)  { params.push(`%${search}%`); conds.push(`(u.name ILIKE $${params.length} OR u.handle ILIKE $${params.length})`); }
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await q(`SELECT u.id,u.name,u.handle,u.email,u.persona,u.country,u.verified,u.status,u.role,u.avatar_color,u.created_at,u.products_count,u.votes_given,u.followers_count,COUNT(*) OVER() AS total_count FROM users u WHERE ${conds.join(' AND ')} ORDER BY ${col_u} ${dir_u} LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json({ success:true, data:rows.map(({total_count,...r})=>r), pagination:{total:parseInt(rows[0]?.total_count||0)} });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/users', async (req, res) => {
  try {
    const { name, email, role='moderator', persona, country, handle: customHandle } = req.body;
    if (!email) return res.status(400).json({ success:false, message:'Email is required' });
    const allowed = ['admin','moderator','editor','user'];
    if (!allowed.includes(role)) return res.status(400).json({ success:false, message:'Invalid role' });
    // FIX 3: Only admins can create admin accounts (privilege escalation guard)
    if (role === 'admin' && req.user.role !== 'admin')
      return res.status(403).json({ success:false, message:'Only admins can create admin accounts' });
    const isTeam = role !== 'user';
    const handle = customHandle?.trim()
      ? customHandle.toLowerCase().replace(/[^a-z0-9_]/g,'')
      : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'_') + '_' + Math.floor(Math.random()*100);
    const resolvedName = name?.trim() || handle;
    const tempPwd = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!';
    const hash   = await bcrypt.hash(tempPwd, 10);
    const colors = ['#E15033','#2563eb','#7c3aed','#16a34a','#d97706'];
    const color  = colors[Math.floor(Math.random()*colors.length)];
    const cols   = ['name','handle','email','password_hash','role','status','verified','email_verified','avatar_color','force_password_change'];
    const vals   = [resolvedName, handle, email.toLowerCase().trim(), hash, role, 'active', isTeam, isTeam, color, isTeam];
    if (persona) { cols.push('persona'); vals.push(persona); }
    if (country) { cols.push('country'); vals.push(country); }
    const placeholders = vals.map((_,i)=>`$${i+1}`).join(',');
    const { rows } = await q(`INSERT INTO users (${cols.join(',')}) VALUES (${placeholders}) RETURNING id,name,email,role`, vals);
    await logAction(req.user.id, 'user.created', 'user', rows[0].id, { name:rows[0].name, role:rows[0].role }, req.ip);
    // Generate activation token and send invitation email (non-blocking)
    // FIX 14: crypto is now imported at the top of the file
    const activationToken = crypto.randomBytes(32).toString('hex');
    q(`INSERT INTO activation_tokens (user_id, token) VALUES ($1, $2)`, [rows[0].id, activationToken]).catch(e => console.error('[Token] Failed to store activation token:', e.message));
    const activationLink = `${getAdminUrl()}/activate?token=${activationToken}`;
    if (rows[0].role === 'user') {
      sendPublicInvitationEmail({ to: rows[0].email, name: rows[0].name, activationLink }).catch(() => {});
    } else {
      sendAdminCreatedAccountEmail({ to: rows[0].email, name: rows[0].name, role: rows[0].role, activationLink }).catch(() => {});
    }
    res.json({ success:true, data:rows[0], message:`${rows[0].name} added successfully` });
  } catch(e) {
    if (e.code==='23505') return res.status(409).json({ success:false, message:'Email already in use' });
    res.status(500).json({ success:false, message:'Internal server error' });
  }
});

admin.get('/users/team', async (req, res) => {
  try {
    const { rows } = await q(`SELECT id,name,handle,email,role,status,verified,avatar_color,created_at FROM users WHERE role IN ('admin','moderator','editor') ORDER BY created_at ASC`);
    res.json({ success:true, data:rows });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.get('/users/:id', async (req, res) => {
  try {
    const [uRes, pRes] = await Promise.all([
      q(`SELECT u.*, COUNT(p.id) AS products_count FROM users u LEFT JOIN products p ON p.submitted_by = u.id WHERE u.id = $1 GROUP BY u.id`, [req.params.id]),
      q(`SELECT id, name, logo_emoji, status, upvotes_count, created_at FROM products WHERE submitted_by = $1 ORDER BY created_at DESC LIMIT 5`, [req.params.id]),
    ]);
    if (!uRes.rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: { ...uRes.rows[0], recent_products: pRes.rows } });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/users/:id/verify', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE users SET verified=true WHERE id=$1 RETURNING name`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'user.verified', 'user', req.params.id, { name:rows[0].name }, req.ip);
    res.json({ success:true, message:`${rows[0].name} verified` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/users/:id/suspend', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success:false, message:'Cannot suspend yourself' });
    const { rows: target } = await q(`SELECT id,name,role FROM users WHERE id=$1`, [req.params.id]);
    if (!target.length) return res.status(404).json({ success:false, message:'User not found' });
    if (target[0].role === 'admin') return res.status(403).json({ success:false, message:'Cannot suspend an admin account' });
    if (target[0].role !== 'user' && req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Only admins can suspend team members' });
    await q(`UPDATE users SET status='suspended', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    await logAction(req.user.id, 'user.suspended', 'user', req.params.id, { name:target[0].name }, req.ip);
    res.json({ success:true, message:`${target[0].name} suspended` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/users/:id/reinstate', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success:false, message:'Cannot reinstate yourself' });
    const { rows: target } = await q(`SELECT id,name,role FROM users WHERE id=$1`, [req.params.id]);
    if (!target.length) return res.status(404).json({ success:false, message:'User not found' });
    if (target[0].role !== 'user' && req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Only admins can reinstate team members' });
    await q(`UPDATE users SET status='active', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    await logAction(req.user.id, 'user.reinstated', 'user', req.params.id, { name:target[0].name }, req.ip);
    res.json({ success:true, message:`${target[0].name} reinstated` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.delete('/users/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Only admins can delete team members' });
    if (req.params.id === req.user.id) return res.status(400).json({ success:false, message:'You cannot delete your own account' });
    const { rows: target } = await q(`SELECT id,name,role FROM users WHERE id=$1`, [req.params.id]);
    if (!target.length) return res.status(404).json({ success:false, message:'User not found' });
    if (target[0].role === 'admin') return res.status(403).json({ success:false, message:'Cannot delete another admin account' });
    // FIX 8: Last-admin guard — prevent deleting the only remaining admin
    const { rows: adminCount } = await q(`SELECT COUNT(*) AS cnt FROM users WHERE role='admin' AND status='active'`);
    if (target[0].role === 'admin' || parseInt(adminCount[0].cnt) <= 1)
      return res.status(403).json({ success:false, message:'Cannot delete the last admin account' });
    await q(`DELETE FROM users WHERE id=$1`, [req.params.id]);
    await logAction(req.user.id, 'user.deleted', 'user', req.params.id, { name:target[0].name, role:target[0].role }, req.ip);
    res.json({ success:true, message:`${target[0].name} has been removed from the team` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/users/:id/warn', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ success:false, message:'Reason is required' });
    const { rows } = await q(`SELECT id,name FROM users WHERE id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'User not found' });
    await q(
      `INSERT INTO user_warnings (user_id, warned_by, reason) VALUES ($1,$2,$3)`,
      [req.params.id, req.user.id, reason.trim()]
    );
    await q(`UPDATE users SET warnings_count = COALESCE(warnings_count,0)+1 WHERE id=$1`, [req.params.id]);
    await logAction(req.user.id, 'user.warned', 'user', req.params.id, { name:rows[0].name, reason:reason.trim().slice(0,80) }, req.ip);
    res.json({ success:true, message:`Warning issued to ${rows[0].name}` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.get('/users/:id/warnings', async (req, res) => {
  try {
    const { rows } = await q(`
      SELECT w.id, w.reason, w.created_at,
             u.name AS warned_by_name, u.handle AS warned_by_handle
      FROM user_warnings w
      JOIN users u ON u.id = w.warned_by
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [req.params.id]);
    res.json({ success:true, data: rows });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Entities
admin.get('/entities', async (req, res) => {
  try {
    const { type, search, page=1, limit=50, sortBy='created_at', sortOrder='desc' } = req.query;
    const SAFE_COLS_E = { name:1, type:1, country:1, verified:1, created_at:1, industry:1 };
    const col_e = SAFE_COLS_E[sortBy] ? `e.${sortBy}` : 'e.created_at';
    const dir_e = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const params=[], conds=[];
    if (type)   { params.push(type);   conds.push(`e.type=$${params.length}`); }
    if (search) { params.push(`%${search}%`); conds.push(`e.name ILIKE $${params.length}`); }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await q(`SELECT *,COUNT(*) OVER() AS total_count FROM entities e ${where} ORDER BY ${col_e} ${dir_e} LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json({ success:true, data:rows.map(({total_count,...r})=>r), pagination:{total:parseInt(rows[0]?.total_count||0)} });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/entities', async (req, res) => {
  try {
    const { name, type, country, description, website, stage, industry, aum, portfolio_count, employees, founded_year, logo_url, focus, linkedin, twitter, why_us } = req.body;
    if (!name || !type || !country) return res.status(400).json({ success:false, message:'name, type and country are required' });
    const validTypes = ['startup','accelerator','investor','venture_studio'];
    if (!validTypes.includes(type)) return res.status(400).json({ success:false, message:'Invalid entity type' });
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const slug = `${base}-${Date.now().toString(36)}`;
    const { rows } = await q(`
      INSERT INTO entities (name,slug,type,country,description,website,stage,industry,aum,portfolio_count,employees,founded_year,logo_url,focus,linkedin,twitter,why_us,verified,created_by)
      VALUES ($1,$2,$3::entity_type,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,false,$18)
      RETURNING id,name,type,country`,
      [name,slug,type,country,description||null,website||null,stage||null,industry||null,aum||null,portfolio_count||null,employees||null,founded_year||null,logo_url||null,focus||null,linkedin||null,twitter||null,why_us||null,req.user.id]);
    await logAction(req.user.id, 'entity.created', 'entity', rows[0].id, { name:rows[0].name, type:rows[0].type }, req.ip);
    res.json({ success:true, data:rows[0], message:`${rows[0].name} created` });
  } catch(e) {
    if (e.code==='23505') return res.status(409).json({ success:false, message:'Entity with this name already exists' });
    res.status(500).json({ success:false, message:'Internal server error' });
  }
});

admin.post('/entities/:id/verify', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE entities SET verified=true,verified_by=$1 WHERE id=$2 RETURNING name`, [req.user.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'entity.verified', 'entity', req.params.id, { name:rows[0].name }, req.ip);
    res.json({ success:true, message:`${rows[0].name} verified` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Applications
admin.get('/applications', async (req, res) => {
  try {
    const [accelApps, pitches, waitlists] = await Promise.all([
      q(`SELECT aa.*,u.name AS applicant_name,u.handle AS applicant_handle,e.name AS entity_name,p.name AS product_name FROM accelerator_applications aa JOIN users u ON u.id=aa.applicant_id JOIN entities e ON e.id=aa.entity_id LEFT JOIN products p ON p.id=aa.product_id ORDER BY aa.created_at DESC`),
      q(`SELECT ip.*,u.name AS founder_name,u.handle AS founder_handle,e.name AS investor_name,p.name AS product_name FROM investor_pitches ip JOIN users u ON u.id=ip.founder_id JOIN entities e ON e.id=ip.investor_id LEFT JOIN products p ON p.id=ip.product_id ORDER BY ip.created_at DESC`),
      q(`SELECT pr.id,pr.name,pr.logo_emoji,pr.waitlist_count,COUNT(ws.id) FILTER(WHERE ws.created_at>NOW()-INTERVAL '24h') AS last_24h FROM products pr LEFT JOIN waitlist_signups ws ON ws.product_id=pr.id WHERE pr.waitlist_count>0 GROUP BY pr.id ORDER BY pr.waitlist_count DESC`),
    ]);
    res.json({ success:true, data:{ accelerator_apps:accelApps.rows, investor_pitches:pitches.rows, waitlists:waitlists.rows } });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.patch('/applications/accelerator/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const fields = [], vals = [];
    if (status) { fields.push(`status=$${fields.length+1}::app_status`); vals.push(status); }
    if (notes !== undefined) { fields.push(`notes=$${fields.length+1}`); vals.push(notes); }
    if (status) { fields.push(`reviewed_by=$${fields.length+1}`, `reviewed_at=NOW()`); vals.push(req.user.id); }
    fields.push(`updated_at=NOW()`);
    if (fields.length === 1) return res.json({ success:true });
    vals.push(req.params.id);
    await q(`UPDATE accelerator_applications SET ${fields.join(',')} WHERE id=$${vals.length}`, vals);
    if (status) await logAction(req.user.id, 'application.status_updated', 'application', req.params.id, { status }, req.ip);
    res.json({ success:true });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.patch('/applications/pitches/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const fields = [], vals = [];
    if (status) { fields.push(`status=$${fields.length+1}::pitch_status`); vals.push(status); }
    if (notes !== undefined) { fields.push(`notes=$${fields.length+1}`); vals.push(notes); }
    fields.push(`updated_at=NOW()`);
    if (fields.length === 1) return res.json({ success:true });
    vals.push(req.params.id);
    await q(`UPDATE investor_pitches SET ${fields.join(',')} WHERE id=$${vals.length}`, vals);
    if (status) await logAction(req.user.id, 'pitch.status_updated', 'pitch', req.params.id, { status }, req.ip);
    res.json({ success:true });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Settings
admin.get('/settings', async (req, res) => {
  try {
    const { rows } = await q('SELECT key,value,type FROM platform_settings ORDER BY key');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.type==='boolean' ? r.value==='true' : r.value; });
    res.json({ success:true, data:settings });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.put('/settings', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Only admins can change platform settings' });
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await q(`INSERT INTO platform_settings (key,value,type,updated_by,updated_at) VALUES ($1,$2,'boolean',$3,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_by=$3,updated_at=NOW()`, [key,String(value),req.user.id]);
    }
    await logAction(req.user.id, 'settings.updated', 'settings', null, req.body, req.ip);
    res.json({ success:true, message:'Settings updated' });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.put('/platform/banner', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Only admins can update the banner' });
  try {
    const { text, visible } = req.body;
    await q(`INSERT INTO platform_settings (key,value,type,updated_by,updated_at) VALUES ('banner',$1,'text',$2,NOW())
             ON CONFLICT (key) DO UPDATE SET value=$1,updated_by=$2,updated_at=NOW()`,
      [JSON.stringify({ text, visible }), req.user.id]);
    await logAction(req.user.id, 'update_banner', 'platform', null, { text: String(text).slice(0,80), visible }, req.ip);
    res.json({ success:true, message:'Banner updated' });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.put('/platform/editors-pick', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Only admins can update the editor\'s pick' });
  try {
    const { text } = req.body;
    await q(`INSERT INTO platform_settings (key,value,type,updated_by,updated_at) VALUES ('editors_pick',$1,'text',$2,NOW())
             ON CONFLICT (key) DO UPDATE SET value=$1,updated_by=$2,updated_at=NOW()`,
      [JSON.stringify({ text }), req.user.id]);
    await logAction(req.user.id, 'update_editors_pick', 'platform', null, { text: String(text).slice(0,80) }, req.ip);
    res.json({ success:true, message:"Editor's pick updated" });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Platform account UUID (shared by all platform-profile routes)
const TLMENA_ID = 'e0cb08b1-3c3d-4db5-8e39-70a099d4f77d';

// ── Public Profile (Settings page) — reads/writes the actual users table ──────
admin.get('/public-profile', async (req, res) => {
  try {
    const { rows } = await q(
      `SELECT id,name,handle,headline,bio,website,twitter,linkedin,avatar_url,avatar_color,verified,followers_count
       FROM users WHERE id=$1 LIMIT 1`,
      [TLMENA_ID]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Platform profile not found' });
    res.json({ success:true, data: rows[0] });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.put('/public-profile', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Admin only' });
  try {
    const { name, handle, headline, bio, website, twitter, linkedin, avatar_url } = req.body;
    const { rows } = await q(
      `UPDATE users SET
         name=COALESCE(NULLIF($1,''),name),
         handle=COALESCE(NULLIF($2,''),handle),
         headline=COALESCE(NULLIF($3,''),headline),
         bio=COALESCE(NULLIF($4,''),bio),
         website=COALESCE(NULLIF($5,''),website),
         twitter=COALESCE(NULLIF($6,''),twitter),
         linkedin=COALESCE(NULLIF($7,''),linkedin),
         avatar_url=COALESCE(NULLIF($8,''),avatar_url),
         updated_at=NOW()
       WHERE id=$9
       RETURNING id,name,handle,headline,bio,website,twitter,linkedin,avatar_url,followers_count`,
      [name||'', handle||'', headline||'', bio||'', website||'', twitter||'', linkedin||'', avatar_url||'', TLMENA_ID]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Platform account not found' });
    await logAction(req.user.id, 'public_profile.updated', 'user', rows[0].id, { name:rows[0].name }, req.ip);
    res.json({ success:true, data: rows[0], message:'Public profile updated' });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// ── Admin-panel identity (Platform Profile page) — reads/writes platform_settings only ──
admin.get('/platform-profile', async (req, res) => {
  try {
    // Admin-panel identity is stored in platform_settings to keep it separate from the public profile
    const { rows: settingRows } = await q(
      `SELECT key, value FROM platform_settings WHERE key IN ('panel_display_name','panel_avatar_url')`
    );
    const settings = Object.fromEntries(settingRows.map(r => [r.key, r.value]));
    res.json({ success:true, data: {
      name:       settings.panel_display_name || 'TechLaunch MENA',
      avatar_url: settings.panel_avatar_url   || null,
    }});
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.put('/platform-profile', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Admin only' });
  try {
    const { name, avatar_url } = req.body;
    // Save only to platform_settings — never touches the public users table
    if (name !== undefined) {
      await q(
        `INSERT INTO platform_settings (key,value,type,updated_by,updated_at)
         VALUES ('panel_display_name',$1,'string',$2,NOW())
         ON CONFLICT (key) DO UPDATE SET value=$1,updated_by=$2,updated_at=NOW()`,
        [name||'TechLaunch MENA', req.user.id]
      );
    }
    if (avatar_url !== undefined) {
      await q(
        `INSERT INTO platform_settings (key,value,type,updated_by,updated_at)
         VALUES ('panel_avatar_url',$1,'string',$2,NOW())
         ON CONFLICT (key) DO UPDATE SET value=$1,updated_by=$2,updated_at=NOW()`,
        [avatar_url||'', req.user.id]
      );
    }
    await logAction(req.user.id, 'platform_profile.updated', 'settings', null, { name }, req.ip);
    res.json({ success:true, data: { name: name||'TechLaunch MENA', avatar_url: avatar_url||null }, message:'Panel identity updated' });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// ── Platform Profile: Activity Feed ──────────────────────────────────────────
admin.get('/platform-profile/activity', async (req, res) => {
  try {
    const { type = 'all', limit = 40, offset = 0 } = req.query;
    const results = [];

    if (type === 'all' || type === 'posts') {
      const { rows } = await q(
        `SELECT pp.id, 'post' AS kind, pp.type AS post_type, pp.body, pp.likes, pp.created_at,
                pp.tag_ids,
                NULL AS product_id, NULL AS product_name, NULL AS product_slug
         FROM platform_posts pp
         WHERE pp.author_id = $1
         ORDER BY pp.created_at DESC LIMIT $2 OFFSET $3`,
        [TLMENA_ID, limit, offset]
      );
      results.push(...rows);
    }

    if (type === 'all' || type === 'comments') {
      const { rows } = await q(
        `SELECT c.id, 'comment' AS kind, NULL AS post_type, c.body, c.likes, c.created_at,
                p.id AS product_id, p.name AS product_name, p.slug AS product_slug
         FROM comments c
         JOIN products p ON p.id = c.product_id
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC LIMIT $2 OFFSET $3`,
        [TLMENA_ID, limit, offset]
      );
      results.push(...rows);
    }

    if (type === 'all' || type === 'upvotes') {
      const { rows } = await q(
        `SELECT u.id, 'upvote' AS kind, NULL AS post_type, NULL AS body, NULL AS likes, u.created_at,
                p.id AS product_id, p.name AS product_name, p.slug AS product_slug
         FROM upvotes u
         JOIN products p ON p.id = u.product_id
         WHERE u.user_id = $1
         ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`,
        [TLMENA_ID, limit, offset]
      );
      results.push(...rows);
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: { activity: results.slice(0, Number(limit)) } });
  } catch (e) { res.status(500).json({ success: false, message:'Internal server error' }); }
});

// ── Platform Profile: Create Post (platform_posts) ───────────────────────────
admin.post('/platform-profile/post', async (req, res) => {
  try {
    const { type = 'post', body, tag_ids = [] } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Body required' });
    const validTypes = ['update', 'milestone', 'feature', 'news', 'post', 'article'];
    const postType = validTypes.includes(type) ? type : 'post';
    const tagIdsJson = JSON.stringify(Array.isArray(tag_ids) ? tag_ids : []);
    const { rows } = await q(
      `INSERT INTO platform_posts (type, body, author_id, tag_ids) VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, type, body, likes, tag_ids, created_at`,
      [postType, body.trim(), TLMENA_ID, tagIdsJson]
    );
    await logAction(req.user.id, 'platform_profile.post.created', 'platform_post', rows[0].id, { type: postType }, req.ip);
    res.status(201).json({ success: true, data: { post: { ...rows[0], kind: 'post', post_type: rows[0].type } } });
  } catch (e) { res.status(500).json({ success: false, message:'Internal server error' }); }
});

// ── Platform Profile: Delete Post ─────────────────────────────────────────────
admin.delete('/platform-profile/post/:id', async (req, res) => {
  try {
    await q('DELETE FROM platform_posts WHERE id=$1 AND author_id=$2', [req.params.id, TLMENA_ID]);
    await logAction(req.user.id, 'platform_profile.post.deleted', 'platform_post', req.params.id, {}, req.ip);
    res.json({ success: true, message: 'Post deleted' });
  } catch (e) { res.status(500).json({ success: false, message:'Internal server error' }); }
});

// ── Platform Profile: Search Products ────────────────────────────────────────
admin.get('/platform-profile/products/search', async (req, res) => {
  try {
    const { q: search = '' } = req.query;
    const { rows } = await q(
      `SELECT id, name, slug, logo_emoji, logo_url, industry
       FROM products
       WHERE status='live'
         AND (name ILIKE $1 OR tagline ILIKE $1)
       ORDER BY upvotes_count DESC
       LIMIT 10`,
      [`%${search}%`]
    );
    res.json({ success: true, data: { products: rows } });
  } catch (e) { res.status(500).json({ success: false, message:'Internal server error' }); }
});

// ── Platform Profile: Comment on a product ────────────────────────────────────
admin.post('/platform-profile/comment', async (req, res) => {
  try {
    const { product_id, body } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'body required' });

    const prodCheck = await q('SELECT id, name, slug FROM products WHERE id=$1 AND status=\'live\'', [product_id]);
    if (!prodCheck.rows.length) return res.status(404).json({ success: false, message: 'Product not found or not live' });

    const { rows } = await q(
      `INSERT INTO comments (product_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, product_id, body, likes, created_at`,
      [product_id, TLMENA_ID, body.trim()]
    );
    await q('UPDATE products SET comments_count = comments_count + 1 WHERE id=$1', [product_id]);
    await logAction(req.user.id, 'platform_profile.comment.created', 'comment', rows[0].id, { product_id }, req.ip);
    res.status(201).json({
      success: true,
      data: {
        comment: {
          ...rows[0], kind: 'comment',
          product_name: prodCheck.rows[0].name,
          product_slug: prodCheck.rows[0].slug,
        }
      }
    });
  } catch (e) { res.status(500).json({ success: false, message:'Internal server error' }); }
});

// ── Platform Profile: Delete comment ─────────────────────────────────────────
admin.delete('/platform-profile/comment/:id', async (req, res) => {
  try {
    const { rows } = await q('DELETE FROM comments WHERE id=$1 AND user_id=$2 RETURNING product_id', [req.params.id, TLMENA_ID]);
    if (rows.length) await q('UPDATE products SET comments_count = GREATEST(0, comments_count - 1) WHERE id=$1', [rows[0].product_id]);
    await logAction(req.user.id, 'platform_profile.comment.deleted', 'comment', req.params.id, {}, req.ip);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (e) { res.status(500).json({ success: false, message:'Internal server error' }); }
});

// ── Platform Profile: Toggle upvote ──────────────────────────────────────────
admin.post('/platform-profile/upvote/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const existing = await q('SELECT id FROM upvotes WHERE user_id=$1 AND product_id=$2', [TLMENA_ID, productId]);
    if (existing.rows.length) {
      await q('DELETE FROM upvotes WHERE user_id=$1 AND product_id=$2', [TLMENA_ID, productId]);
      await q('UPDATE products SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id=$1', [productId]);
      res.json({ success: true, data: { upvoted: false } });
    } else {
      await q('INSERT INTO upvotes (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [TLMENA_ID, productId]);
      await q('UPDATE products SET upvotes_count = upvotes_count + 1 WHERE id=$1', [productId]);
      await logAction(req.user.id, 'platform_profile.upvoted', 'product', productId, {}, req.ip);
      res.json({ success: true, data: { upvoted: true } });
    }
  } catch (e) { res.status(500).json({ success: false, message:'Internal server error' }); }
});

// ── Launcher Activity ────────────────────────────────────
// FIX 11: Single UNION ALL query with SQL-level ORDER BY + LIMIT/OFFSET (no in-memory sort)
admin.get('/launcher-activity', async (req, res) => {
  try {
    const { type = 'all', search = '', page = 1 } = req.query;
    const limit = 30;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;
    const searchLike = `%${search}%`;

    const buildUnion = () => {
      const parts = [];
      if (type === 'all' || type === 'comments') {
        parts.push(`
          SELECT 'comment' AS kind, c.id, c.body, c.created_at, c.likes,
            u.id AS user_id, u.name AS user_name, u.handle AS user_handle,
            u.avatar_url, u.avatar_color, u.verified,
            p.id::text AS product_id, p.name AS product_name, NULL::text AS post_type
          FROM comments c
          JOIN users u ON u.id = c.user_id
          JOIN products p ON p.id = c.product_id
          WHERE ($1 = '' OR c.body ILIKE $2 OR u.name ILIKE $2 OR u.handle ILIKE $2 OR p.name ILIKE $2)
        `);
      }
      if (type === 'all' || type === 'posts') {
        parts.push(`
          SELECT 'post' AS kind, pp.id, pp.body, pp.created_at, pp.likes,
            u.id AS user_id, u.name AS user_name, u.handle AS user_handle,
            u.avatar_url, u.avatar_color, u.verified,
            NULL::text AS product_id, NULL::text AS product_name, pp.type::text AS post_type
          FROM platform_posts pp
          JOIN users u ON u.id = pp.author_id
          WHERE ($1 = '' OR pp.body ILIKE $2 OR u.name ILIKE $2 OR u.handle ILIKE $2)
        `);
      }
      return parts.join(' UNION ALL ');
    };

    const unionSql = buildUnion();
    if (!unionSql) return res.json({ success: true, data: { items: [], total: 0, page: 1, limit } });

    const countResult = await q(`SELECT COUNT(*) AS cnt FROM (${unionSql}) AS sub`, [search, searchLike]);
    const total = parseInt(countResult.rows[0].cnt);
    const { rows } = await q(
      `SELECT * FROM (${unionSql}) AS sub ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [search, searchLike, limit, offset]
    );

    res.json({ success: true, data: { items: rows, total, page: parseInt(page), limit } });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success: false, message:'Internal server error' }); }
});

admin.delete('/launcher-activity/comment/:id', async (req, res) => {
  try {
    const { rows } = await q(
      `DELETE FROM comments WHERE id=$1 RETURNING id, user_id, body`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Comment not found' });
    await logAction(req.user.id, 'comment.delete', 'comment', req.params.id, { body: rows[0].body?.slice(0,80) }, req.ip);
    res.json({ success: true, message: 'Comment deleted' });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success: false, message:'Internal server error' }); }
});

admin.delete('/launcher-activity/post/:id', async (req, res) => {
  try {
    const { rows } = await q(
      `DELETE FROM platform_posts WHERE id=$1 RETURNING id, body`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Post not found' });
    await logAction(req.user.id, 'platform_post.delete', 'platform_post', req.params.id, { body: rows[0].body?.slice(0,80) }, req.ip);
    res.json({ success: true, message: 'Post deleted' });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success: false, message:'Internal server error' }); }
});

admin.post('/launcher-activity/warn/:userId', async (req, res) => {
  try {
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ success: false, message: 'Warning note is required' });
    if (note.trim().length > 2000) return res.status(400).json({ success: false, message: 'Note too long (max 2000 chars)' });

    const { rows: userRows } = await q('SELECT id, name, handle FROM users WHERE id=$1 LIMIT 1', [req.params.userId]);
    if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found' });

    // Insert message from platform account into user's inbox
    await q(
      `INSERT INTO messages (sender_id, recipient_id, body) VALUES ($1, $2, $3)`,
      [TLMENA_ID, req.params.userId, note.trim()]
    );

    // Insert in-app notification
    await q(
      `INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5)`,
      [req.params.userId, 'admin_warning', '⚠️ Message from TechLaunch MENA', note.trim(), '/messages']
    );

    await logAction(req.user.id, 'user.warn', 'user', req.params.userId, { note: note.trim().slice(0,80) }, req.ip);
    res.json({ success: true, message: `Warning sent to ${userRows[0].handle}` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success: false, message:'Internal server error' }); }
});

// Suggestions
admin.get('/suggestions', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status && status !== 'all' ? 'WHERE s.status=$1' : '';
    const params = status && status !== 'all' ? [status] : [];
    const { rows } = await q(`SELECT s.*,u.name AS user_name,u.handle AS user_handle,u.avatar_color FROM suggestions s LEFT JOIN users u ON u.id=s.user_id ${where} ORDER BY s.created_at DESC`, params);
    res.json({ success:true, data:{ suggestions:rows } });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/suggestions/:id/respond', async (req, res) => {
  try {
    const { response } = req.body;
    if (!response?.trim()) return res.status(400).json({ success:false, message:'Response required' });
    const { rows } = await q(`UPDATE suggestions SET admin_response=$1,responded_by=$2,responded_at=NOW(),status='responded' WHERE id=$3 RETURNING *`, [response.trim(),req.user.id,req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data:{ suggestion:rows[0] } });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Bulk product actions
admin.post('/products/bulk', async (req, res) => {
  try {
    const { ids, action, reason } = req.body;
    if (!ids?.length || !action) return res.status(400).json({ success:false, message:'ids and action required' });
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; if (!ids.every(id => typeof id === 'string' && UUID_RE.test(id))) return res.status(400).json({ success:false, message:'Invalid id format' });
    const placeholders = ids.map((_,i)=>`$${i+1}`).join(',');
    if (action === 'approve') {
      await q(`UPDATE products SET status='live', approved_by=$${ids.length+1}, approved_at=NOW(), updated_at=NOW() WHERE id IN (${placeholders}) AND status='pending'`, [...ids, req.user.id]);
    } else if (action === 'reject') {
      await q(`UPDATE products SET status='rejected', rejected_reason=$${ids.length+1}, approved_by=$${ids.length+2}, updated_at=NOW() WHERE id IN (${placeholders})`, [...ids, reason||'Does not meet guidelines', req.user.id]);
    } else if (action === 'feature') {
      await q(`UPDATE products SET featured=true, updated_at=NOW() WHERE id IN (${placeholders})`, ids);
    } else if (action === 'unfeature') {
      await q(`UPDATE products SET featured=false, updated_at=NOW() WHERE id IN (${placeholders})`, ids);
    } else {
      return res.status(400).json({ success:false, message:'Unknown action' });
    }
    await logAction(req.user.id, `products.bulk_${action}`, 'product', null, { count:ids.length, ids }, req.ip);
    res.json({ success:true, message:`${ids.length} product(s) ${action}d` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Bulk user actions
admin.post('/users/bulk', async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids?.length || !action) return res.status(400).json({ success:false, message:'ids and action required' });
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; if (!ids.every(id => typeof id === 'string' && UUID_RE.test(id))) return res.status(400).json({ success:false, message:'Invalid id format' });
    const placeholders = ids.map((_,i)=>`$${i+1}`).join(',');
    if (action === 'verify') {
      await q(`UPDATE users SET verified=true, updated_at=NOW() WHERE id IN (${placeholders})`, ids);
    } else if (action === 'suspend') {
      await q(`UPDATE users SET status='suspended', updated_at=NOW() WHERE id IN (${placeholders}) AND role='user'`, ids);
    } else if (action === 'reinstate') {
      await q(`UPDATE users SET status='active', updated_at=NOW() WHERE id IN (${placeholders})`, ids);
    } else {
      return res.status(400).json({ success:false, message:'Unknown action' });
    }
    await logAction(req.user.id, `users.bulk_${action}`, 'user', null, { count:ids.length }, req.ip);
    res.json({ success:true, message:`${ids.length} user(s) updated` });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// Activity Log
admin.get('/activity-log/actions', async (req, res) => {
  try {
    const { rows } = await q(`SELECT DISTINCT action FROM activity_log ORDER BY action`);
    res.json({ success:true, data: rows.map(r => r.action) });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.get('/activity-log', async (req, res) => {
  try {
    const { actor, action, entity, role, from, to, page=1, limit=50 } = req.query;
    const conds = [], params = [];
    if (actor)  { params.push(`%${actor}%`);  conds.push(`u.name ILIKE $${params.length}`); }
    if (action) { params.push(action);         conds.push(`al.action = $${params.length}`); }
    if (entity) { params.push(entity);         conds.push(`al.entity=$${params.length}`); }
    if (role)   { params.push(role);           conds.push(`u.role=$${params.length}`); }
    if (from)   { params.push(from);           conds.push(`al.created_at >= $${params.length}::date`); }
    if (to)     { params.push(to);             conds.push(`al.created_at < ($${params.length}::date + interval '1 day')`); }
    const where  = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    const countRes = await q(`SELECT COUNT(*) FROM activity_log al LEFT JOIN users u ON u.id=al.actor_id ${where}`, params);
    params.push(parseInt(limit), offset);
    const { rows } = await q(`
      SELECT al.id, al.action, al.entity, al.entity_id, al.details, al.created_at,
             u.name AS actor_name, u.role AS actor_role, u.avatar_color
      FROM activity_log al
      LEFT JOIN users u ON u.id=al.actor_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);
    res.json({ success:true, data:{ logs:rows, total:parseInt(countRes.rows[0].count), page:parseInt(page), limit:parseInt(limit) } });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// CSV Export
admin.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { from, to, status } = req.query;
    let rows, headers, filename;

    const buildDateFilter = (col, params) => {
      const parts = [];
      if (from) { params.push(from);                  parts.push(`${col} >= $${params.length}`); }
      if (to)   { params.push(to + ' 23:59:59');      parts.push(`${col} <= $${params.length}`); }
      return parts.length ? ' AND ' + parts.join(' AND ') : '';
    };

    if (type === 'products') {
      const params = [];
      let where;
      if (status && status !== 'all') {
        params.push(status);
        where = `status=$${params.length}`;
      } else {
        where = '1=1';
      }
      const dateClause = buildDateFilter('p.created_at', params);
      const result = await q(`SELECT p.name,p.tagline,p.industry,p.status,p.upvotes_count,p.comments_count,p.waitlist_count,p.featured,u.name AS submitter,p.created_at FROM products p LEFT JOIN users u ON u.id=p.submitted_by WHERE ${where}${dateClause} ORDER BY p.created_at DESC`, params);
      rows = result.rows;
      headers = ['Name','Tagline','Industry','Status','Upvotes','Comments','Waitlist','Featured','Submitter','Submitted At'];
      filename = 'products';
    } else if (type === 'users') {
      const params = [];
      const dateClause = buildDateFilter('created_at', params);
      const result = await q(`SELECT name,handle,email,persona,country,role,status,verified,products_count,created_at FROM users WHERE role='user'${dateClause} ORDER BY created_at DESC`, params);
      rows = result.rows;
      headers = ['Name','Handle','Email','Persona','Country','Role','Status','Verified','Products','Joined At'];
      filename = 'users';
    } else if (type === 'entities') {
      const params = [];
      const dateClause = buildDateFilter('created_at', params);
      const result = await q(`SELECT name,type,country,industry,stage,aum,portfolio_count,verified,website,created_at FROM entities${dateClause ? ' WHERE 1=1' + dateClause : ''} ORDER BY created_at DESC`, params);
      rows = result.rows;
      headers = ['Name','Type','Country','Industry','Stage','AUM','Portfolio','Verified','Website','Created At'];
      filename = 'entities';
    } else if (type === 'applications') {
      const params = [];
      const dateClause = buildDateFilter('aa.created_at', params);
      const result = await q(`SELECT u.name AS applicant,u.email,e.name AS entity,aa.startup_name,aa.stage,aa.status,aa.notes,aa.created_at FROM accelerator_applications aa JOIN users u ON u.id=aa.applicant_id JOIN entities e ON e.id=aa.entity_id${dateClause ? ' WHERE 1=1' + dateClause : ''} ORDER BY aa.created_at DESC`, params);
      rows = result.rows;
      headers = ['Applicant','Email','Entity','Startup','Stage','Status','Notes','Applied At'];
      filename = 'applications';
    } else if (type === 'waitlist') {
      const { product_id } = req.query;
      const params = [];
      let where = '1=1';
      if (product_id) { params.push(product_id); where += ` AND ws.product_id=$${params.length}`; }
      const dateClause = buildDateFilter('ws.created_at', params);
      const result = await q(`SELECT u.name,u.email,u.handle,p.name AS product,ws.created_at AS signed_up_at FROM waitlist_signups ws JOIN users u ON u.id=ws.user_id JOIN products p ON p.id=ws.product_id WHERE ${where}${dateClause} ORDER BY ws.created_at DESC`, params);
      rows = result.rows;
      headers = ['Name','Email','Handle','Product','Signed Up At'];
      filename = product_id ? `waitlist_${product_id}` : 'waitlist_all';
    } else {
      return res.status(400).json({ success:false, message:'Unknown export type' });
    }

    const escape = v => {
      if (v === null || v === undefined) return '';
      const s = String(v instanceof Date ? v.toISOString().split('T')[0] : v).replace(/"/g,'""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const csv = [headers.join(','), ...rows.map(r => Object.values(r).map(escape).join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

// ─── TAG MANAGEMENT ───────────────────────────────────────────────────────────
admin.get('/tags', async (req, res) => {
  try {
    const { rows } = await q('SELECT * FROM tags ORDER BY category, sort_order, name');
    res.json({ success:true, data:rows });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/tags', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Admin only' });
  try {
    const { name, category, color, text_color } = req.body;
    if (!name?.trim() || !category) return res.status(400).json({ success:false, message:'name and category required' });
    if (!['user','product','article','role'].includes(category))
      return res.status(400).json({ success:false, message:'Invalid category' });
    const { rows } = await q(
      'INSERT INTO tags (name,category,color,text_color) VALUES ($1,$2,$3,$4) RETURNING *',
      [name.trim(), category, color||'#E8E8E8', text_color||'#374151']
    );
    await logAction(req.user.id, 'tags.create', 'tag', rows[0].id, { name:name.trim(), category }, req.ip);
    res.json({ success:true, data:rows[0] });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.put('/tags/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Admin only' });
  try {
    const { name, color, text_color, is_active } = req.body;
    const { rows } = await q(
      `UPDATE tags SET
         name       = COALESCE($1, name),
         color      = COALESCE($2, color),
         text_color = COALESCE($3, text_color),
         is_active  = COALESCE($4, is_active)
       WHERE id=$5 RETURNING *`,
      [name||null, color||null, text_color||null, is_active!==undefined?is_active:null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Tag not found' });
    res.json({ success:true, data:rows[0] });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.delete('/tags/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Admin only' });
  try {
    const { rows } = await q('DELETE FROM tags WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Tag not found' });
    res.json({ success:true });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.post('/tags/:id/assign', async (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    const tableMap = { user:'user_tags', product:'product_tags' };
    const colMap   = { user:'user_id',   product:'product_id'  };
    const table = tableMap[item_type];
    if (!table) return res.status(400).json({ success:false, message:'Invalid item_type' });
    await q(`INSERT INTO ${table} (${colMap[item_type]},tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [item_id, req.params.id]);
    res.json({ success:true });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

admin.delete('/tags/:id/assign', async (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    const tableMap = { user:'user_tags', product:'product_tags' };
    const colMap   = { user:'user_id',   product:'product_id'  };
    const table = tableMap[item_type];
    if (!table) return res.status(400).json({ success:false, message:'Invalid item_type' });
    await q(`DELETE FROM ${table} WHERE ${colMap[item_type]}=$1 AND tag_id=$2`, [item_id, req.params.id]);
    res.json({ success:true });
  } catch(e) { console.error('[Admin API]', e.message); res.status(500).json({ success:false, message:'Internal server error' }); }
});

app.use('/api/admin', admin);

// ─── FILE UPLOADS ─────────────────────────────────────────────────────────────
const multer = require('multer');
const fs     = require('fs');
const uploadsDir = path.join(__dirname, '../../backend/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2,8) + ext);
  },
});
const adminUpload = multer({
  storage: uploadStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|gif|webp|svg\+xml)/.test(file.mimetype);
    cb(ok ? null : new Error('Only image files allowed'), ok);
  },
});

app.post('/api/upload', authenticate, adminUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success:false, message:'No file uploaded' });
  const base = process.env.REPLIT_DOMAINS
    ? 'https://' + process.env.REPLIT_DOMAINS.split(',')[0].trim()
    : `${req.protocol}://${req.get('host').replace(':5000', ':3001')}`;
  const url = `${base}/uploads/${req.file.filename}`;
  res.json({ success:true, url, filename: req.file.filename });
});

// Serve uploaded files (forwarded from public backend at port 3001, but also reachable here)
app.use('/uploads', express.static(uploadsDir, { maxAge:'7d', immutable:true }));

// ─── SERVE REACT FRONTEND ─────────────────────────────────────────────────────
const DIST = path.join(__dirname, '..', 'frontend', 'dist');
// Hashed assets (JS/CSS) — long cache since filenames change on each build
app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '1y', immutable: true }));
// Everything else (including index.html) — never cache so updates are instant
app.use(express.static(DIST, { etag: false, lastModified: false, setHeaders(res, filePath) {
  if (filePath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
}}));
app.get('/{*path}', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(DIST, 'index.html'));
});

// ─── FIX 13: Global error handler — catches unhandled Express errors ──────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.message, err.stack);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ success: false, message: 'Internal server error' });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Admin panel running on port ${PORT}`);
});
