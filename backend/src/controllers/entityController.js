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

// ── POST /api/entities  (any authenticated user can create)
const createEntity = async (req, res, next) => {
  try {
    const {
      name, type, description, website, country, industry,
      stage, employees, founded_year, aum, focus, logo_emoji
    } = req.body;

    if (!name || !type) return res.status(400).json({ success:false, message:'Name and type are required' });

    const validTypes = ['startup','accelerator','investor','venture_studio'];
    if (!validTypes.includes(type)) return res.status(400).json({ success:false, message:'Invalid entity type' });

    // Generate slug from name
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    let slug = base;
    let attempt = 0;
    while (true) {
      const { rows: existing } = await query('SELECT id FROM entities WHERE slug=$1', [slug]);
      if (!existing.length) break;
      attempt++;
      slug = `${base}-${attempt}`;
    }

    const { rows } = await query(`
      INSERT INTO entities (name, slug, type, description, website, country, industry,
        stage, employees, founded_year, aum, focus, logo_emoji, created_by, verified, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false,'pending')
      RETURNING *`,
      [name, slug, type, description||null, website||null, country||null, industry||null,
       stage||null, employees||null, founded_year||null, aum||null, focus||null,
       logo_emoji||'🏢', req.user.id]
    );

    await query(
      'INSERT INTO activity_log (actor_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'entity.create', 'entities', rows[0].id]
    );

    res.status(201).json({ success:true, data:rows[0] });
  } catch(err){ next(err); }
};

// ── GET /api/entities/:id/followers — followers list
const getEntityFollowers = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT u.id, u.name, u.handle, u.avatar_url, u.avatar_color, u.headline, u.persona
      FROM entity_follows ef
      JOIN users u ON u.id = ef.user_id
      WHERE ef.entity_id=$1
      ORDER BY ef.created_at DESC`, [req.params.id]
    );
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
};

module.exports = { getEntities, getEntity, createEntity, applyToAccelerator, pitchToInvestor, getEntityFollowers };
