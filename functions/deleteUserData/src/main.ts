import { ID } from "node-appwrite";
import { buildAuditEvent } from "../../shared/audit";
import { getAppwriteAdmin, getBackendConfig } from "../../shared/appwriteAdmin";
import { STORAGE_BUCKET_ID } from "../../shared/storagePaths";

export default async ({ req, res }: { req: any; res: any }) => {
  try {
    const { databaseId, collectionProfiles, collectionDocuments, collectionAuditLogs } = getBackendConfig();
    const actorUserId = req.headers["x-appwrite-user-id"];
    const actorRole = req.headers["x-appwrite-user-role"] === "admin" ? "admin" : "user";
    const ipAddress = req.headers["x-forwarded-for"] || "unknown";
    const { targetUserId } = JSON.parse(req.body || "{}");

    if (!actorUserId) {
      return res.json({ ok: false, error: "Authentication required." }, 401);
    }
    if (actorUserId !== targetUserId && actorRole !== "admin") {
      return res.json({ ok: false, error: "Forbidden." }, 403);
    }

    const admin = getAppwriteAdmin();
    const documents = await admin.databases.listDocuments(databaseId, collectionDocuments);
    const targetDocuments = documents.documents.filter((document: any) => document.userId === targetUserId);

    for (const document of targetDocuments) {
      if (document.originalFileId) {
        await admin.storage.deleteFile(process.env.STORAGE_BUCKET_ID || STORAGE_BUCKET_ID, document.originalFileId).catch(() => undefined);
      }
      for (const fileId of document.generatedFileIds || []) {
        await admin.storage.deleteFile(process.env.STORAGE_BUCKET_ID || STORAGE_BUCKET_ID, fileId).catch(() => undefined);
      }
      await admin.databases.updateDocument(
        databaseId,
        collectionDocuments,
        document.$id,
        {
          status: "failed",
          errorMessage: "Deleted by user data deletion workflow.",
          updatedAt: new Date().toISOString(),
        },
      );
    }

    const profiles = await admin.databases.listDocuments(databaseId, collectionProfiles);
    const targetProfile = profiles.documents.find((profile: any) => profile.userId === targetUserId);
    if (targetProfile) {
      await admin.databases.updateDocument(
        databaseId,
        collectionProfiles,
        targetProfile.$id,
        {
          status: "deleted",
          updatedAt: new Date().toISOString(),
        },
      );
    }

    await admin.databases.createDocument(
      databaseId,
      collectionAuditLogs,
      ID.unique(),
      buildAuditEvent({
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
      }),
    );

    return res.json({ ok: true, deletedDocuments: targetDocuments.length });
  } catch (error) {
    return res.json({ ok: false, error: error instanceof Error ? error.message : "Unknown deletion error." }, 500);
  }
};
