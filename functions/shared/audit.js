"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuditEvent = void 0;
const buildAuditEvent = (input) => {
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
exports.buildAuditEvent = buildAuditEvent;
