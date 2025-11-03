
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`Created upload directory: ${UPLOAD_DIR}`);
    }
  } catch (error) {
    console.error("Error creating upload directory:", error);
    throw new Error("Failed to create upload directory");
  }
}

export async function uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  try {
    await ensureUploadDir();
    
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);
    
    await fs.writeFile(filePath, buffer);
    console.log(`File uploaded successfully: ${filePath} (${contentType})`);
    
    return uniqueFileName;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("File upload failed");
  }
}

export async function getFile(fileName: string): Promise<Buffer> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    if (!existsSync(filePath)) {
      throw new Error("File not found");
    }
    
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error("File read failed");
  }
}

export async function deleteFile(fileName: string): Promise<void> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    if (existsSync(filePath)) {
      await fs.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("File deletion failed");
  }
}

export async function renameFile(oldFileName: string, newFileName: string): Promise<string> {
  try {
    const oldPath = path.join(UPLOAD_DIR, oldFileName);
    const sanitizedNewFileName = newFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newPath = path.join(UPLOAD_DIR, sanitizedNewFileName);
    
    if (!existsSync(oldPath)) {
      throw new Error("File not found");
    }
    
    await fs.rename(oldPath, newPath);
    console.log(`File renamed successfully: ${oldPath} -> ${newPath}`);
    
    return sanitizedNewFileName;
  } catch (error) {
    console.error("Error renaming file:", error);
    throw new Error("File rename failed");
  }
}

export function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    default:
      return 'application/octet-stream';
  }
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}
