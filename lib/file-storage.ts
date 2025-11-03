import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const getUploadDir = () => {
  return process.env.UPLOAD_DIR || '/app/uploads';
};

async function ensureUploadDir() {
  const uploadDir = getUploadDir();
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  await ensureUploadDir();
  
  const ext = path.extname(originalName);
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(getUploadDir(), fileName);
  
  await fs.writeFile(filePath, buffer);
  return fileName;
}

export async function getFile(fileName: string): Promise<Buffer> {
  const filePath = path.join(getUploadDir(), fileName);
  return await fs.readFile(filePath);
}

export async function deleteFile(fileName: string): Promise<void> {
  const filePath = path.join(getUploadDir(), fileName);
  await fs.unlink(filePath);
}

export async function renameFile(oldName: string, newName: string): Promise<void> {
  const oldPath = path.join(getUploadDir(), oldName);
  const newPath = path.join(getUploadDir(), newName);
  await fs.rename(oldPath, newPath);
}

export function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tiff': 'image/tiff',
  };
  return contentTypes[ext] || 'application/octet-stream';
}
