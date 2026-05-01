import { ID, Query } from "appwrite";
import { getAppwriteServices } from "./appwrite";
import { COLLECTIONS, DATABASE_ID, FUNCTIONS, STORAGE_BUCKET_ID, USE_MOCKS } from "./constants";
import {
  getMockDocumentDetail,
  mockAdminMetrics,
  mockExtractedData,
} from "./mockData";
import {
  createClientAuditLog,
  mockAuditLog,
  readMockAuditLogs,
  readMockDocuments,
  readMockExtractedData,
  readMockOutputs,
  readMockProfiles,
  readMockUsage,
  saveMockAuditLogs,
  saveMockDocuments,
  saveMockExtractedData,
  saveMockOutputs,
  saveMockProfiles,
  saveMockUsage,
} from "./mockState";
import { buildOriginalFilePath } from "./storagePaths";
import type {
  AdminMetrics,
  AuditLog,
  DocumentDetail,
  DocumentStatus,
  DocumentRecord,
  ExtractedData,
  GeneratedOutput,
  OutputFormat,
  ProcessingResult,
  Profile,
  UserUsage,
  WorkflowType,
} from "../types";

const nowIso = () => new Date().toISOString();

const parseJsonString = <T,>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapProfile = (document: any): Profile => ({
  id: document.$id,
  userId: document.userId,
  email: document.email,
  fullName: document.fullName,
  companyName: document.companyName,
  role: document.role,
  status: document.status,
  onboardingCompleted: document.onboardingCompleted,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const mapDocument = (document: any): DocumentRecord => ({
  id: document.$id,
  userId: document.userId,
  originalFileId: document.originalFileId,
  originalFileName: document.originalFileName,
  originalMimeType: document.originalMimeType,
  originalSize: Number(document.originalSize),
  workflowType: document.workflowType,
  status: document.status,
  requestedOutputFormat: document.requestedOutputFormat,
  generatedFileIds: Array.isArray(document.generatedFileIds) ? document.generatedFileIds : [],
  extractedDataId: document.extractedDataId || "",
  confidenceScore: Number(document.confidenceScore || 0),
  complianceStatus: document.complianceStatus,
  errorMessage: document.errorMessage || "",
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const mapExtractedData = (document: any): ExtractedData => ({
  id: document.$id,
  documentId: document.documentId,
  userId: document.userId,
  supplierName: document.supplierName,
  supplierTaxId: document.supplierTaxId,
  supplierAddress: document.supplierAddress,
  buyerName: document.buyerName,
  buyerTaxId: document.buyerTaxId,
  buyerAddress: document.buyerAddress,
  invoiceNumber: document.invoiceNumber,
  invoiceDate: document.invoiceDate,
  dueDate: document.dueDate,
  currency: document.currency,
  subtotal: Number(document.subtotal),
  taxTotal: Number(document.taxTotal),
  total: Number(document.total),
  lineItems: parseJsonString(document.lineItems, []),
  rawExtractedJson: parseJsonString(document.rawExtractedJson, {}),
  normalizedJson: parseJsonString(document.normalizedJson, {}),
  validationIssues: Array.isArray(document.validationIssues) ? document.validationIssues : [],
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const mapAuditLog = (document: any): AuditLog => ({
  id: document.$id,
  actorUserId: document.actorUserId,
  targetUserId: document.targetUserId || undefined,
  action: document.action,
  entityType: document.entityType,
  entityId: document.entityId,
  metadata: typeof document.metadata === "string" ? parseJsonString(document.metadata, {}) : document.metadata || {},
  ipAddress: document.ipAddress,
  createdAt: document.createdAt,
});

const createMockExtractedData = (documentId: string, userId: string): ExtractedData => {
  const base = mockExtractedData[0];
  return {
    ...base,
    id: ID.unique(),
    documentId,
    userId,
    invoiceNumber: `INV-${Math.floor(Math.random() * 9000 + 1000)}`,
    validationIssues: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
};

const createMockOutput = (
  documentId: string,
  extractedDataId: string,
  outputFormat: OutputFormat,
): GeneratedOutput => ({
  id: ID.unique(),
  documentId,
  extractedDataId,
  outputFormat,
  fileName: `invoice-output.${outputFormat === "xlsx" ? "csv" : outputFormat}`,
  downloadUrl: "#generated-output",
  createdAt: nowIso(),
});

const pollDocumentUntilSettled = async (documentId: string, attempts = 12): Promise<DocumentRecord> => {
  const services = getAppwriteServices();
  if (!services) {
    throw new Error("Appwrite services are unavailable.");
  }

  for (let index = 0; index < attempts; index += 1) {
    const document = await services.databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId);
    const mapped = mapDocument(document);
    if (mapped.status !== "uploaded" && mapped.status !== "processing") {
      return mapped;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  }

  const latest = await services.databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId);
  return mapDocument(latest);
};

const getOutputMetadata = async (document: DocumentRecord): Promise<GeneratedOutput[]> => {
  const services = getAppwriteServices();
  if (!services) {
    return [];
  }

  const outputs = await Promise.all(
    document.generatedFileIds.map(async (fileId) => {
      try {
        const file = await services.storage.getFile(STORAGE_BUCKET_ID, fileId);
        return {
          id: file.$id,
          documentId: document.id,
          extractedDataId: document.extractedDataId || "",
          outputFormat: document.requestedOutputFormat,
          fileName: file.name,
          downloadUrl: services.storage.getFileDownload(STORAGE_BUCKET_ID, file.$id),
          createdAt: file.$createdAt,
        } as GeneratedOutput;
      } catch {
        return undefined;
      }
    }),
  );

  return outputs.filter(Boolean) as GeneratedOutput[];
};

export const platformService = {
  async listProfiles(): Promise<Profile[]> {
    if (USE_MOCKS) {
      return readMockProfiles();
    }

    const services = getAppwriteServices();
    if (!services) {
      return [];
    }

    const response = await services.databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ]);
    return response.documents.map(mapProfile);
  },
  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
    if (USE_MOCKS) {
      const profiles = readMockProfiles();
      const next = profiles.map((profile) =>
        profile.id === profileId ? { ...profile, ...updates, updatedAt: nowIso() } : profile,
      );
      saveMockProfiles(next);
      return next.find((profile) => profile.id === profileId) as Profile;
    }

    const services = getAppwriteServices();
    if (!services) {
      throw new Error("Appwrite services are unavailable.");
    }

    const document = await services.databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, profileId, {
      ...updates,
      updatedAt: nowIso(),
    });
    return mapProfile(document);
  },
  async listDocuments(profile?: Profile | null): Promise<DocumentRecord[]> {
    if (USE_MOCKS) {
      const documents = readMockDocuments();
      if (!profile || profile.role === "admin") {
        return documents;
      }
      return documents.filter((document) => document.userId === profile.userId);
    }

    const services = getAppwriteServices();
    if (!services) {
      return [];
    }

    const queries = [Query.orderDesc("$createdAt"), Query.limit(100)];
    if (profile && profile.role !== "admin") {
      queries.push(Query.equal("userId", profile.userId));
    }
    const response = await services.databases.listDocuments(DATABASE_ID, COLLECTIONS.DOCUMENTS, queries);
    return response.documents.map(mapDocument);
  },
  async getDocumentDetail(documentId: string): Promise<DocumentDetail | undefined> {
    if (USE_MOCKS) {
      return getMockDocumentDetail(documentId);
    }

    const services = getAppwriteServices();
    if (!services) {
      return undefined;
    }

    const document = mapDocument(await services.databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId));
    const extractedData =
      document.extractedDataId
        ? mapExtractedData(
            await services.databases.getDocument(DATABASE_ID, COLLECTIONS.EXTRACTED_DATA, document.extractedDataId),
          )
        : undefined;
    const logsResponse = await services.databases.listDocuments(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, [
      Query.equal("entityId", documentId),
      Query.orderDesc("createdAt"),
      Query.limit(50),
    ]);

    return {
      document,
      extractedData,
      outputs: await getOutputMetadata(document),
      auditLogs: logsResponse.documents.map(mapAuditLog),
    };
  },
  async createDocument(params: {
    profile: Profile;
    file: File;
    workflowType: WorkflowType;
    outputFormat: OutputFormat;
  }): Promise<DocumentRecord> {
    if (USE_MOCKS) {
      const documents = readMockDocuments();
      const document: DocumentRecord = {
        id: ID.unique(),
        userId: params.profile.userId,
        originalFileId: ID.unique(),
        originalFileName: params.file.name,
        originalMimeType: params.file.type || "application/octet-stream",
        originalSize: params.file.size,
        workflowType: params.workflowType,
        status: "uploaded",
        requestedOutputFormat: params.outputFormat,
        generatedFileIds: [],
        extractedDataId: "",
        confidenceScore: 0,
        complianceStatus: params.workflowType === "e_invoice_creator" ? "draft" : "not_applicable",
        errorMessage: "",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      documents.unshift(document);
      saveMockDocuments(documents);
      mockAuditLog({
        actorUserId: params.profile.userId,
        targetUserId: params.profile.userId,
        action: "document.uploaded",
        entityType: "document",
        entityId: document.id,
        metadata: { workflowType: params.workflowType, outputFormat: params.outputFormat, mock: true },
      });
      return document;
    }

    const services = getAppwriteServices();
    if (!services) {
      throw new Error("Appwrite services are unavailable.");
    }

    const documentId = ID.unique();
    const wrappedFile = new File(
      [params.file],
      buildOriginalFilePath(params.profile.userId, documentId, params.file.name),
      { type: params.file.type || "application/octet-stream" },
    );
    const uploadedFile = await services.storage.createFile(STORAGE_BUCKET_ID, ID.unique(), wrappedFile);
    const now = nowIso();
    const created = await services.databases.createDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId, {
      userId: params.profile.userId,
      originalFileId: uploadedFile.$id,
      originalFileName: params.file.name,
      originalMimeType: params.file.type || "application/octet-stream",
      originalSize: params.file.size,
      workflowType: params.workflowType,
      status: "uploaded",
      requestedOutputFormat: params.outputFormat,
      generatedFileIds: [],
      extractedDataId: "",
      confidenceScore: 0,
      complianceStatus: params.workflowType === "e_invoice_creator" ? "draft" : "not_applicable",
      errorMessage: "",
      createdAt: now,
      updatedAt: now,
    });

    await createClientAuditLog(services, {
      actorUserId: params.profile.userId,
      targetUserId: params.profile.userId,
      action: "document.uploaded",
      entityType: "document",
      entityId: created.$id,
      metadata: { workflowType: params.workflowType, outputFormat: params.outputFormat, fileName: params.file.name },
    }).catch(() => undefined);

    return mapDocument(created);
  },
  async processDocument(params: {
    documentId: string;
    workflowType: WorkflowType;
    outputFormat: OutputFormat;
    profile: Profile;
  }): Promise<ProcessingResult> {
    if (USE_MOCKS) {
      const documents = readMockDocuments();
      const extracted = readMockExtractedData();
      const outputs = readMockOutputs();
      const auditLogs = readMockAuditLogs();
      const usage = readMockUsage();

      const documentIndex = documents.findIndex((item) => item.id === params.documentId);
      const current = documents[documentIndex];
      const nextStatus: DocumentStatus = params.workflowType === "e_invoice_creator" ? "needs_review" : "completed";
      const stagedDocument: DocumentRecord = {
        ...current,
        status: nextStatus,
        confidenceScore: params.workflowType === "e_invoice_creator" ? 0.86 : 0.94,
        complianceStatus: params.workflowType === "e_invoice_creator" ? "needs_review" : "not_applicable",
        updatedAt: nowIso(),
      };

      const extractedData = createMockExtractedData(params.documentId, params.profile.userId);
      if (params.workflowType === "e_invoice_creator") {
        extractedData.validationIssues = ["Buyer VAT ID should be reviewed before formal e-invoice submission."];
      }

      const output = createMockOutput(params.documentId, extractedData.id, params.outputFormat);
      stagedDocument.extractedDataId = extractedData.id;
      stagedDocument.generatedFileIds = [output.id];
      documents[documentIndex] = stagedDocument;
      extracted.unshift(extractedData);
      outputs.unshift(output);
      auditLogs.unshift({
        id: ID.unique(),
        actorUserId: params.profile.userId,
        targetUserId: params.profile.userId,
        action: "document.processed",
        entityType: "document",
        entityId: params.documentId,
        metadata: { workflowType: params.workflowType, outputFormat: params.outputFormat, mock: true },
        ipAddress: "127.0.0.1",
        createdAt: nowIso(),
      });
      const usageIndex = usage.findIndex((item) => item.userId === params.profile.userId);
      if (usageIndex >= 0) {
        usage[usageIndex] = {
          ...usage[usageIndex],
          documentsProcessed: usage[usageIndex].documentsProcessed + 1,
          eInvoicesCreated: usage[usageIndex].eInvoicesCreated + (params.workflowType === "e_invoice_creator" ? 1 : 0),
          readerConversions: usage[usageIndex].readerConversions + (params.workflowType === "invoice_reader" ? 1 : 0),
          lastActivityAt: nowIso(),
        };
      }

      saveMockDocuments(documents);
      saveMockExtractedData(extracted);
      saveMockOutputs(outputs);
      saveMockAuditLogs(auditLogs);
      saveMockUsage(usage);

      return {
        document: stagedDocument,
        extractedData,
        outputs: [output],
        stage: nextStatus === "needs_review" ? "needs_review" : "complete",
      };
    }

    const services = getAppwriteServices();
    if (!services) {
      throw new Error("Appwrite services are unavailable.");
    }

    const execution = await services.functions.createExecution(
      FUNCTIONS.PROCESS_DOCUMENT,
      JSON.stringify({
        documentId: params.documentId,
        workflowType: params.workflowType,
        outputFormat: params.outputFormat,
      }),
      false,
    );

    if (execution.responseBody) {
      const parsed = parseJsonString<{ ok?: boolean; error?: string }>(execution.responseBody, {});
      if (parsed.ok === false) {
        throw new Error(parsed.error || "Document processing failed.");
      }
    }

    const document = await pollDocumentUntilSettled(params.documentId);
    const detail = await this.getDocumentDetail(params.documentId);
    if (!detail?.extractedData) {
      throw new Error("Processed document did not return extracted data.");
    }

    return {
      document,
      extractedData: detail.extractedData,
      outputs: detail.outputs,
      stage: document.status === "needs_review" ? "needs_review" : document.status === "failed" ? "failed" : "complete",
    };
  },
  async updateExtractedData(extractedDataId: string, updates: Partial<ExtractedData>): Promise<ExtractedData> {
    if (USE_MOCKS) {
      const items = readMockExtractedData();
      const next = items.map((item) =>
        item.id === extractedDataId ? { ...item, ...updates, updatedAt: nowIso() } : item,
      );
      saveMockExtractedData(next);
      return next.find((item) => item.id === extractedDataId) as ExtractedData;
    }

    const services = getAppwriteServices();
    if (!services) {
      throw new Error("Appwrite services are unavailable.");
    }

    const document = await services.databases.updateDocument(DATABASE_ID, COLLECTIONS.EXTRACTED_DATA, extractedDataId, {
      ...updates,
      lineItems: updates.lineItems ? JSON.stringify(updates.lineItems) : undefined,
      rawExtractedJson: updates.rawExtractedJson ? JSON.stringify(updates.rawExtractedJson) : undefined,
      normalizedJson: updates.normalizedJson ? JSON.stringify(updates.normalizedJson) : undefined,
      updatedAt: nowIso(),
    });
    return mapExtractedData(document);
  },
  async deleteDocument(documentId: string): Promise<void> {
    if (USE_MOCKS) {
      const document = readMockDocuments().find((item) => item.id === documentId);
      saveMockDocuments(readMockDocuments().filter((item) => item.id !== documentId));
      if (document) {
        mockAuditLog({
          actorUserId: document.userId,
          targetUserId: document.userId,
          action: "document.deleted",
          entityType: "document",
          entityId: documentId,
          metadata: { mock: true },
        });
      }
      return;
    }

    const services = getAppwriteServices();
    if (!services) {
      throw new Error("Appwrite services are unavailable.");
    }

    const document = mapDocument(await services.databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId));
    if (document.originalFileId) {
      await services.storage.deleteFile(STORAGE_BUCKET_ID, document.originalFileId).catch(() => undefined);
    }
    await Promise.all(
      document.generatedFileIds.map((fileId) =>
        services.storage.deleteFile(STORAGE_BUCKET_ID, fileId).catch(() => undefined),
      ),
    );
    await services.databases.deleteDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId);
    await createClientAuditLog(services, {
      actorUserId: document.userId,
      targetUserId: document.userId,
      action: "document.deleted",
      entityType: "document",
      entityId: documentId,
      metadata: { source: "frontend" },
    }).catch(() => undefined);
  },
  async getAuditLogs(): Promise<AuditLog[]> {
    if (USE_MOCKS) {
      return readMockAuditLogs();
    }

    const services = getAppwriteServices();
    if (!services) {
      return [];
    }

    const response = await services.databases.listDocuments(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, [
      Query.orderDesc("createdAt"),
      Query.limit(100),
    ]);
    return response.documents.map(mapAuditLog);
  },
  async getUsage(userId: string): Promise<UserUsage | undefined> {
    if (USE_MOCKS) {
      return readMockUsage().find((item) => item.userId === userId);
    }

    const services = getAppwriteServices();
    if (!services) {
      return undefined;
    }

    const document = await services.databases.getDocument(DATABASE_ID, COLLECTIONS.USER_USAGE, userId);
    return {
      id: document.$id,
      userId: document.userId,
      documentsProcessed: Number(document.documentsProcessed),
      eInvoicesCreated: Number(document.eInvoicesCreated),
      readerConversions: Number(document.readerConversions),
      failedJobs: Number(document.failedJobs),
      lastActivityAt: document.lastActivityAt,
    };
  },
  async getAdminMetrics(): Promise<AdminMetrics> {
    if (USE_MOCKS) {
      return mockAdminMetrics;
    }

    const [profiles, documents] = await Promise.all([this.listProfiles(), this.listDocuments(null)]);
    const totalConfidence = documents.reduce((sum, item) => sum + item.confidenceScore, 0);
    return {
      totalUsers: profiles.length,
      activeUsers: profiles.filter((item) => item.status === "active").length,
      documentsProcessed: documents.length,
      failedDocuments: documents.filter((item) => item.status === "failed").length,
      eInvoicesCreated: documents.filter((item) => item.workflowType === "e_invoice_creator").length,
      averageConfidence: documents.length ? totalConfidence / documents.length : 0,
    };
  },
  async impersonateUser(adminProfile: Profile, targetUserId: string) {
    const target = USE_MOCKS
      ? readMockProfiles().find((item) => item.userId === targetUserId)
      : (await this.listProfiles()).find((item) => item.userId === targetUserId);

    if (!target) {
      throw new Error("Target user not found.");
    }

    if (USE_MOCKS) {
      mockAuditLog({
        actorUserId: adminProfile.userId,
        targetUserId,
        action: "admin.impersonation_started",
        entityType: "profile",
        entityId: target.id,
        metadata: { strategy: "frontend-placeholder", explicit: true },
      });
    } else {
      const services = getAppwriteServices();
      if (services) {
        await createClientAuditLog(services, {
          actorUserId: adminProfile.userId,
          targetUserId,
          action: "admin.impersonation_started",
          entityType: "profile",
          entityId: target.id,
          metadata: {
            explicit: true,
            strategy: "frontend-placeholder",
            note: "TODO: Replace with secure Appwrite-supported admin impersonation flow.",
          },
        }).catch(() => undefined);
      }
    }

    return target;
  },
};
