const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { query } = require('../config/database');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = uuid();
  return { accessToken, refreshToken };
};

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken',  accessToken,  { ...COOKIE_OPTS, maxAge: 7  * 24 * 60 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken',  { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
};

// ── POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, handle, email, password, persona, country } = req.body;

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

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')`,
      [user.id, hashToken(refreshToken)]
    );

    await query(
      'INSERT INTO activity_log (actor_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [user.id, 'user.signup', 'users', user.id]
    );

    sendWelcomeEmail({ name: user.name, email: user.email });

    setAuthCookies(res, accessToken, refreshToken);
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
      [user.id, hashToken(refreshToken)]
    );

    const { password_hash, ...safeUser } = user;
    setAuthCookies(res, accessToken, refreshToken);
    res.json({
      success: true,
      data: { user: safeUser, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return res.status(400).json({ success:false, message:'Refresh token required' });

    const { rows } = await query(
      `SELECT rt.user_id, u.status FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token=$1 AND rt.revoked=false AND rt.expires_at > NOW()`,
      [hashToken(refreshToken)]
    );
    if (!rows.length) return res.status(401).json({ success:false, message:'Invalid or expired refresh token' });

    const { user_id, status } = rows[0];
    if (status === 'suspended') return res.status(403).json({ success:false, message:'Account suspended' });

    await query('UPDATE refresh_tokens SET revoked=true WHERE token=$1', [hashToken(refreshToken)]);
    const tokens = generateTokens(user_id);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')`,
      [user_id, hashToken(tokens.refreshToken)]
    );

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ success:true, data: tokens });
  } catch (err) { next(err); }
};

// ── POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET revoked=true WHERE token=$1', [hashToken(refreshToken)]);
    }
    clearAuthCookies(res);
    res.json({ success:true, message:'Logged out' });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success:true, data: req.user });
};

// ── POST /api/auth/set-password  (admin-invited users)
const setPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success:false, message:'Token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success:false, message:'Password must be at least 8 characters' });
    }

    const { rows } = await query(
      `SELECT id, name, email, role, status, invite_token_expires_at
       FROM users
       WHERE invite_token = $1 AND invite_token_expires_at > NOW()`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ success:false, message:'Invalid or expired invite link' });
    }

    const user = rows[0];
    const hash = await bcrypt.hash(password, 12);

    await query(
      `UPDATE users
       SET password_hash = $1, invite_token = NULL, invite_token_expires_at = NULL, updated_at = NOW()
       WHERE id = $2`,
      [hash, user.id]
    );

    const { accessToken, refreshToken } = generateTokens(user.id);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')`,
      [user.id, hashToken(refreshToken)]
    );

    setAuthCookies(res, accessToken, refreshToken);
    res.json({
      success: true,
      message: 'Password set successfully',
      data: { accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success:false, message:'Email is required' });

    const { rows } = await query(
      'SELECT id, name, email FROM users WHERE email=$1', [email.toLowerCase().trim()]
    );

    // Always respond 200 to prevent email enumeration
    if (!rows.length) {
      return res.json({ success:true, message:'If that email is registered, a reset link has been sent.' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      'UPDATE users SET reset_token=$1, reset_token_expires_at=$2 WHERE id=$3',
      [token, expires, user.id]
    );

    sendPasswordResetEmail({ name: user.name, email: user.email, token });

    res.json({ success:true, message:'If that email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// ── POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success:false, message:'Token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success:false, message:'Password must be at least 8 characters' });
    }

    const { rows } = await query(
      `SELECT id, name, email FROM users WHERE reset_token=$1 AND reset_token_expires_at > NOW()`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ success:false, message:'Invalid or expired reset link. Please request a new one.' });
    }

    const user = rows[0];
    const hash = await bcrypt.hash(password, 12);

    await query(
      `UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires_at=NULL, updated_at=NOW() WHERE id=$2`,
      [hash, user.id]
    );

    // Revoke all existing refresh tokens for security
    await query('UPDATE refresh_tokens SET revoked=true WHERE user_id=$1', [user.id]);

    const { accessToken, refreshToken } = generateTokens(user.id);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')`,
      [user.id, hashToken(refreshToken)]
    );

    setAuthCookies(res, accessToken, refreshToken);
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: { accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, getMe, setPassword, forgotPassword, resetPassword };
