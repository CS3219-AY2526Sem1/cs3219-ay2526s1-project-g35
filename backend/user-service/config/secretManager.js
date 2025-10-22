import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Google Secret Manager Configuration
 * Fetches secrets from Google Cloud Secret Manager for the User Service
 */

const client = new SecretManagerServiceClient();

// GCP Project ID - set via environment variable
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-gcp-project-id';

/**
 * Access a secret version from Google Secret Manager
 * @param {string} secretName - Name of the secret in Secret Manager
 * @param {string} version - Version of the secret (default: 'latest')
 * @returns {Promise<string>} - The secret value
 */
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

/**
 * Load ONLY sensitive secrets from Google Secret Manager
 * Non-sensitive configuration should be in environment variables or ConfigMaps
 * @returns {Promise<Object>} - Object containing only secret values
 */
async function loadSecrets() {
  try {
    console.log('Loading secrets from Google Secret Manager...');
    
    const secrets = {
      // Database URIs (SENSITIVE - contain credentials)
      DB_CLOUD_URI: await accessSecretVersion('user-service-db-cloud-uri'),
      DB_LOCAL_URI: await accessSecretVersion('user-service-db-local-uri'),
      
      // JWT Secrets (SENSITIVE - cryptographic keys)
      JWT_SECRET: await accessSecretVersion('user-service-jwt-secret'),
      JWT_REFRESH_SECRET: await accessSecretVersion('user-service-jwt-refresh-secret'),
      
      // Email Credentials (SENSITIVE - authentication credentials)
      MAILTRAP_USER: await accessSecretVersion('user-service-mailtrap-user'),
      MAILTRAP_PASS: await accessSecretVersion('user-service-mailtrap-pass'),
      SMTP_USER: await accessSecretVersion('user-service-smtp-user'),
      SMTP_PASS: await accessSecretVersion('user-service-smtp-pass'),
    };
    
    console.log('Secrets loaded successfully from Google Secret Manager');
    return secrets;
  } catch (error) {
    console.error('Error loading secrets:', error.message);
    throw error;
  }
}

/**
 * Initialize environment variables from Google Secret Manager
 * Sets process.env with values from Secret Manager
 */
async function initializeSecrets() {
  try {
    const secrets = await loadSecrets();
    
    // Set environment variables
    Object.keys(secrets).forEach(key => {
      process.env[key] = secrets[key];
    });
    
    console.log('Environment variables initialized from Google Secret Manager');
  } catch (error) {
    console.error('Failed to initialize secrets:', error.message);
    throw error;
  }
}

export { loadSecrets, initializeSecrets, accessSecretVersion };
