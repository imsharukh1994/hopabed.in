import fs from 'node:fs';
import path from 'node:path';
import { r2Client, r2Config } from '../config/r2.js';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'documents');

// Ensure local upload folder exists for private storage fallback
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit

export interface SaveDocumentInput {
  propertyId: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface SaveDocumentResult {
  storageReference: string;
  fileSize: number;
}

/**
 * Save private document either to R2 (if configured) or local private storage.
 */
export async function savePrivateDocument(input: SaveDocumentInput): Promise<SaveDocumentResult> {
  const { propertyId, documentType, originalFilename, mimeType, buffer } = input;

  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  const ext = path.extname(originalFilename) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
  const filename = `${propertyId}_${documentType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

  if (r2Client && r2Config.bucket) {
    const key = `documents/${filename}`;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return {
      storageReference: `r2://${key}`,
      fileSize: buffer.length,
    };
  }

  // Local private storage
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);

  return {
    storageReference: `local://${filename}`,
    fileSize: buffer.length,
  };
}

/**
 * Read private document stream securely for streaming to authorized host/admin.
 */
export async function getPrivateDocumentStream(
  storageReference: string
): Promise<{ stream: Readable; mimeType: string }> {
  if (storageReference.startsWith('r2://')) {
    if (!r2Client || !r2Config.bucket) throw new Error('STORAGE_NOT_CONFIGURED');
    const key = storageReference.replace('r2://', '');
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: r2Config.bucket,
        Key: key,
      })
    );
    if (!response.Body) throw new Error('DOCUMENT_NOT_FOUND');
    const ext = path.extname(key).toLowerCase();
    const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';
    return {
      stream: response.Body as Readable,
      mimeType: response.ContentType || mimeType,
    };
  }

  // Local storage
  const filename = storageReference.replace('local://', '');
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));

  if (!fs.existsSync(filePath)) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';
  const stream = fs.createReadStream(filePath);

  return { stream, mimeType };
}

/**
 * Delete private document from storage
 */
export async function deletePrivateDocument(storageReference: string): Promise<void> {
  try {
    if (storageReference.startsWith('r2://')) {
      if (r2Client && r2Config.bucket) {
        const key = storageReference.replace('r2://', '');
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: r2Config.bucket,
            Key: key,
          })
        );
      }
      return;
    }

    const filename = storageReference.replace('local://', '');
    const filePath = path.join(UPLOAD_DIR, path.basename(filename));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error('[storageService] Failed to delete document:', err);
  }
}
