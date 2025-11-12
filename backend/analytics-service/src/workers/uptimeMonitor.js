const cron = require('node-cron');
const {
  pingService,
  recordDowntimeStart,
  recordDowntimeRecovery,
  getOpenDowntimeEvents,
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

const initializeServiceStatus = async (services) => {
  // Query database for open downtime events to restore state across restarts
  const openEvents = await getOpenDowntimeEvents();
  const openServicesSet = new Set(openEvents.map((event) => event.serviceName));

  console.log(`Found ${openEvents.length} open downtime events during initialization`);

  // Check current health status of each monitored service
  for (const { serviceName, url } of services) {
    try {
      const isUp = await pingService(url, Number(process.env.SERVICE_HEALTH_TIMEOUT_MS) || 5000);

      if (openServicesSet.has(serviceName)) {
        // Service has an open downtime event in database
        if (isUp) {
          // Service recovered while analytics service was offline
          console.info(`Service ${serviceName} recovered during initialization`);
          await recordDowntimeRecovery(serviceName);
          serviceStatus.set(serviceName, 'up');
        } else {
          // Service is still down, continue tracking existing downtime event
          serviceStatus.set(serviceName, 'down');
          console.warn(`Service ${serviceName} is still DOWN from previous session`);
        }
      } else {
        // No open downtime event exists for this service
        if (isUp) {
          // Service is up, normal state
          serviceStatus.set(serviceName, 'up');
        } else {
          // Service is down but no open event exists - create new downtime event
          console.warn(`Service ${serviceName} is DOWN at initialization`);
          await recordDowntimeStart(serviceName);
          serviceStatus.set(serviceName, 'down');
        }
      }
    } catch (error) {
      console.error(`Failed to initialize status for ${serviceName}:`, error.message);
      serviceStatus.set(serviceName, 'unknown');
    }
  }

  console.log('Service status initialized:', Array.from(serviceStatus.entries()));
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

const startUptimeMonitor = async () => {
  const services = parseMonitoredServices();
  if (!services.length) {
    console.warn('No services configured for uptime monitoring. Set MONITORED_SERVICES to enable.');
    return;
  }

  // Initialize service status from database before starting polling
  await initializeServiceStatus(services);

  const cronExpression = process.env.UPTIME_POLL_INTERVAL_CRON || '*/5 * * * *';

  const runPoll = async () => {
    await Promise.all(services.map((service) => pollService(service)));
  };

  cron.schedule(cronExpression, runPoll);

  console.log(`Uptime monitor started for ${services.length} service(s) (cron: ${cronExpression})`);
};

module.exports = {
  startUptimeMonitor,
};
