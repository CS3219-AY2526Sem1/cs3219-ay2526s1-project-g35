import http from 'http';
import index from './index.js';
import 'dotenv/config';
import { connectToDB } from './model/user-repository.js';
import { baseRedisService } from './services/redis/redis-base-service.js';
import { initializeSecrets } from './config/secretManager.js';

const port = process.env.PORT || 8000;

const server = http.createServer(index);

// Initialize secrets, database and Redis connections
const initializeServices = async () => {
  try {
    if (process.env.USE_SECRET_MANAGER === 'true') {
      console.log('USE_SECRET_MANAGER is enabled, loading secrets...');
      await initializeSecrets();
      
      const { emailService } = await import('./services/email-service.js');
      emailService.reinitialize();
    } else {
      console.log('USE_SECRET_MANAGER is not enabled, skipping secret loading');
    }

    await Promise.all([connectToDB(), baseRedisService.connect()]);

    console.log('MongoDB Connected!');
    console.log('Redis Service initialized!');

    server.listen(port);
    console.log('User service server listening on http://localhost:' + port);
  } catch (err) {
    console.error('Failed to connect to services');
    console.error(err);

    server.listen(port);
    console.log(
      'User service server listening on http://localhost:' +
        port +
        ' (Some services may not be available)',
    );
  }
};

initializeServices();
