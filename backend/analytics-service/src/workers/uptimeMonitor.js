const cron = require('node-cron');
const {
  pingService,
  recordDowntimeStart,
  recordDowntimeRecovery,
} = require('../services/downtimeService');

const serviceStatus = new Map();

const parseMonitoredServices = () => {
  const raw = process.env.MONITORED_SERVICES;

  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((entry) => {
      const [serviceName, url] = entry.split('|').map((value) => value.trim());
      if (!serviceName || !url) {
        console.warn(`Invalid MONITORED_SERVICES entry: ${entry}`);
        return null;
      }

      return { serviceName, url };
    })
    .filter(Boolean);
};

const pollService = async ({ serviceName, url }) => {
  try {
    const isUp = await pingService(url, Number(process.env.SERVICE_HEALTH_TIMEOUT_MS) || 5000);
    const previousStatus = serviceStatus.get(serviceName) || 'unknown';

    if (!isUp && previousStatus !== 'down') {
      console.warn(`Service ${serviceName} is DOWN`);
      serviceStatus.set(serviceName, 'down');
      await recordDowntimeStart(serviceName);
      return;
    }

    if (isUp && previousStatus === 'down') {
      console.info(`Service ${serviceName} has RECOVERED`);
      serviceStatus.set(serviceName, 'up');
      await recordDowntimeRecovery(serviceName);
      return;
    }

    serviceStatus.set(serviceName, isUp ? 'up' : 'down');
  } catch (error) {
    console.error(`Failed to poll service ${serviceName}:`, error.message);
  }
};

const startUptimeMonitor = () => {
  const services = parseMonitoredServices();
  if (!services.length) {
    console.warn('No services configured for uptime monitoring. Set MONITORED_SERVICES to enable.');
    return;
  }

  const cronExpression = process.env.UPTIME_POLL_INTERVAL_CRON || '*/1 * * * *';

  const runPoll = async () => {
    await Promise.all(services.map((service) => pollService(service)));
  };

  cron.schedule(cronExpression, runPoll);

  runPoll().catch((error) => {
    console.error('Initial uptime poll failed:', error.message);
  });

  console.log(`Uptime monitor started for ${services.length} service(s) (cron: ${cronExpression})`);
};

module.exports = {
  startUptimeMonitor,
};
