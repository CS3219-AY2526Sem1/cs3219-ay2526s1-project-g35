require('dotenv').config();
const http = require('http');
const app = require('./index');
const { connectDatabase } = require('./config/database');
const { startUptimeMonitor } = require('./workers/uptimeMonitor');

const PORT = process.env.PORT || 8005;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Analytics service running on port ${PORT}`);
    });

    server.on('close', () => {
      console.log('Analytics service shutting down');
    });

    if (process.env.ENABLE_UPTIME_MONITOR === 'true') {
      startUptimeMonitor();
    }

    const handleShutdown = () => {
      console.log('Graceful shutdown initiated');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (error) {
    console.error('Failed to start analytics service:', error);
    process.exit(1);
  }
};

startServer();
