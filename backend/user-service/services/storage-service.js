import { Storage } from '@google-cloud/storage';
import path from 'path';

class StorageService {
  constructor() {
    this.storage = null;
    this.bucketName = process.env.GCS_BUCKET_NAME;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const storageOptions = {};

      // For local development or when GCS_SERVICE_ACCOUNT_KEY is provided
      if (process.env.GCS_SERVICE_ACCOUNT_KEY) {
        try {
          const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY);
          storageOptions.credentials = credentials;
          console.log('Using GCS service account from environment variable');
        } catch (parseError) {
          console.error('Failed to parse GCS_SERVICE_ACCOUNT_KEY:', parseError);
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {

        storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        console.log('Using GCS service account from key file');
      } else {
        // Use default credentials (ADC or Workload Identity)
        console.log('Using GCS default credentials (ADC or Workload Identity)');
      }

      if (process.env.GCS_PROJECT_ID) {
        storageOptions.projectId = process.env.GCS_PROJECT_ID;
      }

      this.storage = new Storage(storageOptions);
      this.initialized = true;
      console.log('Google Cloud Storage initialized');
    } catch (error) {
      console.error('Failed to initialize Google Cloud Storage:', error);
      throw error;
    }
  }

  isConfigured() {
    return !!(this.bucketName && this.storage);
  }

  generateFileName(username, originalName) {
    const timestamp = Date.now();
    const ext = path.extname(originalName).toLowerCase();
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '-');
    return `profile-pictures/${sanitizedUsername}-${timestamp}${ext}`;
  }

  async uploadProfilePicture(fileBuffer, fileName, mimetype) {
    if (!this.initialized) {
      this.init();
    }

    if (!this.isConfigured()) {
      throw new Error('Google Cloud Storage is not properly configured');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      // Upload file without legacy ACL (uniform bucket-level access is enabled)
      await file.save(fileBuffer, {
        metadata: {
          contentType: mimetype,
          cacheControl: 'public, max-age=31536000',
        },
        validation: 'md5',
      });

      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      console.log(`File uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file to GCS:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteProfilePicture(fileUrl) {
    if (!fileUrl) return;

    if (!this.initialized) {
      this.init();
    }

    if (!this.isConfigured()) {
      console.warn('Google Cloud Storage is not configured, skipping delete');
      return;
    }

    try {
      const fileName = this.extractFileNameFromUrl(fileUrl);

      if (!fileName) {
        console.warn('Could not extract filename from URL:', fileUrl);
        return;
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
        console.log(`File deleted successfully: ${fileName}`);
      } else {
        console.warn(`File does not exist: ${fileName}`);
      }
    } catch (error) {
      console.error('Error deleting file from GCS:', error);
    }
  }

  extractFileNameFromUrl(url) {
    try {
      const match = url.match(/googleapis\.com\/[^/]+\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  validateImageFile(mimetype, size) {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedMimeTypes.includes(mimetype)) {
      throw new Error('Invalid file type. Only JPEG, JPG, and PNG images are allowed.');
    }

    if (size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }

    return true;
  }
}

const storageService = new StorageService();
export default storageService;
