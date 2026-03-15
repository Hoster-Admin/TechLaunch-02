const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query: qv } = require('express-validator');
const { authenticate, optionalAuth, requireAdmin, requireMod, requireEditor } = require('../middleware/auth');
const { validate } = require('../middleware/error');
const { query: dbQuery } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Write-endpoint rate limiters
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: { success:false, message:'Too many submissions. Please try again later.' },
});
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true, legacyHeaders: false,
  message: { success:false, message:'Too many comments. Please slow down.' },
});
const upvoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true, legacyHeaders: false,
  message: { success:false, message:'Too many votes. Please slow down.' },
});

// ── Multer config for post images
const postImgStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/posts');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadPostImg = multer({
  storage: postImgStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

// Controllers
const authCtrl      = require('../controllers/authController');
const productCtrl   = require('../controllers/productController');
const entityCtrl    = require('../controllers/entityController');
const userCtrl      = require('../controllers/userController');
const adminCtrl       = require('../controllers/adminController');
const adminProdCtrl   = require('../controllers/adminProductController');
const adminUserCtrl   = require('../controllers/adminUserController');
const adminEntityCtrl = require('../controllers/adminEntityController');
const msgCtrl         = require('../controllers/messageController');
const launcherCtrl    = require('../controllers/launcherController');
const communityCtrl   = require('../controllers/communityController');

const router = express.Router();

// ══════════════════════════════════════════════════
// AUTH  /api/auth
// ══════════════════════════════════════════════════
const authRouter = express.Router();

authRouter.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name required').isLength({ max:120 }),
    body('handle').trim().notEmpty().matches(/^[a-zA-Z0-9_]+$/).withMessage('Handle must be alphanumeric/underscore'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min:8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate, authCtrl.register
);

authRouter.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate, authCtrl.login
);

authRouter.post('/refresh',      authCtrl.refresh);
authRouter.post('/logout',       authCtrl.logout);
authRouter.get ('/me',           authenticate, authCtrl.getMe);
authRouter.post('/set-password', authCtrl.setPassword);

// ══════════════════════════════════════════════════
// PRODUCTS  /api/products
// ══════════════════════════════════════════════════
const productsRouter = express.Router();

productsRouter.get ('/',          optionalAuth, productCtrl.getProducts);
productsRouter.get ('/:id',       optionalAuth, productCtrl.getProduct);
productsRouter.post('/',          authenticate, writeLimiter,
  [
    body('name').trim().notEmpty().isLength({ max:120 }),
    body('tagline').trim().notEmpty().isLength({ max:255 }),
    body('industry').trim().notEmpty(),
    body('countries').isArray({ min:1 }).withMessage('Select at least one country'),
  ],
  validate, productCtrl.createProduct
);
productsRouter.put ('/:id',       authenticate, productCtrl.updateProduct);
productsRouter.delete('/:id',     authenticate, productCtrl.deleteProduct);
productsRouter.post('/:id/upvote',    authenticate, upvoteLimiter, productCtrl.toggleUpvote);
productsRouter.post('/:id/bookmark',  authenticate, productCtrl.toggleBookmark);
productsRouter.post('/:id/waitlist',  optionalAuth,
  [body('email').isEmail()], validate, productCtrl.joinWaitlist);
productsRouter.post('/:id/discount-signup', optionalAuth,
  [body('email').isEmail()], validate, productCtrl.addDiscountSignup);
productsRouter.get ('/:id/comments',  optionalAuth, productCtrl.getComments);
productsRouter.post('/:id/comments',  authenticate, commentLimiter,
  [body('body').trim().notEmpty().isLength({ max:2000 })], validate, productCtrl.addComment);

// ══════════════════════════════════════════════════
// ENTITIES  /api/entities
// ══════════════════════════════════════════════════
const entitiesRouter = express.Router();

entitiesRouter.get ('/',            entityCtrl.getEntities);
entitiesRouter.post('/',            authenticate,
  [body('name').trim().notEmpty(), body('type').trim().notEmpty()], validate, entityCtrl.createEntity);
entitiesRouter.get ('/:slug',       entityCtrl.getEntity);
entitiesRouter.post('/:id/apply',   authenticate,
  [body('startup_name').trim().notEmpty()], validate, entityCtrl.applyToAccelerator);
entitiesRouter.post('/:id/pitch',   authenticate,
  [body('ask_amount').trim().notEmpty()], validate, entityCtrl.pitchToInvestor);

// ══════════════════════════════════════════════════
// USERS  /api/users
// ══════════════════════════════════════════════════
const usersRouter = express.Router();

