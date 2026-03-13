const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

// ── GET /api/users/:handle
const getProfile = async (req, res, next) => {
  try {
    const handle = req.params.handle.replace('@','');
    const { rows } = await query(`
      SELECT id, name, handle, persona, headline, country, bio, website, twitter, linkedin, github,
             avatar_url, avatar_color, verified, followers_count, following_count, created_at
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
    const allowed = ['name','headline','bio','website','twitter','linkedin','github','country','persona','avatar_url','avatar_color'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (!Object.keys(updates).length) return res.status(400).json({ success:false, message:'Nothing to update' });

    const keys = Object.keys(updates);
    const setClauses = keys.map((k,i) => `${k}=$${i+2}`).join(', ');
    const { rows } = await query(
      `UPDATE users SET ${setClauses} WHERE id=$1
       RETURNING id,name,handle,email,persona,headline,country,bio,website,twitter,linkedin,github,avatar_url,avatar_color,verified,role`,
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
      // Notify the followed user
      await query(
        `INSERT INTO notifications (user_id, type, title, body, link, data)
         VALUES ($1,'follow','New follower',$2,$3,$4)`,
        [id, `${req.user.name} started following you`, `/u/${req.user.handle}`,
         JSON.stringify({ actor_id: req.user.id, actor_handle: req.user.handle })]
      ).catch(() => {});
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

// ── GET /api/users/me/products
const getMyProducts = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, name, tagline, logo_emoji, industry, upvotes_count, status, countries, created_at
      FROM products WHERE submitted_by=$1 ORDER BY created_at DESC`, [req.user.id]);
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

// ── GET /api/users/:handle/upvoted  — products a user has voted on
const getUserUpvoted = async (req, res, next) => {
  try {
    const handle = (req.params.handle || '').replace('@','');
    const { rows: users } = await query(
      `SELECT id FROM users WHERE handle=$1 AND status='active' LIMIT 1`, [handle]);
    if (!users.length) return res.json({ success:true, data:[] });
    const uid = users[0].id;
    const { rows } = await query(`
      SELECT p.id, p.name, p.tagline, p.logo_emoji, p.industry, p.upvotes_count,
             p.status, p.countries, uv.created_at AS voted_at,
             true AS has_voted
      FROM upvotes uv JOIN products p ON p.id = uv.product_id
      WHERE uv.user_id=$1 AND p.status IN ('live','soon')
      ORDER BY uv.created_at DESC LIMIT 30`, [uid]);
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

// ── GET /api/users/:handle/activity  — comments + other activity
const getUserActivity = async (req, res, next) => {
  try {
    const handle = (req.params.handle || '').replace('@','');
    const { rows: users } = await query(
      `SELECT id FROM users WHERE handle=$1 AND status='active' LIMIT 1`, [handle]);
    if (!users.length) return res.json({ success:true, data:[] });
    const uid = users[0].id;
    const { rows } = await query(`
      SELECT c.id, c.body, c.created_at,
             p.id AS product_id, p.name AS product_name, p.logo_emoji AS product_emoji,
             'comment' AS type
      FROM comments c JOIN products p ON p.id = c.product_id
      WHERE c.user_id=$1
      ORDER BY c.created_at DESC LIMIT 40`, [uid]);
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

// ── GET /api/users?search=q
const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.search || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    if (!q) return res.json({ success:true, data:[] });
    const { rows } = await query(`
      SELECT id, name, handle, avatar_url, avatar_color, persona, verified
      FROM users
      WHERE status='active'
        AND (handle ILIKE $1 OR name ILIKE $1)
      ORDER BY followers_count DESC NULLS LAST
      LIMIT $2`, [`%${q}%`, limit]);
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

// ── GET /api/users/:handle/followers
const getUserFollowers = async (req, res, next) => {
  try {
    const { rows: target } = await query('SELECT id FROM users WHERE handle=$1', [req.params.handle]);
    if (!target.length) return res.status(404).json({ success:false, message:'User not found' });
    const userId = target[0].id;
    const { rows } = await query(`
      SELECT u.id, u.name, u.handle, u.avatar_url, u.avatar_color, u.headline, u.persona, u.verified,
             u.followers_count
      FROM follows f JOIN users u ON u.id = f.follower_id
      WHERE f.following_id=$1
      ORDER BY f.created_at DESC`, [userId]
    );
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

// ── GET /api/users/:handle/following
const getUserFollowing = async (req, res, next) => {
  try {
    const { rows: target } = await query('SELECT id FROM users WHERE handle=$1', [req.params.handle]);
    if (!target.length) return res.status(404).json({ success:false, message:'User not found' });
    const userId = target[0].id;
    const { rows } = await query(`
      SELECT u.id, u.name, u.handle, u.avatar_url, u.avatar_color, u.headline, u.persona, u.verified,
             u.followers_count
      FROM follows f JOIN users u ON u.id = f.following_id
      WHERE f.follower_id=$1
      ORDER BY f.created_at DESC`, [userId]
    );
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

// ── GET /api/users/people (discovery)
const getPeople = async (req, res, next) => {
  try {
    const { persona, country, search, page=1, limit=24 } = req.query;
    const params = [];
    const conditions = ["status='active'", "role='user'"];
    if (persona)  { params.push(persona);      conditions.push(`persona ILIKE $${params.length}`); }
    if (country)  { params.push(country);      conditions.push(`country=$${params.length}`); }
    if (search)   { params.push(`%${search}%`);conditions.push(`(name ILIKE $${params.length} OR handle ILIKE $${params.length} OR headline ILIKE $${params.length})`); }
    const where = 'WHERE ' + conditions.join(' AND ');
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await query(`
      SELECT id, name, handle, avatar_url, avatar_color, headline, persona, verified,
             country, followers_count, products_count, COUNT(*) OVER() AS total
      FROM users ${where}
      ORDER BY followers_count DESC NULLS LAST, created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}`, params
    );
    const total = rows.length > 0 ? parseInt(rows[0].total) : 0;
    res.json({ success:true, data:rows.map(({total,...r})=>r), pagination:{total, page:parseInt(page)} });
  } catch(err){ next(err); }
};

module.exports = {
  getProfile, updateProfile, changePassword, toggleFollow,
  getBookmarks, getMyProducts, getNotifications, markNotificationsRead,
  searchUsers, getUserUpvoted, getUserActivity,
  getUserFollowers, getUserFollowing, getPeople
};
