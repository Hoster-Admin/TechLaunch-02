require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const cookieParser        = require('cookie-parser');
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
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

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

// ── Sitemap
const { query: dbQuery } = require('./config/database');
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await dbQuery(`SELECT id, updated_at FROM products WHERE status = 'live'`);
    const productUrls = products.rows.map(p => `
  <url>
    <loc>https://tlmena.com/products/${p.id}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const staticUrls = [
      '/', '/products', '/directory', '/launcher', '/accelerators',
      '/list/startup', '/list/accelerator', '/list/investor', '/list/venture',
      '/about', '/contact', '/articles',
    ].map(path => `
  <url>
    <loc>https://tlmena.com${path}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${productUrls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('<?xml version="1.0"?><error>Failed to generate sitemap</error>');
  }
});

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

// ── Start server only when run directly (not when imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Tech Launch API running on port ${PORT}`);
    console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
