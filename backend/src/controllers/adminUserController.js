const { query } = require('../config/database');
const { v4: uuid } = require('uuid');
const { sendInviteEmail } = require('../services/emailService');

// ── GET /api/admin/users
const adminGetUsers = async (req, res, next) => {
  try {
    const { status, persona, verified, search, page = 1, limit = 50 } = req.query;
    const params = [];
    const conditions = [`u.role = 'user'`];

    if (status)   { params.push(status);  conditions.push(`u.status = $${params.length}`); }
    if (persona)  { params.push(persona); conditions.push(`u.persona = $${params.length}`); }
    if (verified === 'true') conditions.push(`u.verified = true`);
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.handle ILIKE $${params.length})`);
    }

    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);

    const { rows } = await query(`
      SELECT u.id, u.name, u.handle, u.email, u.persona, u.country, u.verified,
             u.status, u.role, u.avatar_color, u.created_at,
             u.products_count, u.votes_given, u.followers_count,
             COUNT(*) OVER() AS total_count
      FROM users u
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}`, params);

    const total = rows[0]?.total_count || 0;
    res.json({
      success: true,
      data: rows.map(({ total_count, ...r }) => r),
      pagination: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) { next(err); }
};

// ── GET /api/admin/users/:id
const adminGetUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [userRes, prodsRes] = await Promise.all([
      query(`SELECT u.id, u.name, u.handle, u.email, u.persona, u.country, u.bio,
                    u.verified, u.status, u.role, u.avatar_color, u.created_at,
                    u.products_count, u.votes_given, u.followers_count, u.following_count
             FROM users u WHERE u.id=$1`, [id]),
      query(`SELECT id, name, logo_emoji, industry, status, upvotes_count, created_at
             FROM products WHERE submitted_by=$1 ORDER BY created_at DESC`, [id]),
    ]);
    if (!userRes.rows.length) return res.status(404).json({ success:false, message:'User not found' });
    res.json({ success:true, data: { ...userRes.rows[0], products: prodsRes.rows } });
  } catch (err) { next(err); }
};

// ── POST /api/admin/users/:id/verify
const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE users SET verified=true WHERE id=$1 RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} verified` });
  } catch (err) { next(err); }
};

// ── POST /api/admin/users/:id/suspend
const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE users SET status='suspended' WHERE id=$1 AND role='user' RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} suspended` });
  } catch (err) { next(err); }
};

// ── POST /api/admin/users/:id/reinstate
const reinstateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE users SET status='active' WHERE id=$1 RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} reinstated` });
  } catch (err) { next(err); }
};

// ── POST /api/admin/users/invite
const inviteUser = async (req, res, next) => {
  try {
    const { name, email, role = 'user', persona = 'Founder', country } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const { rows: existing } = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });
    }

    const inviteToken = uuid();
    const handle = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.random().toString(36).slice(2, 6);

    const { rows } = await query(
      `INSERT INTO users (name, handle, email, role, persona, country, invite_token, invite_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '48 hours')
       RETURNING id, name, email, role, handle, created_at`,
      [name, handle, email, role, persona, country || null, inviteToken]
    );

    await sendInviteEmail({ name, email, token: inviteToken, role });

    await query(
      'INSERT INTO activity_log (actor_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'admin.invite_user', 'users', rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: `Invite sent to ${email}`,
      data: { user: rows[0] },
    });
  } catch (err) { next(err); }
};

module.exports = { adminGetUsers, adminGetUser, verifyUser, suspendUser, reinstateUser, inviteUser };
