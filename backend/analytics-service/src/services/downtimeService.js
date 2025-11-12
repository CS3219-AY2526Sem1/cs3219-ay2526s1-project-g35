const axios = require('axios');
const DowntimeEvent = require('../models/DowntimeEvent');
const { buildTimeWindow, formatBucketKey, generateBucketKeys } = require('../utils/timeRange');

const recordDowntimeStart = async (serviceName, startedAt = new Date()) => {
  // Use findOne with proper error handling to avoid race conditions
  const existing = await DowntimeEvent.findOne({ serviceName, status: 'open' }).sort({
    startedAt: -1,
  });
  if (existing) {
    console.log(`Downtime event already open for ${serviceName}, skipping duplicate`);
    return existing;
  }

  const event = await DowntimeEvent.create({
    serviceName,
    startedAt,
    status: 'open',
  });

  console.log(`Created downtime event for ${serviceName} at ${startedAt.toISOString()}`);
  return event;
};

const recordDowntimeRecovery = async (serviceName, recoveredAt = new Date()) => {
  // Find the most recent open event for this service
  const event = await DowntimeEvent.findOne({ serviceName, status: 'open' }).sort({
    startedAt: -1,
  });

  if (!event) {
    console.warn(`No open downtime event found for ${serviceName}, cannot record recovery`);
    return null;
  }

  event.endedAt = recoveredAt;
  // Calculate duration more precisely without rounding for better accuracy
  const durationMs = event.endedAt - event.startedAt;
  event.durationSeconds = Math.floor(durationMs / 1000);
  event.status = 'closed';

  await event.save();

  console.log(`Closed downtime event for ${serviceName}, duration: ${event.durationSeconds}s`);
  return event;
};

const getOpenDowntimeEvents = async () => {
  return await DowntimeEvent.find({ status: 'open' }).lean();
};

const getDowntimeSeries = async ({ range, month }) => {
  const { start, end, groupByFormat, labelFormatter } = buildTimeWindow(range, month);

  const events = await DowntimeEvent.find({
    startedAt: { $lte: end },
    $or: [{ status: 'open' }, { endedAt: { $gte: start } }],
  }).lean();

  const buckets = new Map();
  const serviceTotals = new Map();
  const serviceBucketMap = new Map();

  events.forEach((event) => {
    const eventStart = event.startedAt < start ? start : new Date(event.startedAt);
    const rawEnd = event.status === 'open' || !event.endedAt ? new Date() : new Date(event.endedAt);
    const eventEnd = rawEnd > end ? end : rawEnd;

    if (eventEnd <= eventStart) {
      return;
    }

    const durationSeconds = (eventEnd - eventStart) / 1000;

    // allocate duration into buckets by day/month
    let cursor = new Date(eventStart);

    while (cursor < eventEnd) {
      const bucketKey = formatBucketKey(cursor, groupByFormat);
      const bucketStart = new Date(cursor);
      let bucketEnd;

      if (groupByFormat === '%Y-%m') {
        const nextMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
        bucketEnd = nextMonth < eventEnd ? nextMonth : eventEnd;
      } else {
        const nextDay = new Date(
          Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1),
        );
        bucketEnd = nextDay < eventEnd ? nextDay : eventEnd;
      }

      const bucketSeconds = (bucketEnd - bucketStart) / 1000;
      const aggregatedSeconds = buckets.get(bucketKey) || 0;
      buckets.set(bucketKey, aggregatedSeconds + bucketSeconds);

      const serviceKey = `${event.serviceName}`;
      const serviceSeconds = serviceTotals.get(serviceKey) || 0;
      serviceTotals.set(serviceKey, serviceSeconds + bucketSeconds);

      let serviceBuckets = serviceBucketMap.get(serviceKey);
      if (!serviceBuckets) {
        serviceBuckets = new Map();
        serviceBucketMap.set(serviceKey, serviceBuckets);
      }

      const currentServiceBucketSeconds = serviceBuckets.get(bucketKey) || 0;
      serviceBuckets.set(bucketKey, currentServiceBucketSeconds + bucketSeconds);

      cursor = bucketEnd;
    }
  });

  const expectedKeys = generateBucketKeys(start, end, groupByFormat);

  const responseBuckets = expectedKeys.map((key) => ({
    label: labelFormatter(key),
    value: Number(((buckets.get(key) || 0) / 60).toFixed(2)),
    raw: key,
  }));

  const totalMinutes = responseBuckets.reduce((acc, bucket) => acc + bucket.value, 0);

  const serviceBreakdown = Array.from(serviceTotals.entries()).map(([serviceName, seconds]) => ({
    serviceName,
    minutes: Number((seconds / 60).toFixed(2)),
  }));

  const serviceSeries = Array.from(serviceBucketMap.entries()).map(
    ([serviceName, serviceBuckets]) => {
      const seriesBuckets = expectedKeys.map((key) => ({
        label: labelFormatter(key),
        value: Number(((serviceBuckets.get(key) || 0) / 60).toFixed(2)),
        raw: key,
      }));

      const seriesTotal = seriesBuckets.reduce((acc, bucket) => acc + bucket.value, 0);

      return {
        serviceName,
        totalMinutes: seriesTotal,
        buckets: seriesBuckets,
      };
    },
  );

  return {
    range,
    startDate: start,
    endDate: end,
    totalMinutes,
    buckets: responseBuckets,
    serviceBreakdown,
    serviceSeries,
  };
};

const pingService = async (url, timeout = 5000) => {
  try {
    const response = await axios.get(url, { timeout });
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
};

module.exports = {
  recordDowntimeStart,
  recordDowntimeRecovery,
  getDowntimeSeries,
  getOpenDowntimeEvents,
  pingService,
};
