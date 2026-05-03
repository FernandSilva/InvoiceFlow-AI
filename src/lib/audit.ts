import { ID } from "appwrite";
import { COLLECTIONS, DATABASE_ID } from "./constants";
import { appLogger } from "./logger";

export const createClientAuditLog = async (
  services: { databases: { createDocument: (...args: any[]) => Promise<any> } },
  input: {
    actorUserId: string;
    targetUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown>;
  },
) => {
  appLogger.info("audit", "Creating client audit log.", {
    action: input.action,
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    entityType: input.entityType,
    entityId: input.entityId,
  });

  return services.databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.AUDIT_LOGS,
    ID.unique(),
    {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId || "",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: JSON.stringify(input.metadata),
      ipAddress: "client",
      createdAt: new Date().toISOString(),
    },
  );
};
