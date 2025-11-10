const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-gcp-project-id';

async function accessSecretVersion(secretName, version = 'latest') {
  try {
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/${version}`;
    const [response] = await client.accessSecretVersion({ name });
    const payload = response.payload.data.toString('utf8');
    return payload;
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error.message);
    throw error;
  }
}

async function loadSecrets() {
  try {
    console.log('Loading secrets from Google Secret Manager...');

    const secrets = {
      MONGODB_URI: await accessSecretVersion('question-service-mongodb-uri'),
      JWT_SECRET: await accessSecretVersion('user-service-jwt-secret'),
    };

    console.log('✓ Loaded MONGODB_URI from Secret Manager');
    console.log('✓ Loaded JWT_SECRET from Secret Manager');
    console.log('Secret Manager initialization complete');
    return secrets;
  } catch (error) {
    console.error('Error loading secrets:', error.message);
    throw error;
  }
}

async function initializeSecrets() {
  try {
    const secrets = await loadSecrets();

    Object.keys(secrets).forEach((key) => {
      process.env[key] = secrets[key];
    });

    console.log('Environment variables initialized from Google Secret Manager');
  } catch (error) {
    console.error('Failed to initialize secrets:', error.message);
    throw error;
  }
}

module.exports = { loadSecrets, initializeSecrets, accessSecretVersion };
