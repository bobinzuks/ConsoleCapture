/**
 * S3 storage service for ConsoleCapture backend
 * Handles file uploads and downloads
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@console-capture/shared';

let s3Client: S3Client | null = null;
let bucketName: string = '';

/**
 * Initialize S3 client
 */
export async function initializeS3(): Promise<void> {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || 'us-east-1';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  bucketName = process.env.S3_BUCKET_NAME || 'console-capture';

  if (!accessKeyId || !secretAccessKey) {
    logger.warn('S3 credentials not configured, using local storage fallback');
    return;
  }

  try {
    s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: !!endpoint, // Required for MinIO
    });

    logger.info('S3 client initialized successfully', { region, bucket: bucketName });
  } catch (error) {
    logger.error('Failed to initialize S3 client', error as Error);
    throw error;
  }
}

/**
 * Get S3 client instance
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }
  return s3Client;
}

/**
 * Storage service for managing file uploads
 */
export class StorageService {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = getS3Client();
    this.bucket = bucketName;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    key: string,
    data: Buffer | string,
    contentType: string = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3.send(command);

      const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
      logger.info('File uploaded successfully', { key, url });

      return url;
    } catch (error) {
      logger.error('File upload error', error as Error, { key });
      throw error;
    }
  }

  /**
   * Generate presigned URL for upload
   */
  async getUploadUrl(
    key: string,
    contentType: string = 'application/json',
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });
      logger.info('Upload URL generated', { key, expiresIn });

      return url;
    } catch (error) {
      logger.error('Upload URL generation error', error as Error, { key });
      throw error;
    }
  }

  /**
   * Generate presigned URL for download
   */
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });
      logger.info('Download URL generated', { key, expiresIn });

      return url;
    } catch (error) {
      logger.error('Download URL generation error', error as Error, { key });
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);
      logger.info('File deleted successfully', { key });
    } catch (error) {
      logger.error('File deletion error', error as Error, { key });
      throw error;
    }
  }

  /**
   * Generate S3 key for recording
   */
  generateRecordingKey(userId: string, recordingId: string, extension: string = 'json'): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `recordings/${userId}/${year}/${month}/${recordingId}.${extension}`;
  }

  /**
   * Generate S3 key for thumbnail
   */
  generateThumbnailKey(userId: string, recordingId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `thumbnails/${userId}/${year}/${month}/${recordingId}.png`;
  }
}

/**
 * Singleton storage service instance
 */
export const storageService = new StorageService();