usersRouter.get ('/',             optionalAuth, userCtrl.searchUsers);
usersRouter.get ('/people',       optionalAuth, userCtrl.getPeople);
usersRouter.get ('/me/bookmarks',         authenticate, userCtrl.getBookmarks);
usersRouter.get ('/me/products',          authenticate, userCtrl.getMyProducts);
usersRouter.get ('/me/notifications',     authenticate, userCtrl.getNotifications);
usersRouter.put ('/me/notifications/read',authenticate, userCtrl.markNotificationsRead);
usersRouter.put ('/me',                   authenticate,
  [body('name').optional().trim().notEmpty()], validate, userCtrl.updateProfile);
usersRouter.post('/me/change-password',   authenticate,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min:8 }),
  ], validate, userCtrl.changePassword);
usersRouter.get ('/:handle/followers', optionalAuth, userCtrl.getUserFollowers);
usersRouter.get ('/:handle/following', optionalAuth, userCtrl.getUserFollowing);
usersRouter.get ('/:handle/upvoted',  optionalAuth, userCtrl.getUserUpvoted);
usersRouter.get ('/:handle/activity', optionalAuth, userCtrl.getUserActivity);
usersRouter.get ('/:handle',    optionalAuth, userCtrl.getProfile);
usersRouter.post('/:id/follow', authenticate, userCtrl.toggleFollow);

// Entity association
usersRouter.put('/me/entity', authenticate,
  [body('entity_name').trim()],
  validate,
  async (req, res, next) => {
    try {
      const { entity_name } = req.body;
      if (!entity_name) {
        await dbQuery('UPDATE users SET entity_id=NULL WHERE id=$1', [req.user.id]);
        return res.json({ success:true, data:null });
      }
      const { rows } = await dbQuery('SELECT id,name,type,slug FROM entities WHERE LOWER(name)=LOWER($1) LIMIT 1', [entity_name]);
      if (!rows.length) return res.status(404).json({ success:false, message:'Entity not found' });
      await dbQuery('UPDATE users SET entity_id=$1 WHERE id=$2', [rows[0].id, req.user.id]);
      res.json({ success:true, data:rows[0] });
    } catch(err){ next(err); }
  }
);

usersRouter.get('/entity-members/all', optionalAuth, async (req, res, next) => {
  try {
    const { rows } = await dbQuery(
      `SELECT u.id, u.name, u.handle, u.avatar_color, u.verified,
              e.name AS entity_name, e.type AS entity_type
       FROM users u
       JOIN entities e ON e.id = u.entity_id
       WHERE u.entity_id IS NOT NULL`
    );
    res.json({ success:true, data:rows });
  } catch(err){ next(err); }
});

// ══════════════════════════════════════════════════
// ADMIN  /api/admin  (all require authentication + admin/mod role)
// ══════════════════════════════════════════════════
const adminRouter = express.Router();
adminRouter.use(authenticate);

// Dashboard
adminRouter.get('/dashboard', requireMod, adminCtrl.getDashboard);

// Products
adminRouter.get   ('/products',               requireMod,    adminProdCtrl.adminGetProducts);
adminRouter.post  ('/products/:id/approve',   requireMod,    adminProdCtrl.approveProduct);
adminRouter.post  ('/products/:id/reject',    requireMod,    adminProdCtrl.rejectProduct);
adminRouter.post  ('/products/:id/featured',  requireEditor, adminProdCtrl.toggleFeatured);

// Users
adminRouter.get ('/users',                requireMod,   adminUserCtrl.adminGetUsers);
adminRouter.post('/users/invite',         requireAdmin, adminUserCtrl.inviteUser);
adminRouter.get ('/users/:id',            requireMod,   adminUserCtrl.adminGetUser);
adminRouter.post('/users/:id/verify',     requireMod,   adminUserCtrl.verifyUser);
adminRouter.post('/users/:id/suspend',    requireMod,   adminUserCtrl.suspendUser);
adminRouter.post('/users/:id/reinstate',  requireMod,   adminUserCtrl.reinstateUser);

// Entities
adminRouter.get ('/entities',        requireMod,    adminEntityCtrl.adminGetEntities);
adminRouter.post('/entities/:id/verify', requireMod, adminEntityCtrl.verifyEntity);

// Applications (read-only)
adminRouter.get('/applications', requireMod, adminEntityCtrl.adminGetApplications);

// Settings
adminRouter.get('/settings',     requireAdmin, adminCtrl.getSettings);
adminRouter.put('/settings',     requireAdmin,
  [body().isObject()], adminCtrl.updateSettings);

