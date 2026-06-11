import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_CONFIG } from '../../config/r2';
import { ValidationError } from '../errors/AppError';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export interface FileUploadOptions {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  documentType: string;
  userId: string;
}

export interface SignedUrlResult {
  url: string;
  expiresIn: number;
}

export class FileUploadUtil {
  /**
   * Validate file before upload
   */
  static validateFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): { isValid: true } | { isValid: false; error: string } {
    // Check file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds 2MB limit. Current size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      };
    }

    // Check file name
    if (!fileName || fileName.trim().length === 0) {
      return { isValid: false, error: 'File name is required' };
    }

    return { isValid: true };
  }

  /**
   * Upload file to Cloudflare R2
   */
  static async uploadToR2(options: FileUploadOptions): Promise<{
    fileKey: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }> {
    const { fileBuffer, fileName, mimeType, documentType, userId } = options;

    // Validate file
    const validation = this.validateFile(fileBuffer, fileName, mimeType);
    if (!validation.isValid) {
      throw new ValidationError(validation.error);
    }

    // Create unique file key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const fileKey = `kyc/${userId}/${documentType}/${timestamp}-${randomStr}.${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'upload-user-id': userId,
          'upload-document-type': documentType,
          'upload-timestamp': new Date().toISOString(),
        },
      });

      await r2Client.send(command);

      return {
        fileKey,
        fileName,
        fileSizeBytes: fileBuffer.length,
        mimeType,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file to R2: ${errorMessage}`);
    }
  }

  /**
   * Generate signed URL for secure document access (expires in 1 hour)
   */
  static async generateSignedUrl(
    fileKey: string,
    expiresInSeconds: number = 3600 // 1 hour default
  ): Promise<SignedUrlResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: fileKey,
      });

      const url = await getSignedUrl(r2Client, command, {
        expiresIn: expiresInSeconds,
      });

      return {
        url,
        expiresIn: expiresInSeconds,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate signed URL: ${errorMessage}`);
    }
  }

  /**
   * Get multiple signed URLs for KYC documents
   */
  static async generateSignedUrlsBatch(
    fileKeys: string[]
  ): Promise<Map<string, SignedUrlResult>> {
    const urls = new Map<string, SignedUrlResult>();

    for (const fileKey of fileKeys) {
      try {
        const signedUrl = await this.generateSignedUrl(fileKey);
        urls.set(fileKey, signedUrl);
      } catch (error) {
        console.error(`Failed to generate signed URL for ${fileKey}:`, error);
      }
    }

    return urls;
  }

  /**
   * Upload generic file to R2 (e.g. Job photos or voice notes)
   */
  static async uploadToR2Generic(options: {
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    path: string;
    userId: string;
  }): Promise<{
    fileKey: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }> {
    const { fileBuffer, fileName, mimeType, path, userId } = options;
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExtension = fileName.split('.').pop() || '';
    const fileKey = `${path}/${userId}/${timestamp}-${randomStr}${fileExtension ? '.' + fileExtension : ''}`;

    try {
      const command = new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await r2Client.send(command);

      return {
        fileKey,
        fileName,
        fileSizeBytes: fileBuffer.length,
        mimeType,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file to R2: ${errorMessage}`);
    }
  }

  /**
   * Get file size in MB for display
   */
  static formatFileSize(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)}MB`;
  }

  /**
   * Dynamically generate signed URL if the URL is pointing to R2 storage API
   */
  static async getSignedUrlIfNeeded(url: string | null | undefined): Promise<string | null | undefined> {
    if (!url) return url;
    if (url.includes('r2.cloudflarestorage.com')) {
      try {
        const parsedUrl = new URL(url);
        let fileKey = parsedUrl.pathname;
        if (fileKey.startsWith('/')) {
          fileKey = fileKey.slice(1);
        }
        if (fileKey.startsWith(R2_CONFIG.bucketName + '/')) {
          fileKey = fileKey.slice(R2_CONFIG.bucketName.length + 1);
        }
        const signed = await this.generateSignedUrl(fileKey);
        return signed.url;
      } catch (err) {
        console.error('Failed to sign URL:', err);
        return url;
      }
    }
    return url;
  }

  /**
   * Dynamic batch URL signer
   */
  static async getSignedUrlsBatchIfNeeded(urls: string[] | null | undefined): Promise<string[]> {
    if (!urls || urls.length === 0) return [];
    return Promise.all(urls.map(url => this.getSignedUrlIfNeeded(url) as Promise<string>));
  }
}
