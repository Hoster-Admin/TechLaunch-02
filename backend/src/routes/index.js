const express = require('express');
const { body, query: qv } = require('express-validator');
const { authenticate, optionalAuth, requireAdmin, requireMod, requireEditor } = require('../middleware/auth');
const { validate } = require('../middleware/error');

// Controllers
const authCtrl    = require('../controllers/authController');
const productCtrl = require('../controllers/productController');
const entityCtrl  = require('../controllers/entityController');
const userCtrl    = require('../controllers/userController');
const adminCtrl   = require('../controllers/adminController');
const msgCtrl     = require('../controllers/messageController');

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

authRouter.post('/refresh',         authCtrl.refresh);
authRouter.post('/logout',          authCtrl.logout);
authRouter.get ('/me',              authenticate, authCtrl.getMe);
authRouter.get ('/activate/:token', authCtrl.checkActivationToken);
authRouter.post('/activate',        authCtrl.activateAccount);

// ══════════════════════════════════════════════════
// PRODUCTS  /api/products
// ══════════════════════════════════════════════════
const productsRouter = express.Router();

productsRouter.get ('/',          optionalAuth, productCtrl.getProducts);
productsRouter.get ('/:id',       optionalAuth, productCtrl.getProduct);
productsRouter.post('/',          authenticate,
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
productsRouter.post('/:id/upvote',    authenticate, productCtrl.toggleUpvote);
productsRouter.post('/:id/bookmark',  authenticate, productCtrl.toggleBookmark);
productsRouter.post('/:id/waitlist',  optionalAuth,
  [body('email').isEmail()], validate, productCtrl.joinWaitlist);
productsRouter.get ('/:id/comments',  optionalAuth, productCtrl.getComments);
productsRouter.post('/:id/comments',  authenticate,
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

// ══════════════════════════════════════════════════
// ADMIN  /api/admin  (all require authentication + admin/mod role)
// ══════════════════════════════════════════════════
const adminRouter = express.Router();
adminRouter.use(authenticate);

// Dashboard
adminRouter.get('/dashboard', requireMod, adminCtrl.getDashboard);

// Products
adminRouter.get   ('/products',               requireMod,    adminCtrl.adminGetProducts);
adminRouter.post  ('/products/:id/approve',   requireMod,    adminCtrl.approveProduct);
adminRouter.post  ('/products/:id/reject',    requireMod,    adminCtrl.rejectProduct);
adminRouter.post  ('/products/:id/featured',  requireEditor, adminCtrl.toggleFeatured);

// Users
adminRouter.get ('/users',           requireMod, adminCtrl.adminGetUsers);
adminRouter.get ('/users/:id',       requireMod, adminCtrl.adminGetUser);
adminRouter.post('/users/:id/verify',   requireMod, adminCtrl.verifyUser);
adminRouter.post('/users/:id/suspend',  requireMod, adminCtrl.suspendUser);
adminRouter.post('/users/:id/reinstate',requireMod, adminCtrl.reinstateUser);

// Entities
adminRouter.get ('/entities',        requireMod,    adminCtrl.adminGetEntities);
adminRouter.post('/entities/:id/verify', requireMod, adminCtrl.verifyEntity);

// Applications (read-only)
adminRouter.get('/applications', requireMod, adminCtrl.adminGetApplications);

// Settings
adminRouter.get('/settings',     requireAdmin, adminCtrl.getSettings);
adminRouter.put('/settings',     requireAdmin,
  [body().isObject()], adminCtrl.updateSettings);

// Team
adminRouter.get   ('/team',          requireAdmin, adminCtrl.getTeam);
adminRouter.post  ('/team',          requireAdmin,
  [body('email').isEmail(), body('role').notEmpty()], validate, adminCtrl.addTeamMember);
adminRouter.delete('/team/:id',      requireAdmin, adminCtrl.removeTeamMember);

// Reports
adminRouter.get('/reports', requireMod, adminCtrl.getReports);

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
      const { query: dbQuery } = require('../config/database');
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
// TAGS  /api/tags  (public — active tags + settings)
// ══════════════════════════════════════════════════
router.get('/tags', async (req, res, next) => {
  try {
    const { query: dbQuery } = require('../config/database');
    const { rows: tags } = await dbQuery(
      'SELECT id,name,category,color,text_color FROM tags WHERE is_active=true ORDER BY category,name');
    const { rows: settings } = await dbQuery(
      `SELECT key,value FROM platform_settings
       WHERE key IN ('tags_user_enabled','tags_entity_enabled','tags_product_enabled','tags_article_enabled','tags_role_enabled')`);
    const tagSettings = {};
    settings.forEach(r => { tagSettings[r.key] = r.value !== 'false'; });
    const grouped = {};
    tags.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    res.json({ success:true, data: grouped, settings: tagSettings });
  } catch(err){ next(err); }
});

// ── Mount all routers
router.use('/auth',        authRouter);
router.use('/products',    productsRouter);
router.use('/entities',    entitiesRouter);
router.use('/users',       usersRouter);
router.use('/messages',    messagesRouter);
router.use('/suggestions', suggestionsRouter);
router.use('/admin',       adminRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({ success:true, message:'Tech Launch API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
