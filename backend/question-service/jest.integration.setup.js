// Load environment variables from .env.docker if it exists
require('dotenv').config({ path: '.env.docker' });

// Override hostnames for local running (not in Docker)
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('question-service-mongodb')) {
  process.env.MONGODB_URI = process.env.MONGODB_URI.replace(
    'question-service-mongodb',
    'localhost',
  );
}

if (process.env.REDIS_HOST && process.env.REDIS_HOST === 'question-service-redis') {
  process.env.REDIS_HOST = 'localhost';
}
