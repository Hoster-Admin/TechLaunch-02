const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { query } = require('../config/database');
const { sendWelcomeEmail } = require('../services/emailService');

// ── Helper: generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = uuid();
  return { accessToken, refreshToken };
};

// ── POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, handle, email, password, persona, country } = req.body;

    // Check email / handle unique
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email=$1 OR handle=$2', [email, handle]
    );
    if (existing.length) {
      return res.status(409).json({ success:false, message:'Email or handle already taken' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(`
      INSERT INTO users (name, handle, email, password_hash, persona, country)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, handle, email, role, persona, country, verified, avatar_color`,
      [name, handle.replace('@',''), email, hash, persona||'Founder', country||null]
    );

    const user = rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    );

    // Log activity
    await query(
      'INSERT INTO activity_log (actor_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [user.id, 'user.signup', 'users', user.id]
    );

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: user.email, name: user.name, handle: user.handle })
      .catch(err => console.error('[Email] Welcome email failed for', user.email, ':', err.message));

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      `SELECT id, name, handle, email, password_hash, role, status, persona, country,
              headline, github, bio, website, twitter, linkedin, followers_count, following_count,
              verified, avatar_url, avatar_color, created_at FROM users WHERE email=$1`,
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ success:false, message:'Invalid credentials' });
    }
    const user = rows[0];

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success:false, message:'Account suspended' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success:false, message:'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user.id);

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    );

    const { password_hash, ...safeUser } = user;
    res.json({
      success: true,
      data: { user: safeUser, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success:false, message:'Refresh token required' });

    const { rows } = await query(
      `SELECT rt.user_id, u.status FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token=$1 AND rt.revoked=false AND rt.expires_at > NOW()`,
      [refreshToken]
    );
    if (!rows.length) return res.status(401).json({ success:false, message:'Invalid or expired refresh token' });

    const { user_id, status } = rows[0];
    if (status === 'suspended') return res.status(403).json({ success:false, message:'Account suspended' });

    // Rotate token
    await query('UPDATE refresh_tokens SET revoked=true WHERE token=$1', [refreshToken]);
    const tokens = generateTokens(user_id);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')`,
      [user_id, tokens.refreshToken]
    );

    res.json({ success:true, data: tokens });
  } catch (err) { next(err); }
};

// ── POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET revoked=true WHERE token=$1', [refreshToken]);
    }
    res.json({ success:true, message:'Logged out' });
  } catch (err) { next(err); }
};

// ── GET /api/auth/activate/:token  — validate token, return name+email
const checkActivationToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { rows } = await query(
      `SELECT at.id, at.user_id, at.used_at, at.expires_at, u.name, u.email
       FROM activation_tokens at JOIN users u ON u.id = at.user_id
       WHERE at.token = $1`, [token]
    );
    if (!rows.length)        return res.status(404).json({ success:false, message:'Invalid activation link' });
    if (rows[0].used_at)     return res.status(410).json({ success:false, message:'This link has already been used' });
    if (new Date(rows[0].expires_at) < new Date())
      return res.status(410).json({ success:false, message:'This activation link has expired' });
    const { id, user_id, used_at, expires_at, ...safe } = rows[0];
    res.json({ success:true, data: safe });
  } catch (err) { next(err); }
};

// ── POST /api/auth/activate  — set password, mark token used
const activateAccount = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8)
      return res.status(400).json({ success:false, message:'Token and a password of at least 8 characters are required' });

    const { rows } = await query(
      `SELECT at.id, at.user_id, at.used_at, at.expires_at
       FROM activation_tokens at WHERE at.token = $1`, [token]
    );
    if (!rows.length)    return res.status(404).json({ success:false, message:'Invalid activation link' });
    if (rows[0].used_at) return res.status(410).json({ success:false, message:'This link has already been used' });
    if (new Date(rows[0].expires_at) < new Date())
      return res.status(410).json({ success:false, message:'This activation link has expired' });

    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash=$1, email_verified=true WHERE id=$2', [hash, rows[0].user_id]);
    await query('UPDATE activation_tokens SET used_at=NOW() WHERE id=$1', [rows[0].id]);

    res.json({ success:true, message:'Account activated. You can now sign in.' });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success:true, data: req.user });
};

module.exports = { register, login, refresh, logout, getMe, checkActivationToken, activateAccount };
