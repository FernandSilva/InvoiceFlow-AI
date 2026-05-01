import { ID } from "appwrite";
import { mockAuditLogs, mockDocuments, mockExtractedData, mockOutputs, mockProfiles, mockUsage } from "./mockData";
import { COLLECTIONS, DATABASE_ID } from "./constants";
import type { AuditLog, DocumentRecord, ExtractedData, GeneratedOutput, Profile, UserUsage } from "../types";

const DOCUMENTS_STORAGE_KEY = "invoiceflow-documents";
const EXTRACTED_STORAGE_KEY = "invoiceflow-extracted";
const OUTPUTS_STORAGE_KEY = "invoiceflow-outputs";
const AUDIT_STORAGE_KEY = "invoiceflow-audit";
const USAGE_STORAGE_KEY = "invoiceflow-usage";
const PROFILES_STORAGE_KEY = "invoiceflow-profiles";

const persistIfMissing = <T,>(key: string, seed: T) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(seed));
  }
};

export const ensureMockState = () => {
  persistIfMissing(DOCUMENTS_STORAGE_KEY, mockDocuments);
  persistIfMissing(EXTRACTED_STORAGE_KEY, mockExtractedData);
  persistIfMissing(OUTPUTS_STORAGE_KEY, mockOutputs);
  persistIfMissing(AUDIT_STORAGE_KEY, mockAuditLogs);
  persistIfMissing(USAGE_STORAGE_KEY, mockUsage);
  persistIfMissing(PROFILES_STORAGE_KEY, mockProfiles);
};

export const readMock = <T,>(key: string): T[] => {
  ensureMockState();
  return JSON.parse(localStorage.getItem(key) || "[]") as T[];
};

export const writeMock = <T,>(key: string, value: T[]) => localStorage.setItem(key, JSON.stringify(value));

export const readMockProfiles = () => readMock<Profile>(PROFILES_STORAGE_KEY);
export const saveMockProfiles = (items: Profile[]) => writeMock(PROFILES_STORAGE_KEY, items);
export const readMockDocuments = () => readMock<DocumentRecord>(DOCUMENTS_STORAGE_KEY);
export const saveMockDocuments = (items: DocumentRecord[]) => writeMock(DOCUMENTS_STORAGE_KEY, items);
export const readMockExtractedData = () => readMock<ExtractedData>(EXTRACTED_STORAGE_KEY);
export const saveMockExtractedData = (items: ExtractedData[]) => writeMock(EXTRACTED_STORAGE_KEY, items);
export const readMockOutputs = () => readMock<GeneratedOutput>(OUTPUTS_STORAGE_KEY);
export const saveMockOutputs = (items: GeneratedOutput[]) => writeMock(OUTPUTS_STORAGE_KEY, items);
export const readMockAuditLogs = () => readMock<AuditLog>(AUDIT_STORAGE_KEY);
export const saveMockAuditLogs = (items: AuditLog[]) => writeMock(AUDIT_STORAGE_KEY, items);
export const readMockUsage = () => readMock<UserUsage>(USAGE_STORAGE_KEY);
export const saveMockUsage = (items: UserUsage[]) => writeMock(USAGE_STORAGE_KEY, items);

export const mockAuditLog = ({
  actorUserId,
  targetUserId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorUserId: string;
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}) => {
  const logs = readMockAuditLogs();
  logs.unshift({
    id: ID.unique(),
    actorUserId,
    targetUserId,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress: "127.0.0.1",
    createdAt: new Date().toISOString(),
  });
  saveMockAuditLogs(logs);
};

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
) =>
  services.databases.createDocument(
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