// Community Tags (admin-controlled)
adminRouter.get   ('/community-tags',     requireMod,   communityCtrl.getTags);
adminRouter.post  ('/community-tags',     requireMod,   communityCtrl.createTag);
adminRouter.delete('/community-tags/:id', requireMod,   communityCtrl.deleteTag);

// Team
adminRouter.get   ('/team',          requireAdmin, adminCtrl.getTeam);
adminRouter.post  ('/team',          requireAdmin,
  [body('email').isEmail(), body('role').notEmpty()], validate, adminCtrl.addTeamMember);
adminRouter.delete('/team/:id',      requireAdmin, adminCtrl.removeTeamMember);

// Reports
adminRouter.get('/reports', requireMod, adminCtrl.getReports);

// Email signups (waitlist + discount)
adminRouter.get('/email-signups', requireMod, adminCtrl.getEmailSignups);

// Platform Posts (My Profile)
adminRouter.get   ('/posts',          requireMod, adminCtrl.getPlatformPosts);
adminRouter.post  ('/posts',          requireMod,
  [body('type').notEmpty(), body('body').trim().notEmpty()], validate, adminCtrl.createPlatformPost);
adminRouter.delete('/posts/:id',      requireMod, adminCtrl.deletePlatformPost);

// ══════════════════════════════════════════════════
// SUGGESTIONS  /api/suggestions
// ══════════════════════════════════════════════════
const suggestionsRouter = express.Router();

suggestionsRouter.post('/', authenticate,
  [body('body').trim().notEmpty().isLength({ max: 5000 }).withMessage('Suggestion body required')],
  validate,
  async (req, res, next) => {
    try {
      const result = await dbQuery(
        'INSERT INTO suggestions (user_id, body) VALUES ($1, $2) RETURNING *',
        [req.user.id, req.body.body]
      );
      res.status(201).json({ success: true, data: { suggestion: result.rows[0] } });
    } catch (err) { next(err); }
  }
);

// Admin suggestions routes
adminRouter.get('/suggestions',             requireMod, adminCtrl.getSuggestions);
adminRouter.post('/suggestions/:id/respond',requireMod, adminCtrl.respondSuggestion);

// ══════════════════════════════════════════════════
// MESSAGES  /api/messages
// ══════════════════════════════════════════════════
const messagesRouter = express.Router();
messagesRouter.use(authenticate);
messagesRouter.get('/unread-count',  msgCtrl.getUnreadCount);
messagesRouter.get('/threads',       msgCtrl.getThreads);
messagesRouter.get('/:handle',       msgCtrl.getThread);
messagesRouter.post('/:handle',
  [body('body').trim().notEmpty().isLength({ max:2000 })], validate,
  msgCtrl.sendMessage);

// ══════════════════════════════════════════════════
// APPLICATIONS  /api/applications
// ══════════════════════════════════════════════════
const applyRouter = express.Router();
applyRouter.post('/',
  authenticate,
  [
    body('entity_name').trim().notEmpty().withMessage('Entity name required'),
    body('startup_name').trim().notEmpty().withMessage('Startup name required'),
    body('stage').trim().notEmpty().withMessage('Stage required'),
    body('pitch').trim().notEmpty().isLength({ max:2000 }).withMessage('Pitch required (max 2000 chars)'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { entity_name, startup_name, stage, pitch } = req.body;
      const { rows: ents } = await dbQuery('SELECT id FROM entities WHERE LOWER(name)=LOWER($1) LIMIT 1', [entity_name]);
      const entity_id = ents[0]?.id || null;
      const { rows } = await dbQuery(
        `INSERT INTO accelerator_applications (applicant_id, entity_id, startup_name, stage, pitch, notes, status)
         VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING id`,
        [req.user.id, entity_id, startup_name, stage, pitch, entity_name]
      );
      res.json({ success:true, data:{ id: rows[0].id } });
    } catch(err){ next(err); }
  }
);

// ══════════════════════════════════════════════════
// PITCHES  /api/pitches
// ══════════════════════════════════════════════════
const pitchRouter = express.Router();
pitchRouter.post('/',
  authenticate,
  [
    body('entity_name').trim().notEmpty().withMessage('Entity name required'),
    body('ask_amount').trim().notEmpty().withMessage('Ask amount required'),
    body('description').trim().notEmpty().isLength({ max:2000 }).withMessage('Description required (max 2000 chars)'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { entity_name, ask_amount, pitch_deck, description } = req.body;
      const { rows: ents } = await dbQuery('SELECT id FROM entities WHERE LOWER(name)=LOWER($1) LIMIT 1', [entity_name]);
      const investor_id = ents[0]?.id || null;
      const { rows } = await dbQuery(
        `INSERT INTO investor_pitches (founder_id, investor_id, ask_amount, pitch_deck, description, status)
         VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id`,
        [req.user.id, investor_id, ask_amount, pitch_deck || null, description]
      );
      res.json({ success:true, data:{ id: rows[0].id } });
    } catch(err){ next(err); }
  }
);

