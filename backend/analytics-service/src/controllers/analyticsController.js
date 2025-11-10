const { recordSiteVisit } = require('../services/siteVisitService');
const { recordDowntimeStart, recordDowntimeRecovery } = require('../services/downtimeService');

const createSiteVisit = async (req, res, next) => {
  try {
    const { visitType, path, metadata } = req.body || {};

    if (!visitType) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'visitType is required',
      });
    }

    await recordSiteVisit({
      userId: req.userId,
      visitType,
      path,
      metadata,
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

const markDowntimeStart = async (req, res, next) => {
  try {
    const { serviceName, startedAt } = req.body || {};

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'serviceName is required',
      });
    }

    const record = await recordDowntimeStart(
      serviceName,
      startedAt ? new Date(startedAt) : undefined,
    );

    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    return next(error);
  }
};

const markDowntimeRecovery = async (req, res, next) => {
  try {
    const { serviceName, endedAt } = req.body || {};

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'serviceName is required',
      });
    }

    const record = await recordDowntimeRecovery(
      serviceName,
      endedAt ? new Date(endedAt) : undefined,
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Active downtime event not found for service.',
      });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSiteVisit,
  markDowntimeStart,
  markDowntimeRecovery,
};
