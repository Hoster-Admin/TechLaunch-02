const { query } = require('../config/database');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

// ── GET /api/admin/products
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

// ── POST /api/admin/products/:id/approve
const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`
      UPDATE products SET status='live', approved_by=$1, approved_at=NOW()
      WHERE id=$2 RETURNING name, submitted_by`, [req.user.id, id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });

    await query('INSERT INTO activity_log (actor_id,action,entity,entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'product.approve', 'products', id]);

    await query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1,'product_approved','🎉 Product Approved!',$2,$3)`,
      [rows[0].submitted_by,
       `"${rows[0].name}" has been approved and is now live on Tech Launch MENA! 🚀`,
       `/products/${id}`]
    ).catch(() => {});

    // Send approval email
    const { rows: userRows } = await query('SELECT name, email FROM users WHERE id=$1', [rows[0].submitted_by]);
    if (userRows.length) {
      sendApprovalEmail({ name: userRows[0].name, email: userRows[0].email, productName: rows[0].name, productId: id });
    }

    res.json({ success:true, message:`${rows[0].name} approved` });
  } catch (err) { next(err); }
};

// ── POST /api/admin/products/:id/reject
const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { rows } = await query(`
      UPDATE products SET status='rejected', rejected_reason=$1
      WHERE id=$2 RETURNING name, submitted_by`, [reason||null, id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });

    await query('INSERT INTO activity_log (actor_id,action,entity,entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'product.reject', 'products', id]);

    const reasonText = reason ? ` Reason: ${reason}` : '';
    await query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1,'product_rejected','❌ Product Not Approved',$2,$3)`,
      [rows[0].submitted_by,
       `"${rows[0].name}" was not approved at this time.${reasonText} You can update and resubmit.`,
       `/settings`]
    ).catch(() => {});

    // Send rejection email
    const { rows: userRows } = await query('SELECT name, email FROM users WHERE id=$1', [rows[0].submitted_by]);
    if (userRows.length) {
      sendRejectionEmail({ name: userRows[0].name, email: userRows[0].email, productName: rows[0].name, reason });
    }

    res.json({ success:true, message:`${rows[0].name} rejected` });
  } catch (err) { next(err); }
};

// ── POST /api/admin/products/:id/featured
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

module.exports = { adminGetProducts, approveProduct, rejectProduct, toggleFeatured };
