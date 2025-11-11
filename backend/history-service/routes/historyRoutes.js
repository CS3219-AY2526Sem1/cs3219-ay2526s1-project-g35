const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/historyController');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/jwtAuth');
const { schemas, validateBody, validateQuery, sanitizeInput } = require('../middleware/validation');

router.use(sanitizeInput);

router.post('/', validateBody(schemas.createHistory), HistoryController.createHistory);
router.post('/history', validateBody(schemas.createHistory), HistoryController.createHistory);

router.get(
  '/',
  (req, res, next) => {
    console.log('GET / route hit - Path:', req.path, 'Query:', req.query);
    next();
  },
  verifyToken,
  validateQuery(schemas.getUserHistory),
  HistoryController.getUserHistory
);
router.get(
  '/history',
  (req, res, next) => {
    console.log('GET /history route hit - Path:', req.path, 'Query:', req.query);
    next();
  },
  verifyToken,
  validateQuery(schemas.getUserHistory),
  HistoryController.getUserHistory
);

router.get('/admin/stats', verifyToken, requireAdmin, HistoryController.getAdminStats);

router.get(
  '/admin/stats/category',
  verifyToken,
  requireAdmin,
  HistoryController.getStatsByCategory
);

router.get(
  '/admin/stats/difficulty',
  verifyToken,
  requireAdmin,
  HistoryController.getStatsByDifficulty
);

router.get('/admin/stats/user', verifyToken, requireAdmin, HistoryController.getStatsByUser);

router.patch(
  '/:historyId/status',
  verifyToken,
  validateBody(schemas.updateHistoryStatus),
  HistoryController.updateHistoryStatus
);

router.patch(
  '/session/:sessionId/status',
  verifyToken,
  validateBody(schemas.updateHistoryStatus),
  HistoryController.updateHistoryBySession
);

module.exports = router;
