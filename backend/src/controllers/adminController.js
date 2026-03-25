const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

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
// PRODUCTS (admin)
// ═══════════════════════════════════════════════
const adminGetProducts = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      if (status === 'featured') {
        conditions.push(`p.featured = true`);
      } else {
        params.push(status);
        conditions.push(`p.status = $${params.length}`);
      }
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.tagline ILIKE $${params.length})`);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    params.push(parseInt(limit), offset);
    const { rows } = await query(`
      SELECT p.*, u.name AS submitter_name, u.handle AS submitter_handle,
             a.name AS approver_name,
             COUNT(*) OVER() AS total_count
      FROM products p
      JOIN users u ON u.id = p.submitted_by
      LEFT JOIN users a ON a.id = p.approved_by
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);

    const total = rows[0]?.total_count || 0;
    res.json({
      success: true,
      data: rows.map(({ total_count, ...r }) => r),
      pagination: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) { next(err); }
};

const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`
      UPDATE products SET status='live', approved_by=$1, approved_at=NOW()
      WHERE id=$2 RETURNING name`, [req.user.id, id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await query('INSERT INTO activity_log (actor_id,action,entity,entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'product.approve', 'products', id]);
    res.json({ success:true, message:`${rows[0].name} approved` });
  } catch (err) { next(err); }
};

const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { rows } = await query(`
      UPDATE products SET status='rejected', rejected_reason=$1
      WHERE id=$2
      RETURNING name, submitted_by`, [reason||null, id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    await query('INSERT INTO activity_log (actor_id,action,entity,entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'product.reject', 'products', id]);

    // Send rejection email to founder (non-blocking)
    const { sendRejectionEmail } = require('../services/emailService');
    query('SELECT email, name FROM users WHERE id=$1', [rows[0].submitted_by])
      .then(({ rows: u }) => {
        if (u.length) {
          sendRejectionEmail({ to: u[0].email, productName: rows[0].name, reason: reason || '' })
            .catch(err => console.error('[Email] Rejection email failed:', err.message));
        }
      }).catch(() => {});

    res.json({ success:true, message:`${rows[0].name} rejected` });
  } catch (err) { next(err); }
};

const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`
      UPDATE products SET featured = NOT featured WHERE id=$1
      RETURNING name, featured`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: rows[0] });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// USERS (admin)
// ═══════════════════════════════════════════════
const adminGetUsers = async (req, res, next) => {
  try {
    const { status, persona, verified, search, page = 1, limit = 50 } = req.query;
    const params = [];
    const conditions = [`u.handle != 'techlaunchmena'`];

    if (status)   { params.push(status);  conditions.push(`u.status = $${params.length}`); }
    if (persona)  { params.push(persona); conditions.push(`u.persona = $${params.length}`); }
    if (verified === 'true') conditions.push(`u.verified = true`);
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.handle ILIKE $${params.length})`);
    }

    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);

    const { rows } = await query(`
      SELECT u.id, u.name, u.handle, u.email, u.persona, u.country, u.verified,
             u.status, u.role, u.avatar_color, u.created_at,
             u.products_count, u.votes_given, u.followers_count,
             COUNT(*) OVER() AS total_count
      FROM users u
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}`, params);

    const total = rows[0]?.total_count || 0;
    res.json({
      success: true,
      data: rows.map(({ total_count, ...r }) => r),
      pagination: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) { next(err); }
};

const adminGetUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [userRes, prodsRes, tagsRes] = await Promise.all([
      query(`SELECT u.id, u.name, u.handle, u.email, u.persona, u.country, u.bio,
                    u.verified, u.status, u.role, u.avatar_color, u.created_at,
                    u.products_count, u.votes_given, u.followers_count, u.following_count
             FROM users u WHERE u.id=$1`, [id]),
      query(`SELECT id, name, logo_emoji, industry, status, upvotes_count, created_at
             FROM products WHERE submitted_by=$1 ORDER BY created_at DESC`, [id]),
      query(`SELECT t.id, t.name, t.color, t.text_color FROM user_tags ut
             JOIN tags t ON t.id = ut.tag_id WHERE ut.user_id=$1`, [id]),
    ]);
    if (!userRes.rows.length) return res.status(404).json({ success:false, message:'User not found' });
    res.json({ success:true, data: {
      ...userRes.rows[0],
      products: prodsRes.rows,
      user_tags: tagsRes.rows,
    }});
  } catch (err) { next(err); }
};

const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE users SET verified=true WHERE id=$1 RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} verified` });
  } catch (err) { next(err); }
};

const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE users SET status='suspended' WHERE id=$1 AND role='user' RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} suspended` });
  } catch (err) { next(err); }
};

const reinstateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE users SET status='active' WHERE id=$1 RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} reinstated` });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// ENTITIES (admin)
// ═══════════════════════════════════════════════
const adminGetEntities = async (req, res, next) => {
  try {
    const { type, search, page=1, limit=50, sortBy='created_at', sortOrder='desc' } = req.query;
    const params = [];
    const conditions = [];
    if (type)   { params.push(type);   conditions.push(`e.type=$${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`e.name ILIKE $${params.length}`); }
    const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    const allowedSort = ['name','type','country','verified','created_at','status'];
    const col = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const dir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    params.push(parseInt(limit), offset);

    const { rows } = await query(`
      SELECT *, COUNT(*) OVER() AS total_count FROM entities e ${where}
      ORDER BY e.${col} ${dir}
      LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const total = rows[0]?.total_count || 0;
    res.json({ success:true, data: rows.map(({total_count,...r})=>r), pagination:{total:parseInt(total)} });
  } catch (err) { next(err); }
};

const adminGetEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`SELECT * FROM entities WHERE id=$1`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: rows[0] });
  } catch (err) { next(err); }
};

const adminUpdateEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, type, country, description, website, stage, industry,
      employees, founded_year, aum, portfolio_count, focus,
      logo_url, logo_emoji, linkedin, twitter, why_us, verified,
    } = req.body;

    const setClauses = [];
    const params = [];
    const maybeSet = (col, val, transform) => {
      if (val === undefined) return;
      params.push(transform ? transform(val) : val);
      setClauses.push(`${col} = $${params.length}`);
    };
    const maybeSetCoalesce = (col, val, transform) => {
      if (val === undefined || val === null) return;
      params.push(transform ? transform(val) : val);
      setClauses.push(`${col} = COALESCE($${params.length}, ${col})`);
    };

    maybeSetCoalesce('name', name);
    maybeSetCoalesce('type', type);
    maybeSet('country', country);
    maybeSet('description', description);
    maybeSet('website', website);
    maybeSet('stage', stage);
    maybeSet('industry', industry);
    maybeSet('employees', employees);
    maybeSet('founded_year', founded_year, v => v ? parseInt(v) : null);
    maybeSet('aum', aum);
    maybeSet('portfolio_count', portfolio_count, v => v ? parseInt(v) : null);
    maybeSet('focus', focus);
    maybeSet('logo_url', logo_url);
    maybeSetCoalesce('logo_emoji', logo_emoji);
    maybeSet('linkedin', linkedin);
    maybeSet('twitter', twitter);
    maybeSet('why_us', why_us);
    if (verified !== undefined && verified !== null) {
      params.push(verified);
      setClauses.push(`verified = $${params.length}`);
    }

    if (!setClauses.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const { rows } = await query(`
      UPDATE entities SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: rows[0], message:`${rows[0].name} updated` });
  } catch (err) { next(err); }
};

const suspendEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE entities SET status='suspended', updated_at=NOW() WHERE id=$1 RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} suspended` });
  } catch (err) { next(err); }
};

const unsuspendEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE entities SET status='active', updated_at=NOW() WHERE id=$1 RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} reactivated` });
  } catch (err) { next(err); }
};

const deleteEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`DELETE FROM entities WHERE id=$1 RETURNING name`, [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} deleted` });
  } catch (err) { next(err); }
};

const verifyEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE entities SET verified=true, verified_by=$1 WHERE id=$2 RETURNING name`,
      [req.user.id, id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, message:`${rows[0].name} verified` });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// APPLICATIONS (admin read-only view)
// ═══════════════════════════════════════════════
const adminGetApplications = async (req, res, next) => {
  try {
    const [accelApps, pitches, waitlists] = await Promise.all([
      query(`
        SELECT aa.*, u.name AS applicant_name, u.handle AS applicant_handle,
               e.name AS entity_name, p.name AS product_name
        FROM accelerator_applications aa
        JOIN users u ON u.id = aa.applicant_id
        JOIN entities e ON e.id = aa.entity_id
        LEFT JOIN products p ON p.id = aa.product_id
        ORDER BY aa.created_at DESC`),
      query(`
        SELECT ip.*, u.name AS founder_name, u.handle AS founder_handle,
               e.name AS investor_name, p.name AS product_name
        FROM investor_pitches ip
        JOIN users u ON u.id = ip.founder_id
        JOIN entities e ON e.id = ip.investor_id
        LEFT JOIN products p ON p.id = ip.product_id
        ORDER BY ip.created_at DESC`),
      query(`
        SELECT pr.id, pr.name, pr.logo_emoji, pr.waitlist_count,
               COUNT(ws.id) FILTER (WHERE ws.created_at > NOW()-INTERVAL '24h') AS last_24h
        FROM products pr
        LEFT JOIN waitlist_signups ws ON ws.product_id = pr.id
        WHERE pr.waitlist_count > 0
        GROUP BY pr.id ORDER BY pr.waitlist_count DESC`),
    ]);
    res.json({ success:true, data: {
      accelerator_apps: accelApps.rows,
      investor_pitches: pitches.rows,
      waitlists: waitlists.rows,
    }});
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════
// SETTINGS (admin)
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
// TEAM (admin)
// ═══════════════════════════════════════════════
const getTeam = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT tm.id, tm.role, tm.created_at,
             u.id AS user_id, u.name, u.email, u.handle, u.avatar_color
      FROM team_members tm JOIN users u ON u.id = tm.user_id
      ORDER BY tm.created_at ASC`);
    // Also include the owner (admin)
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
// REPORTS (admin)
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
// PLATFORM POSTS (My Profile section)
// ═══════════════════════════════════════════════
const getPlatformPosts = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM platform_posts ORDER BY created_at DESC'
    );
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

const getSuggestions = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
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

module.exports = {
  getDashboard,
  adminGetProducts, approveProduct, rejectProduct, toggleFeatured,
  adminGetUsers, adminGetUser, verifyUser, suspendUser, reinstateUser,
  adminGetEntities, adminGetEntity, adminUpdateEntity, suspendEntity, unsuspendEntity, deleteEntity, verifyEntity,
  adminGetApplications,
  getSettings, updateSettings,
  getTeam, addTeamMember, removeTeamMember,
  getReports,
  getPlatformPosts, createPlatformPost, deletePlatformPost,
  getSuggestions, respondSuggestion,
};
