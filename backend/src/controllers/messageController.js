const { query } = require('../config/database');

// Ensure attachment columns exist (run once on startup)
async function ensureColumns() {
  try {
    await query(`
      ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS attachment_url   TEXT,
        ADD COLUMN IF NOT EXISTS attachment_type  TEXT,
        ADD COLUMN IF NOT EXISTS attachment_name  TEXT,
        ADD COLUMN IF NOT EXISTS is_delivered     BOOLEAN DEFAULT false
    `);
  } catch (e) {
    console.warn('Could not add message columns (may already exist):', e.message);
  }
}
ensureColumns();

// In-memory typing indicator store: { recipientId: { senderId: timestamp } }
const typingStore = {};
const TYPING_TIMEOUT = 4000;

// ── GET /api/messages/threads
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
const getThread = async (req, res, next) => {
  try {
    const { rows: userRows } = await query(
      'SELECT id FROM users WHERE handle = $1 LIMIT 1',
      [req.params.handle]
    );
    if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const otherId = userRows[0].id;

    // When I open a thread: mark messages FROM the other user TO me as read + delivered
    await query(
      'UPDATE messages SET is_read = true, is_delivered = true WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false',
      [otherId, req.user.id]
    );

    // When I open a thread: mark messages FROM other user TO me as delivered (covers already-read but not-yet-delivered edge case)
    await query(
      'UPDATE messages SET is_delivered = true WHERE sender_id = $1 AND recipient_id = $2 AND is_delivered = false',
      [otherId, req.user.id]
    );

    const { rows } = await query(`
      SELECT m.id, m.sender_id, m.recipient_id, m.body, m.is_read, m.is_delivered, m.created_at,
             m.attachment_url, m.attachment_type, m.attachment_name,
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
const sendMessage = async (req, res, next) => {
  try {
    const { body, attachment_url, attachment_type, attachment_name } = req.body;
    if (!body?.trim() && !attachment_url) return res.status(400).json({ success: false, message: 'Message body or attachment required' });
    if (body && body.trim().length > 2000) return res.status(400).json({ success: false, message: 'Message too long (max 2000 chars)' });

    if (attachment_url && !attachment_url.startsWith('/uploads/messages/')) {
      return res.status(400).json({ success: false, message: 'Invalid attachment URL' });
    }
    const allowedTypes = ['image', 'pdf', 'text'];
    if (attachment_type && !allowedTypes.includes(attachment_type)) {
      return res.status(400).json({ success: false, message: 'Invalid attachment type' });
    }

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
      INSERT INTO messages (sender_id, recipient_id, body, attachment_url, attachment_type, attachment_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, sender_id, recipient_id, body, is_read, is_delivered, created_at, attachment_url, attachment_type, attachment_name
    `, [req.user.id, recipientId, (body || '').trim(), attachment_url || null, attachment_type || null, attachment_name || null]);

    // Clear typing indicator for this sender -> recipient
    if (typingStore[recipientId]) {
      delete typingStore[recipientId][req.user.id];
    }

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

// ── POST /api/messages/:handle/typing
const setTyping = async (req, res, next) => {
  try {
    const { rows: userRows } = await query(
      'SELECT id FROM users WHERE handle = $1 LIMIT 1',
      [req.params.handle]
    );
    if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const recipientId = userRows[0].id;

    if (!typingStore[recipientId]) typingStore[recipientId] = {};
    typingStore[recipientId][req.user.id] = Date.now();

    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── GET /api/messages/:handle/typing
const getTyping = async (req, res, next) => {
  try {
    const { rows: userRows } = await query(
      'SELECT id FROM users WHERE handle = $1 LIMIT 1',
      [req.params.handle]
    );
    if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const otherId = userRows[0].id;

    const now = Date.now();
    const isTyping = typingStore[req.user.id]
      && typingStore[req.user.id][otherId]
      && (now - typingStore[req.user.id][otherId]) < TYPING_TIMEOUT;

    res.json({ success: true, data: { typing: !!isTyping } });
  } catch (err) { next(err); }
};

module.exports = { getThreads, getThread, sendMessage, getUnreadCount, setTyping, getTyping };
