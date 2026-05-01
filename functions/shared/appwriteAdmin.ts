import { Client, Databases, Storage, Users } from "node-appwrite";

export const getBackendConfig = () => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.DATABASE_ID;
  const storageBucketId = process.env.STORAGE_BUCKET_ID;
  const collectionDocuments = process.env.COLLECTION_DOCUMENTS;
  const collectionExtractedData = process.env.COLLECTION_EXTRACTED_DATA;
  const collectionAuditLogs = process.env.COLLECTION_AUDIT_LOGS;
  const collectionUserUsage = process.env.COLLECTION_USER_USAGE;

  if (
    !endpoint ||
    !projectId ||
    !apiKey ||
    !databaseId ||
    !storageBucketId ||
    !collectionDocuments ||
    !collectionExtractedData ||
    !collectionAuditLogs ||
    !collectionUserUsage
  ) {
    throw new Error("Required Appwrite backend environment variables are missing.");
  }

  return {
    endpoint,
    projectId,
    apiKey,
    databaseId,
    storageBucketId,
    collectionDocuments,
    collectionExtractedData,
    collectionAuditLogs,
    collectionUserUsage,
    collectionProfiles: process.env.COLLECTION_PROFILES || "profiles",
  };
};

export const getAppwriteAdmin = () => {
  const { endpoint, projectId, apiKey } = getBackendConfig();

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };
};
