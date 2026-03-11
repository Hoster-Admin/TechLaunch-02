const { validationResult } = require('express-validator');

// ── Validate express-validator results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Global error handler
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({ success:false, message:'Resource already exists' });
  }
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ success:false, message:'Referenced resource not found' });
  }

  const status  = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message;

  res.status(status).json({ success:false, message });
};

// ── 404 handler
const notFound = (req, res) => {
  res.status(404).json({ success:false, message:`Route ${req.method} ${req.path} not found` });
};

module.exports = { validate, errorHandler, notFound };
