const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

// ── GET /api/users/:handle
const getProfile = async (req, res, next) => {
  try {
    const handle = req.params.handle.replace('@','');
    const { rows } = await query(`
      SELECT id, name, handle, persona, country, bio, website, twitter, linkedin,
             avatar_url, avatar_color, verified, followers_count, following_count,
             products_count, votes_given, created_at
      FROM users WHERE handle=$1 AND status='active'`, [handle]);
    if (!rows.length) return res.status(404).json({ success:false, message:'User not found' });

    const user = rows[0];
    const { rows: products } = await query(`
      SELECT id, name, tagline, logo_emoji, industry, countries, status, upvotes_count, featured, created_at
      FROM products WHERE submitted_by=$1 AND status IN ('live','soon')
      ORDER BY created_at DESC`, [user.id]);

    let isFollowing = false;
    if (req.user) {
      const { rows: f } = await query(
        'SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2',
        [req.user.id, user.id]);
      isFollowing = f.length > 0;
    }

    res.json({ success:true, data:{ ...user, products, isFollowing } });
  } catch(err){ next(err); }
};

// ── PUT /api/users/me
const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name','bio','website','twitter','linkedin','country','persona'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (!Object.keys(updates).length) return res.status(400).json({ success:false, message:'Nothing to update' });

    const keys = Object.keys(updates);
    const setClauses = keys.map((k,i) => `${k}=$${i+2}`).join(', ');
    const { rows } = await query(
      `UPDATE users SET ${setClauses} WHERE id=$1
       RETURNING id,name,handle,email,persona,country,bio,website,twitter,linkedin,avatar_url,avatar_color,verified,role`,
      [req.user.id, ...Object.values(updates)]
    );
    res.json({ success:true, data:rows[0] });
  } catch(err){ next(err); }
};

// ── POST /api/users/me/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ success:false, message:'Current password incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ success:true, message:'Password updated' });
  } catch(err){ next(err); }
};

// ── POST /api/users/:id/follow
const toggleFollow = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ success:false, message:"Can't follow yourself" });
    const { rows } = await query(
      'SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2', [req.user.id, id]);
    if (rows.length) {
      await query('DELETE FROM follows WHERE follower_id=$1 AND following_id=$2', [req.user.id, id]);
      res.json({ success:true, data:{ following:false } });
    } else {
      await query('INSERT INTO follows (follower_id, following_id) VALUES ($1,$2)', [req.user.id, id]);
      res.json({ success:true, data:{ following:true } });
    }
  } catch(err){ next(err); }
};

// ── GET /api/users/me/bookmarks
const getBookmarks = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT p.id, p.name, p.tagline, p.logo_emoji, p.industry, p.upvotes_count,
             p.status, p.countries, bm.created_at AS bookmarked_at
      FROM bookmarks bm JOIN products p ON p.id = bm.product_id
      WHERE bm.user_id=$1 ORDER BY bm.created_at DESC`, [req.user.id]);
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

// ── GET /api/users/me/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]);
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

// ── PUT /api/users/me/notifications/read
const markNotificationsRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET read=true WHERE user_id=$1', [req.user.id]);
    res.json({ success:true });
  } catch(err){ next(err); }
};

module.exports = {
  getProfile, updateProfile, changePassword, toggleFollow,
  getBookmarks, getNotifications, markNotificationsRead
};
