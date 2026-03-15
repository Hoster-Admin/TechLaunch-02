const { query, getClient } = require('../config/database');

// ── GET /api/products  (public, filterable)
const getProducts = async (req, res, next) => {
  try {
    const {
      status = 'live', industry, country, search,
      sort = 'upvotes', page = 1, limit = 20,
      featured, submitter
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (submitter){ params.push(submitter); conditions.push(`p.submitted_by = $${params.length}`); }

    // Status filter
    if (status === 'all') {
      if (!submitter) conditions.push(`p.status IN ('live','soon')`);
      // else: no status filter — show all statuses for the submitter
    } else {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }
    if (industry) { params.push(industry); conditions.push(`p.industry = $${params.length}`); }
    if (country)  { params.push(country);  conditions.push(`$${params.length} = ANY(p.countries)`); }
    if (featured === 'true') conditions.push(`p.featured = true`);
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.tagline ILIKE $${params.length})`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const orderMap = {
      upvotes:  'p.upvotes_count DESC',
      newest:   'p.created_at DESC',
      az:       'p.name ASC',
      comments: 'p.comments_count DESC',
    };
    const order = orderMap[sort] || 'p.upvotes_count DESC';

    // Get user vote/bookmark state if authenticated (parameterized — no template interpolation)
    let voteJoin = '', bookmarkJoin = '';
    if (req.user) {
      params.push(req.user.id);
      const uidIdx = params.length;
      voteJoin     = `LEFT JOIN upvotes uv ON uv.product_id = p.id AND uv.user_id = $${uidIdx}`;
      bookmarkJoin = `LEFT JOIN bookmarks bm ON bm.product_id = p.id AND bm.user_id = $${uidIdx}`;
    }

    params.push(parseInt(limit), offset);
    const sql = `
      SELECT p.*, u.name AS submitter_name, u.handle AS submitter_handle,
             u.avatar_color AS submitter_color,
             ${req.user ? 'uv.id IS NOT NULL AS has_voted, bm.id IS NOT NULL AS has_bookmarked,' : 'false AS has_voted, false AS has_bookmarked,'}
             COUNT(*) OVER() AS total_count
      FROM products p
      JOIN users u ON u.id = p.submitted_by
      ${voteJoin}
      ${bookmarkJoin}
      ${where}
      ORDER BY ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await query(sql, params);
    const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

    res.json({
      success: true,
      data: rows.map(({ total_count, ...p }) => p),
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) { next(err); }
};

// ── GET /api/products/:id
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id)) return res.status(404).json({ success: false, message: 'Product not found' });
    const queryParams = [id];
    let voteJoin = '', bookmarkJoin = '', waitlistJoin = '';
    if (req.user) {
      queryParams.push(req.user.id);
      voteJoin     = `LEFT JOIN upvotes uv ON uv.product_id = p.id AND uv.user_id = $2`;
      bookmarkJoin = `LEFT JOIN bookmarks bm ON bm.product_id = p.id AND bm.user_id = $2`;
      waitlistJoin = `LEFT JOIN waitlist_signups ws ON ws.product_id = p.id AND ws.user_id = $2`;
    }

    const { rows } = await query(`
      SELECT p.*, u.name AS submitter_name, u.handle AS submitter_handle,
             u.avatar_color AS submitter_color, u.avatar_url AS submitter_avatar,
             ${req.user ? 'uv.id IS NOT NULL AS has_voted, bm.id IS NOT NULL AS has_bookmarked, ws.id IS NOT NULL AS on_waitlist' : 'false AS has_voted, false AS has_bookmarked, false AS on_waitlist'}
      FROM products p
      JOIN users u ON u.id = p.submitted_by
      ${voteJoin} ${bookmarkJoin} ${waitlistJoin}
      WHERE p.id = $1`, queryParams
    );

    if (!rows.length) return res.status(404).json({ success:false, message:'Product not found' });

    const product = rows[0];
    const isOwner = req.user && req.user.id === product.submitted_by;
    const isAdmin = req.user && ['admin','moderator'].includes(req.user.role);

    // Block non-owners from seeing pending/rejected products
    if (['pending','rejected'].includes(product.status) && !isOwner && !isAdmin) {
      return res.status(404).json({ success:false, message:'Product not found' });
    }

    // Increment view count
    await query('UPDATE products SET views_count = views_count + 1 WHERE id=$1', [id]);

    // Get media
    const { rows: media } = await query(
      'SELECT * FROM product_media WHERE product_id=$1 ORDER BY order_num', [id]
    );

    // Get makers
    const { rows: makers } = await query(`
      SELECT u.id, u.name, u.handle, u.avatar_url, u.avatar_color, u.headline, pm.role
      FROM product_makers pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.product_id=$1
      ORDER BY pm.created_at ASC`, [id]
    );

    res.json({ success:true, data: { ...rows[0], media, makers } });
  } catch (err) { next(err); }
};

// ── POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const {
      name, tagline, description, logo_emoji, website, demo_url, video_url,
      industry, countries, tags, launch_date, maker_ids = []
    } = req.body;

    // Check platform setting: manual_approval
    const { rows: settings } = await query(
      "SELECT value FROM platform_settings WHERE key='manual_approval'"
    );
    const manualApproval = settings[0]?.value !== 'false';
    const status = manualApproval ? 'pending' : 'live';

    const { rows } = await query(`
      INSERT INTO products (name, tagline, description, logo_emoji, website, demo_url, video_url,
        industry, countries, tags, launch_date, status, submitted_by,
        approved_by, approved_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [name, tagline, description||null, logo_emoji||'🚀', website||null, demo_url||null, video_url||null,
       industry, countries||[], tags||[], launch_date||null, status,
       req.user.id,
       !manualApproval ? req.user.id : null,
       !manualApproval ? new Date() : null]
    );

    const productId = rows[0].id;

    // Save the submitter as primary maker
    await query(
      'INSERT INTO product_makers (product_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [productId, req.user.id, 'Maker']
    );

    // Save tagged co-founders/makers
    if (Array.isArray(maker_ids) && maker_ids.length > 0) {
      for (const uid of maker_ids) {
        if (uid && uid !== req.user.id) {
          await query(
            'INSERT INTO product_makers (product_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [productId, uid, 'Co-founder']
          );
        }
      }
    }

    // Log
    await query(
      'INSERT INTO activity_log (actor_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'product.submit', 'products', productId]
    );

    // Update user product count
    await query('UPDATE users SET products_count = products_count + 1 WHERE id=$1', [req.user.id]);

    res.status(201).json({ success:true, data:rows[0] });
  } catch (err) { next(err); }
};

// ── PUT /api/products/:id  (owner or admin)
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM products WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    const product = rows[0];

    const isOwner = product.submitted_by === req.user.id;
    const isAdmin = ['admin','moderator'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success:false, message:'Forbidden' });

    const allowed = ['name','tagline','description','logo_emoji','website','demo_url','video_url','industry','countries','tags','launch_date'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const keys = Object.keys(updates).filter(k => allowed.includes(k));
    if (!keys.length) return res.status(400).json({ success:false, message:'No fields to update' });

    const setClauses = keys.map((k, i) => `${k} = $${i+2}`).join(', ');
    const { rows: updated } = await query(
      `UPDATE products SET ${setClauses} WHERE id=$1 RETURNING *`,
      [id, ...keys.map(k => updates[k])]
    );

    res.json({ success:true, data: updated[0] });
  } catch (err) { next(err); }
};

// ── DELETE /api/products/:id  (owner can delete pending; admin can delete any)
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: found } = await query('SELECT * FROM products WHERE id=$1', [id]);
    if (!found.length) return res.status(404).json({ success:false, message:'Not found' });
    const product = found[0];

    const isAdmin = ['admin','moderator'].includes(req.user.role);
    const isOwner = product.submitted_by === req.user.id;

    if (!isAdmin && !isOwner) return res.status(403).json({ success:false, message:'Forbidden' });
    if (isOwner && !isAdmin && product.status !== 'pending') {
      return res.status(403).json({ success:false, message:'You can only delete pending products' });
    }

    await query('DELETE FROM products WHERE id=$1', [id]);
    await query('UPDATE users SET products_count = GREATEST(products_count - 1, 0) WHERE id=$1', [product.submitted_by]);
    await query('INSERT INTO activity_log (actor_id, action, entity) VALUES ($1,$2,$3)',
      [req.user.id, 'product.delete', 'products']);
    res.json({ success:true, message:`${product.name} deleted` });
  } catch (err) { next(err); }
};

// ── POST /api/products/:id/upvote  (atomic transaction — no counter race condition)
const toggleUpvote = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      'SELECT id FROM upvotes WHERE user_id=$1 AND product_id=$2', [userId, id]
    );

    if (existing.length) {
      await client.query('DELETE FROM upvotes WHERE user_id=$1 AND product_id=$2', [userId, id]);
      await client.query('UPDATE products SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id=$1', [id]);
    } else {
      await client.query('INSERT INTO upvotes (user_id, product_id) VALUES ($1,$2)', [userId, id]);
      await client.query('UPDATE products SET upvotes_count = upvotes_count + 1 WHERE id=$1', [id]);
    }

    const { rows } = await client.query('SELECT upvotes_count FROM products WHERE id=$1', [id]);
    await client.query('COMMIT');
    res.json({ success:true, data: { voted: !existing.length, upvotes_count: rows[0]?.upvotes_count || 0 } });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

// ── POST /api/products/:id/bookmark
const toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { rows: existing } = await query(
      'SELECT id FROM bookmarks WHERE user_id=$1 AND product_id=$2', [userId, id]
    );

    if (existing.length) {
      await query('DELETE FROM bookmarks WHERE user_id=$1 AND product_id=$2', [userId, id]);
    } else {
      await query('INSERT INTO bookmarks (user_id, product_id) VALUES ($1,$2)', [userId, id]);
    }

    res.json({ success:true, data: { bookmarked: !existing.length } });
  } catch (err) { next(err); }
};

// ── POST /api/products/:id/waitlist
const joinWaitlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    await query(
      'INSERT INTO waitlist_signups (product_id, email, name, user_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [id, email, name || null, req.user?.id || null]
    );
    await query('UPDATE products SET waitlist_count = waitlist_count + 1 WHERE id=$1', [id]);

    res.json({ success:true, message:'Added to waitlist!' });
  } catch (err) { next(err); }
};

// ── POST /api/products/:id/discount-signup
const addDiscountSignup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    await query(
      'INSERT INTO discount_signups (product_id, email, name, user_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [id, email, name || null, req.user?.id || null]
    );

    res.json({ success:true, message:'Discount signup recorded!' });
  } catch (err) { next(err); }
};

// ── GET /api/products/:id/comments
const getComments = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT c.*, u.name AS author_name, u.handle AS author_handle,
             u.avatar_color, u.avatar_url, u.verified
      FROM comments c JOIN users u ON u.id = c.user_id
      WHERE c.product_id=$1 AND c.parent_id IS NULL
      ORDER BY c.created_at ASC`, [req.params.id]
    );
    res.json({ success:true, data:rows });
  } catch (err) { next(err); }
};

// ── POST /api/products/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { body, parent_id } = req.body;
    if (!body || !body.trim()) {
      return res.status(422).json({ success:false, message:'Comment body is required' });
    }
    if (body.trim().length > 2000) {
      return res.status(422).json({ success:false, message:'Comment must be 2000 characters or fewer' });
    }
    const { rows } = await query(
      'INSERT INTO comments (product_id, user_id, body, parent_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, req.user.id, body.trim(), parent_id||null]
    );
    res.status(201).json({ success:true, data:rows[0] });
  } catch (err) { next(err); }
};

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  toggleUpvote, toggleBookmark, joinWaitlist, addDiscountSignup, getComments, addComment,
};
