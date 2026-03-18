const jwt  = require('jsonwebtoken');
const { query } = require('../config/database');

const USER_FIELDS = 'id, name, handle, email, role, status, verified, avatar_url, avatar_color, persona, country, headline, github, bio, website, twitter, linkedin, followers_count, following_count, created_at, entity_id';

// ── Extract token from cookie or Authorization header
const extractToken = (req) => {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];
  return null;
};

// ── Verify JWT and attach user to req
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success:false, message:'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      `SELECT ${USER_FIELDS} FROM users WHERE id=$1`,
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ success:false, message:'User not found' });
    const user = rows[0];
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success:false, message:'Account suspended' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success:false, message:'Token expired' });
    }
    return res.status(401).json({ success:false, message:'Invalid token' });
  }
};

// ── Optional auth (attaches user if token present, doesn't fail if not)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      `SELECT ${USER_FIELDS} FROM users WHERE id=$1`,
      [decoded.userId]
    );
    if (rows.length && rows[0].status === 'active') req.user = rows[0];
    next();
  } catch {
    next(); // silently ignore invalid token
  }
};

// ── Role guard factory
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success:false, message:'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success:false, message:'Insufficient permissions' });
  }
  next();
};

const requireAdmin = requireRole('admin');
const requireMod   = requireRole('admin', 'moderator');
const requireEditor= requireRole('admin', 'moderator', 'editor');

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin, requireMod, requireEditor };
