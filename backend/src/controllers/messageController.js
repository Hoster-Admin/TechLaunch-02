const { query } = require('../config/database');

// ── GET /api/messages/threads
// List all conversations for the current user, with latest message + unread count
const getThreads = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        u.id,
        u.handle,
        u.name,
        u.avatar_url,
        u.avatar_color,
        u.persona,
        u.verified,
        latest.body        AS last_message,
        latest.created_at  AS last_at,
        latest.sender_id   AS last_sender_id,
        COALESCE(unread.cnt, 0)::int AS unread_count
      FROM (
        SELECT DISTINCT ON (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id))
               sender_id, recipient_id, body, created_at
        FROM   messages
        WHERE  sender_id = $1 OR recipient_id = $1
        ORDER  BY LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC
      ) latest
      JOIN users u ON u.id = CASE WHEN latest.sender_id = $1 THEN latest.recipient_id ELSE latest.sender_id END
      LEFT JOIN (
        SELECT sender_id, COUNT(*) AS cnt
        FROM   messages
        WHERE  recipient_id = $1 AND is_read = false
        GROUP  BY sender_id
      ) unread ON unread.sender_id = u.id
      ORDER BY latest.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── GET /api/messages/:handle
// Get all messages in a thread with a specific user
const getThread = async (req, res, next) => {
  try {
    const { rows: userRows } = await query(
      'SELECT id FROM users WHERE handle = $1 LIMIT 1',
      [req.params.handle]
    );
    if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const otherId = userRows[0].id;

    // Mark incoming messages as read
    await query(
      'UPDATE messages SET is_read = true WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false',
      [otherId, req.user.id]
    );

    const { rows } = await query(`
      SELECT m.id, m.sender_id, m.recipient_id, m.body, m.is_read, m.created_at,
             s.handle AS sender_handle, s.name AS sender_name, s.avatar_url AS sender_avatar_url, s.avatar_color AS sender_avatar_color
      FROM   messages m
      JOIN   users s ON s.id = m.sender_id
      WHERE  (m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $2 AND m.recipient_id = $1)
      ORDER  BY m.created_at ASC
    `, [req.user.id, otherId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ── POST /api/messages/:handle
// Send a message to a user by handle
const sendMessage = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Message body required' });
    if (body.trim().length > 2000) return res.status(400).json({ success: false, message: 'Message too long (max 2000 chars)' });

    const { rows: userRows } = await query(
      'SELECT id FROM users WHERE handle = $1 LIMIT 1',
      [req.params.handle]
    );
    if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const recipientId = userRows[0].id;

    if (recipientId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    const { rows } = await query(`
      INSERT INTO messages (sender_id, recipient_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, recipient_id, body, is_read, created_at
    `, [req.user.id, recipientId, body.trim()]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ── GET /api/messages/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT COUNT(*) AS cnt FROM messages WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ success: true, data: { count: parseInt(rows[0].cnt, 10) } });
  } catch (err) { next(err); }
};

module.exports = { getThreads, getThread, sendMessage, getUnreadCount };
