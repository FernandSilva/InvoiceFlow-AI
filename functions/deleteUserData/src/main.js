"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_appwrite_1 = require("node-appwrite");
const audit_1 = require("../../shared/audit");
const appwriteAdmin_1 = require("../../shared/appwriteAdmin");
const logger_1 = require("../../shared/logger");
const storagePaths_1 = require("../../shared/storagePaths");
exports.default = async ({ req, res }) => {
    try {
        const { databaseId, collectionProfiles, collectionDocuments, collectionAuditLogs } = (0, appwriteAdmin_1.getBackendConfig)();
        const actorUserId = req.headers["x-appwrite-user-id"];
        const actorRole = req.headers["x-appwrite-user-role"] === "admin" ? "admin" : "user";
        const ipAddress = req.headers["x-forwarded-for"] || "unknown";
        const { targetUserId } = JSON.parse(req.body || "{}");
        logger_1.functionLogger.info("deleteUserData", "Function invoked.", {
            actorUserId,
            actorRole,
            targetUserId,
            ipAddress,
        });
        if (!actorUserId) {
            logger_1.functionLogger.warn("deleteUserData", "Authentication missing for deletion request.");
            return res.json({ ok: false, error: "Authentication required." }, 401);
        }
        if (actorUserId !== targetUserId && actorRole !== "admin") {
            logger_1.functionLogger.warn("deleteUserData", "Forbidden deletion request.", {
                actorUserId,
                actorRole,
                targetUserId,
            });
            return res.json({ ok: false, error: "Forbidden." }, 403);
        }
        const admin = (0, appwriteAdmin_1.getAppwriteAdmin)();
        const documents = await admin.databases.listDocuments(databaseId, collectionDocuments);
        const targetDocuments = documents.documents.filter((document) => document.userId === targetUserId);
        logger_1.functionLogger.info("deleteUserData", "Loaded target user documents.", {
            targetUserId,
            documentCount: targetDocuments.length,
        });
        for (const document of targetDocuments) {
            if (document.originalFileId) {
                logger_1.functionLogger.debug("deleteUserData", "Deleting original file.", {
                    documentId: document.$id,
                    fileId: document.originalFileId,
                });
                await admin.storage.deleteFile(process.env.STORAGE_BUCKET_ID || storagePaths_1.STORAGE_BUCKET_ID, document.originalFileId).catch(() => undefined);
            }
            for (const fileId of document.generatedFileIds || []) {
                logger_1.functionLogger.debug("deleteUserData", "Deleting generated file.", {
                    documentId: document.$id,
                    fileId,
                });
                await admin.storage.deleteFile(process.env.STORAGE_BUCKET_ID || storagePaths_1.STORAGE_BUCKET_ID, fileId).catch(() => undefined);
            }
            await admin.databases.updateDocument(databaseId, collectionDocuments, document.$id, {
                status: "failed",
                errorMessage: "Deleted by user data deletion workflow.",
                updatedAt: new Date().toISOString(),
            });
            logger_1.functionLogger.info("deleteUserData", "Soft-deleted document record.", {
                documentId: document.$id,
            });
        }
        const profiles = await admin.databases.listDocuments(databaseId, collectionProfiles);
        const targetProfile = profiles.documents.find((profile) => profile.userId === targetUserId);
        if (targetProfile) {
            await admin.databases.updateDocument(databaseId, collectionProfiles, targetProfile.$id, {
                status: "deleted",
                updatedAt: new Date().toISOString(),
            });
            logger_1.functionLogger.info("deleteUserData", "Soft-deleted profile record.", {
                targetUserId,
                profileId: targetProfile.$id,
            });
        }
        await admin.databases.createDocument(databaseId, collectionAuditLogs, node_appwrite_1.ID.unique(), (0, audit_1.buildAuditEvent)({
            actorUserId,
            targetUserId,
            action: "user.deleted",
            entityType: "profile",
            entityId: targetUserId,
            metadata: {
                documentCount: targetDocuments.length,
                initiatedBy: actorRole,
            },
            ipAddress,
        }));
        logger_1.functionLogger.info("deleteUserData", "Created deletion audit log.", {
            actorUserId,
            targetUserId,
            deletedDocuments: targetDocuments.length,
        });
        return res.json({ ok: true, deletedDocuments: targetDocuments.length });
    }
    catch (error) {
        logger_1.functionLogger.error("deleteUserData", "Unhandled deletion error.", {
            error: error instanceof Error ? error.message : "Unknown deletion error.",
        });
        return res.json({ ok: false, error: error instanceof Error ? error.message : "Unknown deletion error." }, 500);
    }
};
