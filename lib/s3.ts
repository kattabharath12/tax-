
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  try {
    const key = `${folderPrefix}uploads/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: getContentType(fileName),
    });
    
    await s3Client.send(command);
    return key; // Return cloud_storage_path
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("File upload failed");
  }
}

export async function downloadFile(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw new Error("File download failed");
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("File deletion failed");
  }
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  try {
    // Download the file
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: oldKey,
    });
    
    const response = await s3Client.send(getCommand);
    if (!response.Body) {
      throw new Error("File not found");
    }
    
    // Upload with new key
    const bodyBytes = await response.Body.transformToByteArray();
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: newKey,
      Body: bodyBytes,
    });
    
    await s3Client.send(putCommand);
    
    // Delete old file
    await deleteFile(oldKey);
    
    return newKey;
  } catch (error) {
    console.error("Error renaming file:", error);
    throw new Error("File rename failed");
  }
}

function getContentType(fileName: string): string {
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
