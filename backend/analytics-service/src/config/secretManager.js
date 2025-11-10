const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();

async function loadSecrets() {
  if (process.env.USE_SECRET_MANAGER !== 'true') {
    console.log('Secret Manager disabled, using environment variables');
    return;
  }

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    console.warn('GCP_PROJECT_ID not set, skipping Secret Manager');
    return;
  }

  console.log('Loading secrets from Google Secret Manager...');

  const secrets = {
    MONGODB_URI: 'analytics-service-mongodb-uri',
    JWT_SECRET: 'user-service-jwt-secret',
  };

  try {
    for (const [envVar, secretName] of Object.entries(secrets)) {
      try {
        const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
        const [version] = await client.accessSecretVersion({ name });
        const secretValue = version.payload.data.toString('utf8');
        process.env[envVar] = secretValue;
        console.log(`✓ Loaded ${envVar} from Secret Manager`);
      } catch (error) {
        console.warn(`Failed to load ${secretName}:`, error.message);
      }
    }
    console.log('Secret Manager initialization complete');
  } catch (error) {
    console.error('Error loading secrets from Secret Manager:', error);
    throw error;
  }
}

module.exports = { loadSecrets };
