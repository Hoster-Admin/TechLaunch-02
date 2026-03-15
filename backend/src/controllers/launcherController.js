const { query, getClient } = require('../config/database');

// ── GET /api/launcher  — fetch all posts newest-first
const getPosts = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { rows } = await query(`
      SELECT
        lp.id, lp.content, lp.tag, lp.image_url, lp.likes_count, lp.comments_count, lp.created_at,
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
    const { content, tag, image_url } = req.body;
    const { rows } = await query(`
      INSERT INTO launcher_posts (user_id, content, tag, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, tag, image_url, likes_count, comments_count, created_at
    `, [req.user.id, content.trim(), tag || 'Discussion', image_url || null]);
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
    const client = await getClient();
    let liked;
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'SELECT 1 FROM launcher_post_likes WHERE post_id=$1 AND user_id=$2',
        [id, req.user.id]
      );
      if (rows.length) {
        await client.query('DELETE FROM launcher_post_likes WHERE post_id=$1 AND user_id=$2', [id, req.user.id]);
        await client.query('UPDATE launcher_posts SET likes_count=GREATEST(0,likes_count-1) WHERE id=$1', [id]);
        liked = false;
      } else {
        await client.query('INSERT INTO launcher_post_likes (post_id, user_id) VALUES ($1,$2)', [id, req.user.id]);
        await client.query('UPDATE launcher_posts SET likes_count=likes_count+1 WHERE id=$1', [id]);
        liked = true;
      }
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK').catch(() => {});
      throw txErr;
    } finally {
      client.release();
    }

    if (liked) {
      const { rows: post } = await query('SELECT user_id FROM launcher_posts WHERE id=$1', [id]);
      if (post.length && post[0].user_id !== req.user.id) {
        query(
          `INSERT INTO notifications (user_id, type, title, body, link, data)
           VALUES ($1,'like','Someone liked your post',$2,$3,$4)`,
          [post[0].user_id, `${req.user.name} liked your post`, `/launcher`, JSON.stringify({ actor_id: req.user.id, post_id: id })]
        ).catch(() => {});
      }
    }
    res.json({ success: true, data: { liked } });
  } catch (err) { next(err); }
};

// ── POST /api/launcher/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { body, parent_id = null } = req.body;
    const { rows } = await query(`
      INSERT INTO launcher_post_comments (post_id, user_id, body, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, body, created_at, parent_id
    `, [req.params.id, req.user.id, body.trim(), parent_id || null]);
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

// ── GET /api/launcher/:id  — single post with viewer's like status
const getPost = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { rows } = await query(`
      SELECT
        lp.id, lp.content, lp.tag, lp.image_url, lp.likes_count, lp.comments_count, lp.created_at,
        u.id   AS user_id,
        u.name AS author,
        u.handle AS author_handle,
        u.avatar_color,
        u.avatar_url,
        u.verified,
        CASE WHEN $2::uuid IS NOT NULL
             THEN EXISTS(SELECT 1 FROM launcher_post_likes WHERE post_id=lp.id AND user_id=$2)
             ELSE false
        END AS liked
      FROM launcher_posts lp
      JOIN users u ON u.id = lp.user_id
      WHERE lp.id=$1
    `, [req.params.id, userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ── GET /api/launcher/:id/comments  (with liked status per comment)
const getCommentsWithLikes = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { rows } = await query(`
      SELECT c.id, c.body, c.created_at, c.likes_count, c.parent_id,
             u.name AS author, u.handle AS author_handle, u.avatar_color, u.avatar_url,
             CASE WHEN $2::uuid IS NOT NULL
                  THEN EXISTS(SELECT 1 FROM launcher_comment_likes WHERE comment_id=c.id AND user_id=$2)
                  ELSE false
             END AS liked
      FROM launcher_post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id=$1
      ORDER BY c.created_at ASC
    `, [req.params.id, userId]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── POST /api/launcher/comments/:id/like  — toggle like on a comment
const toggleCommentLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      'SELECT 1 FROM launcher_comment_likes WHERE comment_id=$1 AND user_id=$2',
      [id, req.user.id]
    );
    if (rows.length) {
      await query('DELETE FROM launcher_comment_likes WHERE comment_id=$1 AND user_id=$2', [id, req.user.id]);
      await query('UPDATE launcher_post_comments SET likes_count=GREATEST(0,likes_count-1) WHERE id=$1', [id]);
      res.json({ success: true, data: { liked: false } });
    } else {
      await query('INSERT INTO launcher_comment_likes (comment_id, user_id) VALUES ($1,$2)', [id, req.user.id]);
      await query('UPDATE launcher_post_comments SET likes_count=likes_count+1 WHERE id=$1', [id]);
      res.json({ success: true, data: { liked: true } });
    }
  } catch (err) { next(err); }
};

module.exports = { getPosts, getPost, createPost, toggleLike, getComments: getCommentsWithLikes, addComment, deletePost, toggleCommentLike };
