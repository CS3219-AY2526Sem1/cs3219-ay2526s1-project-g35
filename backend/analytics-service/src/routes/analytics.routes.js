const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/jwtAuth');
const analyticsController = require('../controllers/analyticsController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

const router = express.Router();

router.post('/visits', verifyToken, analyticsController.createSiteVisit);

router.post('/downtime/start', verifyToken, verifyAdmin, analyticsController.markDowntimeStart);
router.post(
  '/downtime/recover',
  verifyToken,
  verifyAdmin,
  analyticsController.markDowntimeRecovery,
);

router.get('/admin/visits', verifyToken, verifyAdmin, adminAnalyticsController.fetchSiteVisits);
router.get('/admin/downtime', verifyToken, verifyAdmin, adminAnalyticsController.fetchDowntime);

module.exports = router;
