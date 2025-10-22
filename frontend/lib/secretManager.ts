import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Google Secret Manager Configuration
 * Fetches secrets from Google Cloud Secret Manager for the Frontend
 * Note: This should only be used server-side (not in browser)
 */

const client = new SecretManagerServiceClient();

// GCP Project ID - set via environment variable
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-gcp-project-id';

/**
 * Access a secret version from Google Secret Manager
 * @param secretName - Name of the secret in Secret Manager
 * @param version - Version of the secret (default: 'latest')
 * @returns The secret value
 */
async function accessSecretVersion(secretName: string, version: string = 'latest'): Promise<string> {
  try {
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/${version}`;
    const [response] = await client.accessSecretVersion({ name });
    const payload = response.payload?.data?.toString('utf8');
    
    if (!payload) {
      throw new Error(`No payload found for secret ${secretName}`);
    }
    
    return payload;
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, (error as Error).message);
    throw error;
  }
}

/**
 * Frontend typically doesn't have many secrets since most config is public
 * API keys or tokens for external services would go here
 * Most NEXT_PUBLIC_* vars are public and should be in env vars, not Secret Manager
 */
type FrontendSecrets = Record<string, string>;

/**
 * Load sensitive secrets from Google Secret Manager
 * Note: For frontend, most environment variables are public (NEXT_PUBLIC_*)
 * Only store actual secrets here (API keys, tokens, etc.)
 * @returns Object containing only secret values
 */
async function loadSecrets(): Promise<FrontendSecrets> {
  try {
    console.log('Loading secrets from Google Secret Manager...');
    
    const secrets: FrontendSecrets = {
      // Add only sensitive secrets here
      // Example: THIRD_PARTY_API_KEY: await accessSecretVersion('frontend-third-party-api-key'),
    };
    
    console.log('Secrets loaded successfully from Google Secret Manager');
    return secrets;
  } catch (error) {
    console.error('Error loading secrets:', (error as Error).message);
    throw error;
  }
}

/**
 * Initialize environment variables from Google Secret Manager
 * Sets process.env with values from Secret Manager
 * WARNING: This should only be called server-side during build/startup
 */
async function initializeSecrets(): Promise<void> {
  try {
    const secrets = await loadSecrets();
    
    // Set environment variables
    Object.entries(secrets).forEach(([key, value]) => {
      process.env[key] = value;
    });
    
    console.log('Environment variables initialized from Google Secret Manager');
  } catch (error) {
    console.error('Failed to initialize secrets:', (error as Error).message);
    throw error;
  }
}

export { loadSecrets, initializeSecrets, accessSecretVersion };
export type { FrontendSecrets };
