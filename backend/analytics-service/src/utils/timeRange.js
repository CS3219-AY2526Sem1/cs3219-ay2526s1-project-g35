const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
};

const parseMonthParam = (month) => {
  if (!month) {
    throw new Error('month query parameter is required for custom range');
  }

  const match = month.match(/^(\d{4})-(0[1-9]|1[0-2])$/);

  if (!match) {
    throw new Error('month must be provided in YYYY-MM format');
  }

  const [year, monthIndex] = [Number(match[1]), Number(match[2]) - 1];
  const start = startOfDay(new Date(Date.UTC(year, monthIndex, 1)));
  const nextMonth = addMonths(start, 1);
  const end = endOfDay(new Date(nextMonth.getTime() - 1));

  return { start, end };
};

const formatBucketKey = (date, format) => {
  const d = new Date(date);

  if (format === '%Y-%m') {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
};

const generateBucketKeys = (start, end, format) => {
  const keys = [];

  if (format === '%Y-%m') {
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

    while (cursor <= endCursor) {
      keys.push(formatBucketKey(cursor, format));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return keys;
  }

  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cursor <= endCursor) {
    keys.push(formatBucketKey(cursor, format));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
};

const buildTimeWindow = (range, month) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  let start;
  let end;
  let groupByFormat;
  let labelFormatter;

  switch (range) {
    case 'week': {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
      start = sevenDaysAgo;
      end = endOfDay(now);
      groupByFormat = '%Y-%m-%d';
      labelFormatter = (label) => label;
      break;
    }
    case 'month': {
      const thirtyDaysAgo = new Date(todayStart);
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
      start = thirtyDaysAgo;
      end = endOfDay(now);
      groupByFormat = '%Y-%m-%d';
      labelFormatter = (label) => label;
      break;
    }
    case 'year': {
      const oneYearAgo = new Date(todayStart);
      oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
      start = oneYearAgo;
      end = endOfDay(now);
      groupByFormat = '%Y-%m';
      labelFormatter = (label) => label;
      break;
    }
    case 'custom': {
      const { start: monthStart, end: monthEnd } = parseMonthParam(month);
      start = monthStart;
      end = monthEnd;
      groupByFormat = '%Y-%m-%d';
      labelFormatter = (label) => label;
      break;
    }
    default:
      throw new Error('Invalid range parameter. Use week, month, year, or custom.');
  }

  return {
    start,
    end,
    groupByFormat,
    labelFormatter,
  };
};

module.exports = {
  buildTimeWindow,
  generateBucketKeys,
  formatBucketKey,
};
