require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const routes              = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Trust proxy (needed for rate-limiting behind Replit reverse proxy)
app.set('trust proxy', 1);

// ── Security headers
app.use(helmet({
  frameguard: false,                                    // allow iframe embedding (Replit preview, partner embeds)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc:      ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc:     ["'self'", 'https:', 'data:'],
      connectSrc:  ["'self'", 'https:', 'wss:'],
      mediaSrc:    ["'self'", 'https:'],
      frameSrc:        ["'self'", 'https:'],
      objectSrc:       ["'none'"],
      frameAncestors:  ["'self'", 'https:'],
    },
  },
}));

// ── CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.replit.dev') || origin.endsWith('.replit.app') || origin.endsWith('.tlmena.com')) {
      return cb(null, true);
    }
    cb(null, true);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success:false, message:'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Auth routes get stricter limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success:false, message:'Too many login attempts' },
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API routes
app.use('/api', routes);

// ── Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../../frontend/build');
  app.use(express.static(clientBuild, {
    maxAge: '1y',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ── Error handling
app.use(notFound);
app.use(errorHandler);

// ── Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Tech Launch API running on port ${PORT}`);
  console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