// ══════════════════════════════════════════════════
// LAUNCHER POSTS  /api/launcher
// ══════════════════════════════════════════════════
const launcherRouter = express.Router();
launcherRouter.get ('/',                       optionalAuth, launcherCtrl.getPosts);
launcherRouter.post('/',                       authenticate, writeLimiter,
  [body('content').trim().notEmpty().isLength({ max:2000 })],
  validate, launcherCtrl.createPost);
launcherRouter.get ('/:id',                    optionalAuth, launcherCtrl.getPost);
launcherRouter.post('/:id/like',               authenticate, upvoteLimiter, launcherCtrl.toggleLike);
launcherRouter.delete('/:id',                  authenticate, launcherCtrl.deletePost);
launcherRouter.get ('/:id/comments',           optionalAuth, launcherCtrl.getComments);
launcherRouter.post('/:id/comments',           authenticate, commentLimiter,
  [body('body').trim().notEmpty().isLength({ max:2000 })],
  validate, launcherCtrl.addComment);
launcherRouter.post('/comments/:id/like',      authenticate, launcherCtrl.toggleCommentLike);

// ══════════════════════════════════════════════════
// UPLOAD  /api/upload
// ══════════════════════════════════════════════════
const uploadRouter = express.Router();
uploadRouter.post('/post-image', authenticate, uploadPostImg.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = `/uploads/posts/${req.file.filename}`;
  res.json({ success: true, data: { url } });
});

// ── Mount all routers
router.use('/upload',       uploadRouter);
router.use('/auth',         authRouter);
router.use('/products',     productsRouter);
router.use('/entities',     entitiesRouter);
router.use('/users',        usersRouter);
router.use('/messages',     messagesRouter);
router.use('/launcher',     launcherRouter);
router.use('/suggestions',  suggestionsRouter);
router.use('/admin',        adminRouter);
router.use('/applications', applyRouter);
router.use('/pitches',      pitchRouter);

// COMMUNITY POSTS & TAGS
const communityRouter = express.Router();
communityRouter.get('/tags',             communityCtrl.getTags);
communityRouter.get('/my-drafts',        authenticate, communityCtrl.getMyDrafts);
communityRouter.get('/:id',              optionalAuth, communityCtrl.getPost);
communityRouter.get('/',                 optionalAuth, communityCtrl.getPosts);
communityRouter.post('/',                authenticate, communityCtrl.createPost);
communityRouter.put('/:id',              authenticate, communityCtrl.updatePost);
communityRouter.delete('/:id',           authenticate, communityCtrl.deletePost);
router.use('/community-posts',  communityRouter);

// ── Stats endpoints (cached 5 min)
const { cacheMiddleware } = require('../utils/cache');

router.get('/stats/summary', cacheMiddleware(300, 'stats'), async (req, res, next) => {
  try {
    const [products, founders, countries, accelerators] = await Promise.all([
      dbQuery(`SELECT COUNT(*)::int AS c FROM products WHERE status='live'`),
      dbQuery(`SELECT COUNT(*)::int AS c FROM users WHERE role='user' AND status='active'`),
      dbQuery(`SELECT COUNT(DISTINCT c)::int AS c FROM (SELECT UNNEST(countries) AS c FROM products WHERE status='live' AND countries IS NOT NULL) sub`),
      dbQuery(`SELECT COUNT(*)::int AS c FROM entities WHERE type='accelerator' AND status='approved'`),
    ]);
    res.json({ success:true, data:{
      products:     products.rows[0].c,
      founders:     founders.rows[0].c,
      countries:    countries.rows[0].c,
      accelerators: accelerators.rows[0].c,
    }});
  } catch(err){ next(err); }
});

router.get('/stats/directory', cacheMiddleware(300, 'stats'), async (req, res, next) => {
  try {
    const [industryRows, countryRows] = await Promise.all([
      dbQuery(`SELECT industry AS name, COUNT(*)::int AS count FROM products WHERE status='live' AND industry IS NOT NULL GROUP BY industry ORDER BY count DESC`),
      dbQuery(`SELECT UNNEST(countries) AS code, COUNT(*)::int AS count FROM products WHERE status='live' AND countries IS NOT NULL GROUP BY code ORDER BY count DESC`),
    ]);
    res.json({ success:true, data:{ industries: industryRows.rows, countries: countryRows.rows }});
  } catch(err){ next(err); }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ success:true, message:'Tech Launch API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
