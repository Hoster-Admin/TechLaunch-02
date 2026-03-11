const { query } = require('../config/database');

// ── GET /api/entities
const getEntities = async (req, res, next) => {
  try {
    const { type, country, search, page=1, limit=20 } = req.query;
    const params = [];
    const conditions = [];
    if (type)    { params.push(type);         conditions.push(`type=$${params.length}`); }
    if (country) { params.push(country);      conditions.push(`country=$${params.length}`); }
    if (search)  { params.push(`%${search}%`);conditions.push(`name ILIKE $${params.length}`); }
    const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
    const offset=(parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);
    const { rows } = await query(
      `SELECT *, COUNT(*) OVER() AS total FROM entities ${where}
       ORDER BY verified DESC, followers_count DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const total = rows[0]?.total || 0;
    res.json({ success:true, data:rows.map(({total,...r})=>r), pagination:{total:parseInt(total)} });
  } catch(err){ next(err); }
};

// ── GET /api/entities/:slug
const getEntity = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM entities WHERE slug=$1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data:rows[0] });
  } catch(err){ next(err); }
};

// ── POST /api/entities/:id/apply (accelerator application)
const applyToAccelerator = async (req, res, next) => {
  try {
    const { startup_name, stage, pitch, product_id } = req.body;
    const { rows } = await query(`
      INSERT INTO accelerator_applications (applicant_id, entity_id, startup_name, stage, pitch, product_id)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, req.params.id, startup_name, stage, pitch||null, product_id||null]
    );
    res.status(201).json({ success:true, data:rows[0] });
  } catch(err){ next(err); }
};

// ── POST /api/entities/:id/pitch (investor pitch)
const pitchToInvestor = async (req, res, next) => {
  try {
    const { ask_amount, description, product_id } = req.body;
    const { rows } = await query(`
      INSERT INTO investor_pitches (founder_id, investor_id, ask_amount, description, product_id)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, req.params.id, ask_amount||null, description||null, product_id||null]
    );
    res.status(201).json({ success:true, data:rows[0] });
  } catch(err){ next(err); }
};

module.exports = { getEntities, getEntity, applyToAccelerator, pitchToInvestor };
