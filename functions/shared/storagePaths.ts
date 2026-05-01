const sanitizeFilename = (filename: string) => filename.replace(/[^\w.\-]/g, "_");

export const STORAGE_BUCKET_ID = "69f4baed0038dc6f98a8";

export const buildOriginalFilePath = (userId: string, documentId: string, filename: string) =>
  `original/${userId}/${documentId}/${sanitizeFilename(filename)}`;

export const buildOutputFilePath = (userId: string, documentId: string, filename: string) =>
  `outputs/${userId}/${documentId}/${sanitizeFilename(filename)}`;

export const buildTempFilePath = (userId: string, documentId: string, filename: string) =>
  `temp/${userId}/${documentId}/${sanitizeFilename(filename)}`;
