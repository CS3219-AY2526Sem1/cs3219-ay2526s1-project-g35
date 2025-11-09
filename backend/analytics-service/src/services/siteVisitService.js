const SiteVisitEvent = require('../models/SiteVisitEvent');
const { buildTimeWindow, generateBucketKeys } = require('../utils/timeRange');

const recordSiteVisit = async ({ userId, visitType, path, metadata }) => {
  await SiteVisitEvent.create({
    userId,
    visitType,
    path,
    metadata,
  });
};

const getSiteVisitSeries = async ({ range, month }) => {
  const { start, end, groupByFormat, labelFormatter } = buildTimeWindow(range, month);

  const matchStage = {
    occurredAt: { $gte: start, $lte: end },
  };

  const groupStage = {
    _id: {
      $dateToString: {
        format: groupByFormat,
        date: '$occurredAt',
      },
    },
    count: { $sum: 1 },
    firstDate: { $min: '$occurredAt' },
  };

  const aggregation = await SiteVisitEvent.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { _id: 1 } },
  ]);

  const aggregationMap = new Map(aggregation.map((bucket) => [bucket._id, bucket.count]));

  const bucketKeys = generateBucketKeys(start, end, groupByFormat);

  const buckets = bucketKeys.map((key) => ({
    label: labelFormatter(key),
    value: aggregationMap.get(key) || 0,
    raw: key,
  }));

  const total = buckets.reduce((acc, bucket) => acc + bucket.value, 0);

  return {
    range,
    startDate: start,
    endDate: end,
    total,
    buckets,
  };
};

module.exports = {
  recordSiteVisit,
  getSiteVisitSeries,
};
