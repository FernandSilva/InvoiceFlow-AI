interface AuditEventInput {
  actorUserId: string;
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
}

export const buildAuditEvent = (input: AuditEventInput) => {
  return {
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId || "",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: JSON.stringify(input.metadata),
    ipAddress: input.ipAddress,
    createdAt: new Date().toISOString(),
  };
};
