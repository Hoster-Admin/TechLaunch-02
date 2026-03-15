const { query } = require('../config/database');

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
const getDashboard = async (req, res, next) => {
  try {
    const [products, users, upvotes, apps, waitlist, activity, topProducts, newUsers] =
      await Promise.all([
        query(`SELECT
          COUNT(*) FILTER (WHERE status='live')    AS live,
          COUNT(*) FILTER (WHERE status='pending') AS pending,
          COUNT(*) FILTER (WHERE status='soon')    AS soon,
          COUNT(*) FILTER (WHERE status='rejected')AS rejected,
          COUNT(*) AS total
          FROM products`),
        query(`SELECT
          COUNT(*) FILTER (WHERE status='active')    AS active,
          COUNT(*) FILTER (WHERE status='suspended') AS suspended,
          COUNT(*) AS total FROM users WHERE role='user'`),
        query(`SELECT COALESCE(SUM(upvotes_count),0) AS total FROM products`),
        query(`SELECT COUNT(*) FILTER (WHERE status IN ('pending','reviewing')) AS pending FROM accelerator_applications`),
        query(`SELECT COALESCE(SUM(waitlist_count),0) AS total FROM products`),
        query(`SELECT al.action, al.created_at, al.details,
                u.name AS actor_name, u.handle AS actor_handle, u.avatar_color
               FROM activity_log al
               LEFT JOIN users u ON u.id = al.actor_id
               ORDER BY al.created_at DESC LIMIT 10`),
        query(`SELECT id, name, logo_emoji, industry, upvotes_count, status
               FROM products WHERE status='live'
               ORDER BY upvotes_count DESC LIMIT 5`),
        query(`SELECT id, name, handle, persona, country, avatar_color, created_at
               FROM users ORDER BY created_at DESC LIMIT 8`),
      ]);

    const upvoteChart = await query(`
      SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'Dy') AS day,
             COUNT(*) AS count
      FROM upvotes
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at), day
      ORDER BY DATE_TRUNC('day', created_at)`);

    const signupChart = await query(`
      SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'WW') AS week,
             COUNT(*) AS count
      FROM users
      WHERE created_at > NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', created_at), week
      ORDER BY DATE_TRUNC('week', created_at)`);

    res.json({
      success: true,
      data: {
        stats: {
          products: products.rows[0],
          users: users.rows[0],
          upvotes: parseInt(upvotes.rows[0].total),
          apps_pending: parseInt(apps.rows[0].pending),
          waitlist: parseInt(waitlist.rows[0].total),
        },
        topProducts: topProducts.rows,
        newUsers: newUsers.rows,
        activity: activity.rows,
        charts: {
          upvotes: upvoteChart.rows,
          signups: signupChart.rows,
        },
      },
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════
const getSettings = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT key, value, type FROM platform_settings ORDER BY key');
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.type === 'boolean' ? r.value === 'true' : r.value;
    });
    res.json({ success:true, data:settings });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await query(
        `UPDATE platform_settings SET value=$1, updated_by=$2, updated_at=NOW() WHERE key=$3`,
        [String(value), req.user.id, key]
      );
    }
    res.json({ success:true, message:'Settings updated' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// TEAM
// ═══════════════════════════════════════════════
const getTeam = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT tm.id, tm.role, tm.created_at,
             u.id AS user_id, u.name, u.email, u.handle, u.avatar_color
      FROM team_members tm JOIN users u ON u.id = tm.user_id
      ORDER BY tm.created_at ASC`);
    const { rows: owner } = await query(
      `SELECT id AS user_id, name, email, handle, avatar_color, role FROM users WHERE role='admin' LIMIT 1`
    );
    res.json({ success:true, data: { owner: owner[0], team: rows } });
  } catch (err) { next(err); }
};

const addTeamMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const { rows: user } = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (!user.length) return res.status(404).json({ success:false, message:'User not found with that email' });
    await query(
      'INSERT INTO team_members (user_id, role, added_by) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET role=$2',
      [user[0].id, role, req.user.id]
    );
    await query(`UPDATE users SET role=$1 WHERE id=$2`, [role, user[0].id]);
    res.json({ success:true, message:'Team member added' });
  } catch (err) { next(err); }
};

const removeTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM team_members WHERE id=$1', [id]);
    res.json({ success:true, message:'Team member removed' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════
const getReports = async (req, res, next) => {
  try {
    const [kpis, countryBreakdown, industryBreakdown, personaBreakdown, signupTrend] =
      await Promise.all([
        query(`SELECT
          (SELECT COUNT(*) FROM products WHERE status='live') AS live_products,
          (SELECT COUNT(*) FROM users WHERE status='active') AS active_users,
          (SELECT COALESCE(SUM(upvotes_count),0) FROM products) AS total_upvotes,
          (SELECT COALESCE(SUM(waitlist_count),0) FROM products) AS waitlist_total,
          (SELECT COUNT(*) FROM accelerator_applications) AS total_apps,
          (SELECT ROUND(AVG(upvotes_count)) FROM products WHERE status='live') AS avg_upvotes,
          (SELECT name FROM products ORDER BY upvotes_count DESC LIMIT 1) AS top_product`),
        query(`SELECT country, COUNT(*) AS count FROM users WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 8`),
        query(`SELECT industry, COUNT(*) AS count FROM products GROUP BY industry ORDER BY count DESC LIMIT 8`),
        query(`SELECT persona, COUNT(*) AS count FROM users WHERE status='active' GROUP BY persona ORDER BY count DESC`),
        query(`SELECT TO_CHAR(DATE_TRUNC('week', created_at),'IYYY-IW') AS week,
                      COUNT(*) AS signups
               FROM users WHERE created_at > NOW()-INTERVAL '8 weeks'
               GROUP BY week ORDER BY week`),
      ]);

    res.json({ success:true, data: {
      kpis: kpis.rows[0],
      country_breakdown: countryBreakdown.rows,
      industry_breakdown: industryBreakdown.rows,
      persona_breakdown: personaBreakdown.rows,
      signup_trend: signupTrend.rows,
    }});
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// PLATFORM POSTS
// ═══════════════════════════════════════════════
const getPlatformPosts = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM platform_posts ORDER BY created_at DESC');
    res.json({ success:true, data:rows });
  } catch (err) { next(err); }
};

const createPlatformPost = async (req, res, next) => {
  try {
    const { type, body } = req.body;
    const { rows } = await query(
      'INSERT INTO platform_posts (type, body, author_id) VALUES ($1,$2,$3) RETURNING *',
      [type, body, req.user.id]
    );
    res.status(201).json({ success:true, data:rows[0] });
  } catch (err) { next(err); }
};

const deletePlatformPost = async (req, res, next) => {
  try {
    await query('DELETE FROM platform_posts WHERE id=$1', [req.params.id]);
    res.json({ success:true, message:'Post deleted' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// SUGGESTIONS
// ═══════════════════════════════════════════════
const getSuggestions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const sql = `
      SELECT s.*, u.name AS user_name, u.handle AS user_handle, u.avatar_color,
             r.name AS responder_name
      FROM suggestions s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN users r ON r.id = s.responded_by
      ${status && status !== 'all' ? "WHERE s.status = $1" : ""}
      ORDER BY s.created_at DESC
    `;
    const result = status && status !== 'all'
      ? await query(sql, [status])
      : await query(sql);
    res.json({ success: true, data: { suggestions: result.rows } });
  } catch (err) { next(err); }
};

const respondSuggestion = async (req, res, next) => {
  try {
    const { response } = req.body;
    if (!response || !response.trim()) {
      return res.status(400).json({ success: false, message: 'Response text is required' });
    }
    const result = await query(
      `UPDATE suggestions SET admin_response=$1, responded_by=$2, responded_at=NOW(), status='responded'
       WHERE id=$3 RETURNING *`,
      [response.trim(), req.user.id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { suggestion: result.rows[0] } });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// EMAIL SIGNUPS
// ═══════════════════════════════════════════════
const getEmailSignups = async (req, res, next) => {
  try {
    const [waitlists, discounts] = await Promise.all([
      query(`
        SELECT ws.id, ws.email, ws.name, ws.created_at,
               p.name AS product_name, p.logo_emoji,
               u.name AS user_name, u.handle AS user_handle
        FROM waitlist_signups ws
        JOIN products p ON p.id = ws.product_id
        LEFT JOIN users u ON u.id = ws.user_id
        ORDER BY ws.created_at DESC
        LIMIT 500
      `),
      query(`
        SELECT ds.id, ds.email, ds.name, ds.created_at,
               p.name AS product_name, p.logo_emoji,
               u.name AS user_name, u.handle AS user_handle
        FROM discount_signups ds
        JOIN products p ON p.id = ds.product_id
        LEFT JOIN users u ON u.id = ds.user_id
        ORDER BY ds.created_at DESC
        LIMIT 500
      `),
    ]);
    res.json({ success:true, data:{ waitlists: waitlists.rows, discounts: discounts.rows } });
  } catch (err) { next(err); }
};

module.exports = {
  getDashboard,
  getSettings, updateSettings,
  getTeam, addTeamMember, removeTeamMember,
  getReports,
  getPlatformPosts, createPlatformPost, deletePlatformPost,
  getSuggestions, respondSuggestion,
  getEmailSignups,
};
