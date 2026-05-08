"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppwriteAdmin = exports.getBackendConfig = void 0;
const node_appwrite_1 = require("node-appwrite");
const logger_1 = require("./logger");
const getBackendConfig = () => {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const databaseId = process.env.DATABASE_ID;
    const storageBucketId = process.env.STORAGE_BUCKET_ID;
    const collectionDocuments = process.env.COLLECTION_DOCUMENTS;
    const collectionExtractedData = process.env.COLLECTION_EXTRACTED_DATA;
    const collectionAuditLogs = process.env.COLLECTION_AUDIT_LOGS;
    const collectionUserUsage = process.env.COLLECTION_USER_USAGE;
    if (!endpoint ||
        !projectId ||
        !apiKey ||
        !databaseId ||
        !storageBucketId ||
        !collectionDocuments ||
        !collectionExtractedData ||
        !collectionAuditLogs ||
        !collectionUserUsage) {
        logger_1.functionLogger.error("appwriteAdmin", "Required backend environment variables are missing.", {
            endpoint: Boolean(endpoint),
            projectId: Boolean(projectId),
            apiKey: Boolean(apiKey),
            databaseId: Boolean(databaseId),
            storageBucketId: Boolean(storageBucketId),
            collectionDocuments: Boolean(collectionDocuments),
            collectionExtractedData: Boolean(collectionExtractedData),
            collectionAuditLogs: Boolean(collectionAuditLogs),
            collectionUserUsage: Boolean(collectionUserUsage),
        });
        throw new Error("Required Appwrite backend environment variables are missing.");
    }
    logger_1.functionLogger.debug("appwriteAdmin", "Backend configuration loaded.", {
        endpoint,
        projectId,
        databaseId,
        storageBucketId,
        collectionDocuments,
        collectionExtractedData,
        collectionAuditLogs,
        collectionUserUsage,
        collectionProfiles: process.env.COLLECTION_PROFILES || "profiles",
    });
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
exports.getBackendConfig = getBackendConfig;
const getAppwriteAdmin = () => {
    const { endpoint, projectId, apiKey } = (0, exports.getBackendConfig)();
    logger_1.functionLogger.info("appwriteAdmin", "Creating Appwrite admin client.", {
        endpoint,
        projectId,
    });
    logger_1.functionLogger.info("appwriteAdmin", "Admin client configured with API key: true", {
        hasApiKey: Boolean(apiKey),
    });
    const client = new node_appwrite_1.Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    return {
        client,
        databases: new node_appwrite_1.Databases(client),
        storage: new node_appwrite_1.Storage(client),
        users: new node_appwrite_1.Users(client),
    };
};
exports.getAppwriteAdmin = getAppwriteAdmin;
