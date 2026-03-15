const { query } = require('../config/database');

// ── GET /api/admin/entities
const adminGetEntities = async (req, res, next) => {
  try {
    const { type, search, page=1, limit=50 } = req.query;
    const params = [];
    const conditions = [];
    if (type)   { params.push(type);   conditions.push(`e.type=$${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`e.name ILIKE $${params.length}`); }
    const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);

    const { rows } = await query(`
      SELECT *, COUNT(*) OVER() AS total_count FROM entities ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const total = rows[0]?.total_count || 0;
    res.json({ success:true, data: rows.map(({total_count,...r})=>r), pagination:{total:parseInt(total)} });
  } catch (err) { next(err); }
};

// ── POST /api/admin/entities/:id/verify
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

// ── GET /api/admin/applications
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

module.exports = { adminGetEntities, verifyEntity, adminGetApplications };
