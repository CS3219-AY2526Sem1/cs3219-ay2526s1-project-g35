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
  // Initialize status map from database to handle service restarts properly
  const openEvents = await getOpenDowntimeEvents();
  const openServicesSet = new Set(openEvents.map((event) => event.serviceName));

  // Check current status of each service
  for (const { serviceName, url } of services) {
    try {
      const isUp = await pingService(url, Number(process.env.SERVICE_HEALTH_TIMEOUT_MS) || 5000);

      if (openServicesSet.has(serviceName)) {
        // Service has an open downtime event
        if (isUp) {
          // Service is now up, close the existing downtime event
          console.info(`Service ${serviceName} recovered during initialization`);
          await recordDowntimeRecovery(serviceName);
          serviceStatus.set(serviceName, 'up');
        } else {
          // Service is still down, maintain the open event
          serviceStatus.set(serviceName, 'down');
        }
      } else {
        // No open downtime event
        if (isUp) {
          serviceStatus.set(serviceName, 'up');
        } else {
          // Service is down but has no open event, create one
          console.warn(`Service ${serviceName} is DOWN at initialization`);
          await recordDowntimeStart(serviceName);
          serviceStatus.set(serviceName, 'down');
        }
      }
    } catch (error) {
      console.error(`Failed to initialize status for ${serviceName}:`, error.message);
      // Set to unknown on initialization failure
      serviceStatus.set(serviceName, 'unknown');
    }
  }

  console.log('Service status initialized:', Array.from(serviceStatus.entries()));
};

const pollService = async ({ serviceName, url }) => {
  try {
    const isUp = await pingService(url, Number(process.env.SERVICE_HEALTH_TIMEOUT_MS) || 5000);
    const previousStatus = serviceStatus.get(serviceName);

    // Skip transitions from unknown state
    if (previousStatus === 'unknown') {
      serviceStatus.set(serviceName, isUp ? 'up' : 'down');
      if (!isUp) {
        console.warn(`Service ${serviceName} is DOWN (first known state)`);
        await recordDowntimeStart(serviceName);
      }
      return;
    }

    // Detect down transition (up → down OR first detection of down)
    if (!isUp && previousStatus !== 'down') {
      console.warn(`Service ${serviceName} is DOWN`);
      serviceStatus.set(serviceName, 'down');
      await recordDowntimeStart(serviceName);
      return;
    }

    // Detect recovery transition (down → up)
    if (isUp && previousStatus === 'down') {
      console.info(`Service ${serviceName} has RECOVERED`);
      serviceStatus.set(serviceName, 'up');
      await recordDowntimeRecovery(serviceName);
      return;
    }

    // No state change, update status anyway
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

  // Initialize service status from database and current state
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
