const { getSiteVisitSeries } = require('../services/siteVisitService');
const { getDowntimeSeries } = require('../services/downtimeService');

const extractRangeParams = (req) => {
  const range = (req.query.range || 'week').toLowerCase();
  const month = req.query.month;
  return { range, month };
};

const fetchSiteVisits = async (req, res, next) => {
  try {
    const { range, month } = extractRangeParams(req);
    const data = await getSiteVisitSeries({ range, month });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message && error.message.includes('range')) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    if (error.message && error.message.includes('month')) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    return next(error);
  }
};

const fetchDowntime = async (req, res, next) => {
  try {
    const { range, month } = extractRangeParams(req);
    const data = await getDowntimeSeries({ range, month });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message && error.message.includes('range')) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    if (error.message && error.message.includes('month')) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    return next(error);
  }
};

module.exports = {
  fetchSiteVisits,
  fetchDowntime,
};
