const { query } = require('../config/database');

// ── GET /api/launcher  — fetch all posts newest-first
const getPosts = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { rows } = await query(`
      SELECT
        lp.id, lp.content, lp.tag, lp.likes_count, lp.comments_count, lp.created_at,
        u.id   AS user_id,
        u.name AS author,
        u.handle AS author_handle,
        u.avatar_color,
        u.avatar_url,
        u.verified,
        CASE WHEN $1::uuid IS NOT NULL
             THEN EXISTS(SELECT 1 FROM launcher_post_likes WHERE post_id=lp.id AND user_id=$1)
             ELSE false
        END AS liked
      FROM launcher_posts lp
      JOIN users u ON u.id = lp.user_id
      ORDER BY lp.created_at DESC
      LIMIT 100
    `, [userId]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── POST /api/launcher  — create a post
const createPost = async (req, res, next) => {
  try {
    const { content, tag } = req.body;
    const { rows } = await query(`
      INSERT INTO launcher_posts (user_id, content, tag)
      VALUES ($1, $2, $3)
      RETURNING id, content, tag, likes_count, comments_count, created_at
    `, [req.user.id, content.trim(), tag || 'Discussion']);
    const post = rows[0];
    res.status(201).json({
      success: true,
      data: {
        ...post,
        user_id: req.user.id,
        author: req.user.name,
        author_handle: req.user.handle,
        avatar_color: req.user.avatar_color,
        avatar_url: req.user.avatar_url || null,
        verified: req.user.verified,
        liked: false,
      }
    });
  } catch (err) { next(err); }
};

// ── POST /api/launcher/:id/like  — toggle like
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      'SELECT 1 FROM launcher_post_likes WHERE post_id=$1 AND user_id=$2',
      [id, req.user.id]
    );
    if (rows.length) {
      await query('DELETE FROM launcher_post_likes WHERE post_id=$1 AND user_id=$2', [id, req.user.id]);
      await query('UPDATE launcher_posts SET likes_count=GREATEST(0,likes_count-1) WHERE id=$1', [id]);
      res.json({ success: true, data: { liked: false } });
    } else {
      await query('INSERT INTO launcher_post_likes (post_id, user_id) VALUES ($1,$2)', [id, req.user.id]);
      await query('UPDATE launcher_posts SET likes_count=likes_count+1 WHERE id=$1', [id]);
      // Fire notification to post author (if not self-like)
      const { rows: post } = await query('SELECT user_id FROM launcher_posts WHERE id=$1', [id]);
      if (post.length && post[0].user_id !== req.user.id) {
        await query(
          `INSERT INTO notifications (user_id, type, title, body, link, data)
           VALUES ($1,'like','Someone liked your post',$2,$3,$4)`,
          [post[0].user_id, `${req.user.name} liked your post`, `/launcher`, JSON.stringify({ actor_id: req.user.id, post_id: id })]
        ).catch(() => {});
      }
      res.json({ success: true, data: { liked: true } });
    }
  } catch (err) { next(err); }
};

// ── GET /api/launcher/:id/comments
const getComments = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT c.id, c.body, c.created_at,
             u.name AS author, u.handle AS author_handle,
             u.avatar_color, u.avatar_url
      FROM launcher_post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id=$1
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── POST /api/launcher/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { body } = req.body;
    const { rows } = await query(`
      INSERT INTO launcher_post_comments (post_id, user_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, body, created_at
    `, [req.params.id, req.user.id, body.trim()]);
    await query(
      'UPDATE launcher_posts SET comments_count=comments_count+1 WHERE id=$1',
      [req.params.id]
    );
    // Fire notification to post author
    const { rows: post } = await query('SELECT user_id FROM launcher_posts WHERE id=$1', [req.params.id]);
    if (post.length && post[0].user_id !== req.user.id) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body, link, data)
         VALUES ($1,'comment','New reply on your post',$2,$3,$4)`,
        [post[0].user_id, `${req.user.name} replied to your post`, `/launcher`, JSON.stringify({ actor_id: req.user.id, post_id: req.params.id })]
      ).catch(() => {});
    }
    res.status(201).json({
      success: true,
      data: {
        ...rows[0],
        author: req.user.name,
        author_handle: req.user.handle,
        avatar_color: req.user.avatar_color,
        avatar_url: req.user.avatar_url || null,
      }
    });
  } catch (err) { next(err); }
};

// ── DELETE /api/launcher/:id  — delete own post
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query('SELECT user_id FROM launcher_posts WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Post not found' });
    if (rows[0].user_id !== req.user.id && !['admin','moderator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await query('DELETE FROM launcher_posts WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getPosts, createPost, toggleLike, getComments, addComment, deletePost };
