const { query } = require('../config/database');

// ── GET /api/community-tags
const getTags = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM community_tags ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── POST /api/admin/community-tags
const createTag = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Tag name required' });
    const { rows } = await query(
      'INSERT INTO community_tags (name, color, created_by) VALUES ($1,$2,$3) RETURNING *',
      [name.trim(), color || '#E15033', req.user.id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Tag already exists' });
    next(err);
  }
};

// ── DELETE /api/admin/community-tags/:id
const deleteTag = async (req, res, next) => {
  try {
    await query('DELETE FROM community_tags WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── GET /api/community-posts  (published only)
const getPosts = async (req, res, next) => {
  try {
    const { type, tag_id, limit = 20, page = 1 } = req.query;
    const params = [];
    const conditions = ["cp.status = 'published'"];
    if (type)   { params.push(type);   conditions.push(`cp.type = $${params.length}`); }
    if (tag_id) { params.push(tag_id); conditions.push(`cp.tag_id = $${params.length}`); }
    const where = 'WHERE ' + conditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await query(`
      SELECT cp.*, ct.name AS tag_name, ct.color AS tag_color,
             u.name AS author_name, u.handle AS author_handle,
             u.avatar_color, u.avatar_url, u.verified AS author_verified
      FROM community_posts cp
      LEFT JOIN community_tags ct ON ct.id = cp.tag_id
      JOIN users u ON u.id = cp.author_id
      ${where}
      ORDER BY cp.published_at DESC, cp.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── GET /api/community-posts/my-drafts  (own drafts)
const getMyDrafts = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT cp.*, ct.name AS tag_name, ct.color AS tag_color
      FROM community_posts cp
      LEFT JOIN community_tags ct ON ct.id = cp.tag_id
      WHERE cp.author_id = $1 AND cp.status = 'draft'
      ORDER BY cp.updated_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── GET /api/community-posts/:id
const getPost = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT cp.*, ct.name AS tag_name, ct.color AS tag_color,
             u.name AS author_name, u.handle AS author_handle,
             u.avatar_color, u.avatar_url, u.verified AS author_verified
      FROM community_posts cp
      LEFT JOIN community_tags ct ON ct.id = cp.tag_id
      JOIN users u ON u.id = cp.author_id
      WHERE cp.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Post not found' });
    const post = rows[0];
    if (post.status === 'draft' && post.author_id !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
};

// ── POST /api/community-posts  (create draft or publish)
const createPost = async (req, res, next) => {
  try {
    const { type, title, body, tag_id, status = 'draft', image_url } = req.body;
    if (!type || !['post', 'article'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be post or article' });
    }
    if (!body?.trim() && status === 'published') {
      return res.status(400).json({ success: false, message: 'Body is required to publish' });
    }
    if (type === 'article' && !title?.trim() && status === 'published') {
      return res.status(400).json({ success: false, message: 'Title is required for articles' });
    }
    const publishedAt = status === 'published' ? new Date() : null;
    const { rows } = await query(
      `INSERT INTO community_posts (type, status, title, body, tag_id, author_id, published_at, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [type, status, title?.trim() || null, body?.trim() || '', tag_id || null, req.user.id, publishedAt, image_url || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ── PUT /api/community-posts/:id  (update / publish draft)
const updatePost = async (req, res, next) => {
  try {
    const { rows: existing } = await query('SELECT * FROM community_posts WHERE id=$1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (existing[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { title, body, tag_id, status, image_url } = req.body;
    const post = existing[0];
    const newStatus = status || post.status;
    const publishedAt = (newStatus === 'published' && !post.published_at) ? new Date() : post.published_at;
    const { rows } = await query(
      `UPDATE community_posts SET
         title=$1, body=$2, tag_id=$3, status=$4, published_at=$5, image_url=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [
        title?.trim() ?? post.title,
        body?.trim() ?? post.body,
        tag_id !== undefined ? (tag_id || null) : post.tag_id,
        newStatus,
        publishedAt,
        image_url !== undefined ? (image_url || null) : post.image_url,
        req.params.id,
      ]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ── DELETE /api/community-posts/:id
const deletePost = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT author_id FROM community_posts WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await query('DELETE FROM community_posts WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = {
  getTags, createTag, deleteTag,
  getPosts, getMyDrafts, getPost, createPost, updatePost, deletePost,
};
