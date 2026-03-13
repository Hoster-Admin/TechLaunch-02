require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { Pool } = require('pg');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || process.env.ADMIN_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'tlmena_dev_secret';

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
app.use(helmet({ contentSecurityPolicy: false, frameguard: false }));
const ALLOWED_ORIGINS = [
  'https://admin.tlmena.com',
  'http://localhost:5174',
  'http://localhost:5000',
  ...(process.env.ADMIN_CLIENT_URL ? [process.env.ADMIN_CLIENT_URL] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o)) ||
        origin.includes('.replit.dev') || origin.includes('.repl.co') ||
        (process.env.NODE_ENV !== 'production')) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'No token' });
  try {
    const { userId } = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const { rows } = await q('SELECT id,name,handle,email,role,status,avatar_color FROM users WHERE id=$1', [userId]);
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
app.post('/api/auth/login', async (req, res) => {
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

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
const admin = express.Router();
admin.use(authenticate, requireAdmin);

// ─── AUDIT LOG HELPER ────────────────────────────────────────────────────────
async function logAction(actorId, action, entity, entityId, details) {
  try {
    await q(`INSERT INTO activity_log (actor_id,action,entity,entity_id,details) VALUES ($1,$2,$3,$4,$5)`,
      [actorId||null, action, entity||null, entityId||null, details ? JSON.stringify(details) : null]);
  } catch(_) { /* non-fatal */ }
}

// Dashboard
admin.get('/dashboard', async (req, res) => {
  try {
    const [products, users, upvotes, apps, waitlist, activity, topProducts, newUsers, upvoteChart, signupChart] =
      await Promise.all([
        q(`SELECT COUNT(*) FILTER(WHERE status='live') AS live, COUNT(*) FILTER(WHERE status='pending') AS pending, COUNT(*) FILTER(WHERE status='soon') AS soon, COUNT(*) FILTER(WHERE status='rejected') AS rejected, COUNT(*) AS total FROM products`),
        q(`SELECT COUNT(*) FILTER(WHERE status='active') AS active, COUNT(*) AS total FROM users WHERE role='user'`),
        q(`SELECT COALESCE(SUM(upvotes_count),0) AS total FROM products`),
        q(`SELECT COUNT(*) FILTER(WHERE status IN ('pending','reviewing')) AS pending FROM accelerator_applications`),
        q(`SELECT COALESCE(SUM(waitlist_count),0) AS total FROM products`),
        q(`SELECT al.action, al.created_at, al.details, u.name AS actor_name, u.handle AS actor_handle, u.avatar_color FROM activity_log al LEFT JOIN users u ON u.id=al.actor_id ORDER BY al.created_at DESC LIMIT 10`),
        q(`SELECT id,name,logo_emoji,industry,upvotes_count,status FROM products WHERE status='live' ORDER BY upvotes_count DESC LIMIT 5`),
        q(`SELECT id,name,handle,persona,country,avatar_color,created_at FROM users ORDER BY created_at DESC LIMIT 8`),
        q(`SELECT TO_CHAR(DATE_TRUNC('day',created_at),'Dy') AS day, COUNT(*) AS count FROM upvotes WHERE created_at>NOW()-INTERVAL '7 days' GROUP BY DATE_TRUNC('day',created_at),day ORDER BY DATE_TRUNC('day',created_at)`),
        q(`SELECT TO_CHAR(DATE_TRUNC('week',created_at),'WW') AS week, COUNT(*) AS count FROM users WHERE created_at>NOW()-INTERVAL '8 weeks' GROUP BY DATE_TRUNC('week',created_at),week ORDER BY DATE_TRUNC('week',created_at)`),
      ]);
    res.json({ success:true, data: {
      stats: { products:products.rows[0], users:users.rows[0], upvotes:parseInt(upvotes.rows[0].total), apps_pending:parseInt(apps.rows[0].pending), waitlist:parseInt(waitlist.rows[0].total) },
      topProducts: topProducts.rows, newUsers: newUsers.rows, activity: activity.rows,
      charts: { upvotes: upvoteChart.rows, signups: signupChart.rows },
    }});
  } catch(e) { console.error(e); res.status(500).json({ success:false, message:e.message }); }
});

// Products
admin.get('/products', async (req, res) => {
  try {
    const { status, search, page=1, limit=50 } = req.query;
    const params = [], conds = [];
    if (status && status !== 'all') {
      if (status === 'featured') conds.push('p.featured=true');
      else { params.push(status); conds.push(`p.status=$${params.length}`); }
    }
    if (search) { params.push(`%${search}%`); conds.push(`(p.name ILIKE $${params.length} OR p.tagline ILIKE $${params.length})`); }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await q(`SELECT p.*,u.name AS submitter_name,u.handle AS submitter_handle,COUNT(*) OVER() AS total_count FROM products p JOIN users u ON u.id=p.submitted_by ${where} ORDER BY p.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json({ success:true, data: rows.map(({total_count,...r})=>r), pagination:{total:parseInt(rows[0]?.total_count||0)} });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/products/:id/approve', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE products SET status='live',approved_by=$1,approved_at=NOW() WHERE id=$2 RETURNING name`, [req.user.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await q('INSERT INTO activity_log (actor_id,action,entity,entity_id) VALUES ($1,$2,$3,$4)', [req.user.id,'product.approve','products',req.params.id]);
    res.json({ success:true, message:`${rows[0].name} approved` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/products/:id/reject', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE products SET status='rejected',rejected_reason=$1 WHERE id=$2 RETURNING name`, [req.body.reason||null, req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'product.rejected', 'product', req.params.id, { name:rows[0].name, reason:req.body.reason||null });
    res.json({ success:true, message:`${rows[0].name} rejected` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/products/:id/featured', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE products SET featured=NOT featured WHERE id=$1 RETURNING name,featured`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, rows[0].featured ? 'product.featured' : 'product.unfeatured', 'product', req.params.id, { name:rows[0].name });
    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Users
admin.get('/users', async (req, res) => {
  try {
    const { status, persona, verified, search, page=1, limit=50 } = req.query;
    const params = [], conds = [`u.role='user'`];
    if (status)  { params.push(status);  conds.push(`u.status=$${params.length}`); }
    if (persona) { params.push(persona); conds.push(`u.persona=$${params.length}`); }
    if (verified==='true') conds.push('u.verified=true');
    if (search)  { params.push(`%${search}%`); conds.push(`(u.name ILIKE $${params.length} OR u.handle ILIKE $${params.length})`); }
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await q(`SELECT u.id,u.name,u.handle,u.email,u.persona,u.country,u.verified,u.status,u.role,u.avatar_color,u.created_at,u.products_count,u.votes_given,u.followers_count,COUNT(*) OVER() AS total_count FROM users u WHERE ${conds.join(' AND ')} ORDER BY u.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json({ success:true, data:rows.map(({total_count,...r})=>r), pagination:{total:parseInt(rows[0]?.total_count||0)} });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/users', async (req, res) => {
  try {
    const { name, email, role='moderator', persona, country, handle: customHandle } = req.body;
    if (!name || !email) return res.status(400).json({ success:false, message:'name and email are required' });
    const allowed = ['admin','moderator','editor','user'];
    if (!allowed.includes(role)) return res.status(400).json({ success:false, message:'Invalid role' });
    const isTeam = role !== 'user';
    const handle = customHandle?.trim()
      ? customHandle.toLowerCase().replace(/[^a-z0-9_]/g,'')
      : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'_') + '_' + Math.floor(Math.random()*100);
    const tempPwd = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!';
    const hash   = await bcrypt.hash(tempPwd, 10);
    const colors = ['#E15033','#2563eb','#7c3aed','#16a34a','#d97706'];
    const color  = colors[Math.floor(Math.random()*colors.length)];
    const cols   = ['name','handle','email','password_hash','role','status','verified','email_verified','avatar_color'];
    const vals   = [name, handle, email.toLowerCase().trim(), hash, role, 'active', isTeam, isTeam, color];
    if (persona) { cols.push('persona'); vals.push(persona); }
    if (country) { cols.push('country'); vals.push(country); }
    const placeholders = vals.map((_,i)=>`$${i+1}`).join(',');
    const { rows } = await q(`INSERT INTO users (${cols.join(',')}) VALUES (${placeholders}) RETURNING id,name,email,role`, vals);
    await logAction(req.user.id, 'user.created', 'user', rows[0].id, { name:rows[0].name, role:rows[0].role });
    res.json({ success:true, data:rows[0], message:`${rows[0].name} added successfully` });
  } catch(e) {
    if (e.code==='23505') return res.status(409).json({ success:false, message:'Email already in use' });
    res.status(500).json({ success:false, message:e.message });
  }
});

admin.get('/users/team', async (req, res) => {
  try {
    const { rows } = await q(`SELECT id,name,handle,email,role,status,verified,avatar_color,created_at FROM users WHERE role IN ('admin','moderator','editor') ORDER BY created_at ASC`);
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/users/:id/verify', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE users SET verified=true WHERE id=$1 RETURNING name`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'user.verified', 'user', req.params.id, { name:rows[0].name });
    res.json({ success:true, message:`${rows[0].name} verified` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/users/:id/suspend', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE users SET status='suspended' WHERE id=$1 AND role='user' RETURNING name`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'user.suspended', 'user', req.params.id, { name:rows[0].name });
    res.json({ success:true, message:`${rows[0].name} suspended` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/users/:id/reinstate', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE users SET status='active' WHERE id=$1 RETURNING name`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'user.reinstated', 'user', req.params.id, { name:rows[0].name });
    res.json({ success:true, message:`${rows[0].name} reinstated` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Entities
admin.get('/entities', async (req, res) => {
  try {
    const { type, search, page=1, limit=50 } = req.query;
    const params=[], conds=[];
    if (type)   { params.push(type);   conds.push(`e.type=$${params.length}`); }
    if (search) { params.push(`%${search}%`); conds.push(`e.name ILIKE $${params.length}`); }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await q(`SELECT *,COUNT(*) OVER() AS total_count FROM entities ${where} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json({ success:true, data:rows.map(({total_count,...r})=>r), pagination:{total:parseInt(rows[0]?.total_count||0)} });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/entities', async (req, res) => {
  try {
    const { name, type, country, description, website, stage, industry, aum, portfolio_count, employees, founded_year, logo_emoji='🏢', focus } = req.body;
    if (!name || !type || !country) return res.status(400).json({ success:false, message:'name, type and country are required' });
    const validTypes = ['accelerator','investor','venture_studio'];
    if (!validTypes.includes(type)) return res.status(400).json({ success:false, message:'type must be accelerator, investor, or venture_studio' });
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const slug = `${base}-${Date.now().toString(36)}`;
    const { rows } = await q(`
      INSERT INTO entities (name,slug,type,country,description,website,stage,industry,aum,portfolio_count,employees,founded_year,logo_emoji,focus,verified,created_by)
      VALUES ($1,$2,$3::entity_type,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false,$15)
      RETURNING id,name,type,country`,
      [name,slug,type,country,description||null,website||null,stage||null,industry||null,aum||null,portfolio_count||null,employees||null,founded_year||null,logo_emoji,focus||null,req.user.id]);
    await logAction(req.user.id, 'entity.created', 'entity', rows[0].id, { name:rows[0].name, type:rows[0].type });
    res.json({ success:true, data:rows[0], message:`${rows[0].name} created` });
  } catch(e) {
    if (e.code==='23505') return res.status(409).json({ success:false, message:'Entity with this name already exists' });
    res.status(500).json({ success:false, message:e.message });
  }
});

admin.post('/entities/:id/verify', async (req, res) => {
  try {
    const { rows } = await q(`UPDATE entities SET verified=true,verified_by=$1 WHERE id=$2 RETURNING name`, [req.user.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await logAction(req.user.id, 'entity.verified', 'entity', req.params.id, { name:rows[0].name });
    res.json({ success:true, message:`${rows[0].name} verified` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
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
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
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
    if (status) await logAction(req.user.id, 'application.status_updated', 'application', req.params.id, { status });
    res.json({ success:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
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
    if (status) await logAction(req.user.id, 'pitch.status_updated', 'pitch', req.params.id, { status });
    res.json({ success:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Settings
admin.get('/settings', async (req, res) => {
  try {
    const { rows } = await q('SELECT key,value,type FROM platform_settings ORDER BY key');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.type==='boolean' ? r.value==='true' : r.value; });
    res.json({ success:true, data:settings });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.put('/settings', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await q(`INSERT INTO platform_settings (key,value,type,updated_by,updated_at) VALUES ($1,$2,'boolean',$3,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_by=$3,updated_at=NOW()`, [key,String(value),req.user.id]);
    }
    await logAction(req.user.id, 'settings.updated', 'settings', null, req.body);
    res.json({ success:true, message:'Settings updated' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Reports
admin.get('/reports', async (req, res) => {
  try {
    const { from, to } = req.query;
    const df = from ? `AND created_at >= '${from}'` : '';
    const dt = to   ? `AND created_at <= '${to} 23:59:59'` : '';
    const dpf = from ? `AND p.created_at >= '${from}'` : '';
    const dpt = to   ? `AND p.created_at <= '${to} 23:59:59'` : '';
    const [kpis, countryBreakdown, industryBreakdown, personaBreakdown, signupTrend] = await Promise.all([
      q(`SELECT
          (SELECT COUNT(*) FROM products WHERE status='live' ${dpf} ${dpt}) AS live_products,
          (SELECT COUNT(*) FROM users WHERE status='active' ${df} ${dt}) AS active_users,
          (SELECT COALESCE(SUM(upvotes_count),0) FROM products ${from||to?`WHERE 1=1 ${dpf} ${dpt}`:''}) AS total_upvotes,
          (SELECT COALESCE(SUM(waitlist_count),0) FROM products ${from||to?`WHERE 1=1 ${dpf} ${dpt}`:''}) AS waitlist_total,
          (SELECT COUNT(*) FROM accelerator_applications ${from||to?`WHERE 1=1 ${df} ${dt}`:''}) AS total_apps,
          (SELECT ROUND(AVG(upvotes_count)) FROM products WHERE status='live' ${dpf} ${dpt}) AS avg_upvotes,
          (SELECT name FROM products ORDER BY upvotes_count DESC LIMIT 1) AS top_product`),
      q(`SELECT country,COUNT(*) AS count FROM users WHERE country IS NOT NULL ${df} ${dt} GROUP BY country ORDER BY count DESC LIMIT 8`),
      q(`SELECT industry,COUNT(*) AS count FROM products WHERE 1=1 ${dpf} ${dpt} GROUP BY industry ORDER BY count DESC LIMIT 8`),
      q(`SELECT persona,COUNT(*) AS count FROM users WHERE status='active' ${df} ${dt} GROUP BY persona ORDER BY count DESC`),
      q(`SELECT TO_CHAR(DATE_TRUNC('week',created_at),'IYYY-IW') AS week,COUNT(*) AS signups FROM users WHERE created_at>${from?`'${from}'`:`NOW()-INTERVAL '8 weeks'`} ${dt} GROUP BY week ORDER BY week`),
    ]);
    res.json({ success:true, data:{ kpis:kpis.rows[0], country_breakdown:countryBreakdown.rows, industry_breakdown:industryBreakdown.rows, persona_breakdown:personaBreakdown.rows, signup_trend:signupTrend.rows } });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Suggestions
admin.get('/suggestions', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status && status !== 'all' ? 'WHERE s.status=$1' : '';
    const params = status && status !== 'all' ? [status] : [];
    const { rows } = await q(`SELECT s.*,u.name AS user_name,u.handle AS user_handle,u.avatar_color FROM suggestions s LEFT JOIN users u ON u.id=s.user_id ${where} ORDER BY s.created_at DESC`, params);
    res.json({ success:true, data:{ suggestions:rows } });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

admin.post('/suggestions/:id/respond', async (req, res) => {
  try {
    const { response } = req.body;
    if (!response?.trim()) return res.status(400).json({ success:false, message:'Response required' });
    const { rows } = await q(`UPDATE suggestions SET admin_response=$1,responded_by=$2,responded_at=NOW(),status='responded' WHERE id=$3 RETURNING *`, [response.trim(),req.user.id,req.params.id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data:{ suggestion:rows[0] } });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Bulk product actions
admin.post('/products/bulk', async (req, res) => {
  try {
    const { ids, action, reason } = req.body;
    if (!ids?.length || !action) return res.status(400).json({ success:false, message:'ids and action required' });
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
    await logAction(req.user.id, `products.bulk_${action}`, 'product', null, { count:ids.length, ids });
    res.json({ success:true, message:`${ids.length} product(s) ${action}d` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Bulk user actions
admin.post('/users/bulk', async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids?.length || !action) return res.status(400).json({ success:false, message:'ids and action required' });
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
    await logAction(req.user.id, `users.bulk_${action}`, 'user', null, { count:ids.length });
    res.json({ success:true, message:`${ids.length} user(s) updated` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// Activity Log
admin.get('/activity-log', async (req, res) => {
  try {
    const { actor, action, entity, from, to, page=1, limit=50 } = req.query;
    const conds = [], params = [];
    if (actor)  { params.push(`%${actor}%`);  conds.push(`u.name ILIKE $${params.length}`); }
    if (action) { params.push(`%${action}%`); conds.push(`al.action ILIKE $${params.length}`); }
    if (entity) { params.push(entity);         conds.push(`al.entity=$${params.length}`); }
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
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// CSV Export
admin.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { from, to, status } = req.query;
    let rows, headers, filename;

    const dateFilter = (col) => {
      const parts = [];
      if (from) parts.push(`${col} >= '${from}'`);
      if (to)   parts.push(`${col} <= '${to} 23:59:59'`);
      return parts.length ? ' AND ' + parts.join(' AND ') : '';
    };

    if (type === 'products') {
      const where = status && status !== 'all' ? `status='${status}'` : '1=1';
      const result = await q(`SELECT p.name,p.tagline,p.industry,p.status,p.upvotes_count,p.comments_count,p.waitlist_count,p.featured,u.name AS submitter,p.created_at FROM products p LEFT JOIN users u ON u.id=p.submitted_by WHERE ${where}${dateFilter('p.created_at')} ORDER BY p.created_at DESC`);
      rows = result.rows;
      headers = ['Name','Tagline','Industry','Status','Upvotes','Comments','Waitlist','Featured','Submitter','Submitted At'];
      filename = 'products';
    } else if (type === 'users') {
      const result = await q(`SELECT name,handle,email,persona,country,role,status,verified,products_count,created_at FROM users WHERE role='user'${dateFilter('created_at')} ORDER BY created_at DESC`);
      rows = result.rows;
      headers = ['Name','Handle','Email','Persona','Country','Role','Status','Verified','Products','Joined At'];
      filename = 'users';
    } else if (type === 'entities') {
      const result = await q(`SELECT name,type,country,industry,stage,aum,portfolio_count,verified,website,created_at FROM entities${dateFilter('created_at') ? ' WHERE 1=1' + dateFilter('created_at') : ''} ORDER BY created_at DESC`);
      rows = result.rows;
      headers = ['Name','Type','Country','Industry','Stage','AUM','Portfolio','Verified','Website','Created At'];
      filename = 'entities';
    } else if (type === 'applications') {
      const result = await q(`SELECT u.name AS applicant,u.email,e.name AS entity,aa.startup_name,aa.stage,aa.status,aa.notes,aa.created_at FROM accelerator_applications aa JOIN users u ON u.id=aa.applicant_id JOIN entities e ON e.id=aa.entity_id${dateFilter('aa.created_at') ? ' WHERE 1=1' + dateFilter('aa.created_at') : ''} ORDER BY aa.created_at DESC`);
      rows = result.rows;
      headers = ['Applicant','Email','Entity','Startup','Stage','Status','Notes','Applied At'];
      filename = 'applications';
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
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

app.use('/api/admin', admin);

// ─── SERVE REACT FRONTEND ─────────────────────────────────────────────────────
const DIST = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(DIST));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Admin panel running on port ${PORT}`);
});
