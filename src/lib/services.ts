import { ID, Query } from "appwrite";
import { getAppwriteServices } from "./appwrite";
import { createClientAuditLog } from "./audit";
import { COLLECTIONS, DATABASE_ID, FUNCTIONS, STORAGE_BUCKET_ID } from "./constants";
import { appLogger } from "./logger";
import type {
  AdminMetrics,
  AuditLog,
  DocumentDetail,
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
  createdAt: document.createdAt || document.$createdAt,
  updatedAt: document.updatedAt || document.$updatedAt,
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

const pollDocumentUntilSettled = async (
  documentId: string,
  attempts = 30,
  intervalMs = 3000,
): Promise<{ document: DocumentRecord; timedOut: boolean }> => {
  const services = getAppwriteServices();
  if (!services) {
    appLogger.error("services", "Polling requested without Appwrite services.", { documentId });
    throw new Error("Appwrite services are unavailable.");
  }

  for (let index = 0; index < attempts; index += 1) {
    const document = await services.databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId);
    const mapped = mapDocument(document);
    appLogger.info("services", "Polling document status", {
      documentId,
      attempt: index + 1,
      status: mapped.status,
    });
    if (mapped.status !== "uploaded" && mapped.status !== "processing") {
      appLogger.info("services", "Document reached settled state.", {
        documentId,
        status: mapped.status,
      });
      return { document: mapped, timedOut: false };
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  const latest = await services.databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId);
  const mapped = mapDocument(latest);
  appLogger.warn("services", "Document polling timed out before reaching a settled state.", {
    documentId,
    status: mapped.status,
  });
  return { document: mapped, timedOut: true };
};

const getOutputMetadata = async (document: DocumentRecord): Promise<GeneratedOutput[]> => {
  const services = getAppwriteServices();
  if (!services) {
    appLogger.warn("services", "Output metadata requested without Appwrite services.", {
      documentId: document.id,
    });
    return [];
  }

  const outputs = await Promise.all(
    document.generatedFileIds.map(async (fileId) => {
      try {
        const file = await services.storage.getFile(STORAGE_BUCKET_ID, fileId);
        appLogger.debug("services", "Loaded output file metadata.", {
          documentId: document.id,
          fileId,
          fileName: file.name,
        });
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
        appLogger.warn("services", "Unable to load output file metadata.", {
          documentId: document.id,
          fileId,
        });
        return undefined;
      }
    }),
  );

  return outputs.filter(Boolean) as GeneratedOutput[];
};

export const platformService = {
  async listProfiles(): Promise<Profile[]> {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.warn("services", "listProfiles called without Appwrite services.");
      return [];
    }

    appLogger.info("services", "Listing profiles.");
    const response = await services.databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ]);
    return response.documents.map(mapProfile);
  },
  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.error("services", "updateProfile called without Appwrite services.", { profileId });
      throw new Error("Appwrite services are unavailable.");
    }

    appLogger.info("services", "Updating profile.", { profileId, updates });
    const document = await services.databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, profileId, {
      ...updates,
      updatedAt: nowIso(),
    });
    return mapProfile(document);
  },
  async listDocuments(profile?: Profile | null): Promise<DocumentRecord[]> {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.warn("services", "listDocuments called without Appwrite services.");
      return [];
    }

    appLogger.info("services", "Listing documents.", {
      userId: profile?.userId,
      role: profile?.role,
    });
    const queries = [Query.orderDesc("$createdAt"), Query.limit(100)];
    if (profile && profile.role !== "admin") {
      queries.push(Query.equal("userId", profile.userId));
    }
    const response = await services.databases.listDocuments(DATABASE_ID, COLLECTIONS.DOCUMENTS, queries);
    return response.documents.map(mapDocument);
  },
  async getDocumentDetail(documentId: string): Promise<DocumentDetail | undefined> {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.warn("services", "getDocumentDetail called without Appwrite services.", { documentId });
      return undefined;
    }

    appLogger.info("services", "Loading document detail.", { documentId });
    const document = mapDocument(await services.databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, documentId));
    const extractedData = document.extractedDataId
      ? await services.databases
          .getDocument(DATABASE_ID, COLLECTIONS.EXTRACTED_DATA, document.extractedDataId)
          .then(mapExtractedData)
          .catch(() => undefined)
      : undefined;
    const logsResponse = await services.databases
      .listDocuments(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, [
        Query.equal("entityId", documentId),
        Query.orderDesc("createdAt"),
        Query.limit(50),
      ])
      .catch(() => ({ documents: [] as any[] }));

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
    const services = getAppwriteServices();
    if (!services) {
      appLogger.error("services", "createDocument called without Appwrite services.", {
        userId: params.profile.userId,
      });
      throw new Error("Appwrite services are unavailable.");
    }

    console.info("[InvoiceFlowAI] Starting storage.createFile", {
      bucketId: STORAGE_BUCKET_ID,
      fileName: params.file.name,
      fileType: params.file.type || "application/octet-stream",
      fileSize: params.file.size,
    });
    const uploadedFile = await services.storage.createFile(STORAGE_BUCKET_ID, ID.unique(), params.file);
    console.info("[InvoiceFlowAI] storage.createFile completed", {
      fileId: uploadedFile.$id,
      bucketId: STORAGE_BUCKET_ID,
    });

    const now = nowIso();
    const documentId = ID.unique();
    console.info("[InvoiceFlowAI] Starting databases.createDocument", {
      databaseId: DATABASE_ID,
      collectionId: COLLECTIONS.DOCUMENTS,
      documentId,
      workflowType: params.workflowType,
      outputFormat: params.outputFormat,
      originalFileId: uploadedFile.$id,
    });
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
    console.info("[InvoiceFlowAI] databases.createDocument completed", {
      documentId: created.$id,
      status: created.status,
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
    const services = getAppwriteServices();
    if (!services) {
      appLogger.error("services", "processDocument called without Appwrite services.", {
        documentId: params.documentId,
      });
      throw new Error("Appwrite services are unavailable.");
    }
    if (!FUNCTIONS.PROCESS_DOCUMENT) {
      appLogger.error("services", "Missing Appwrite function ID environment variable.", {
        functionName: "PROCESS_DOCUMENT",
      });
      throw new Error("Missing Appwrite function ID environment variable.");
    }

    console.info("[InvoiceFlowAI] Starting async functions.createExecution", {
      functionId: FUNCTIONS.PROCESS_DOCUMENT,
      documentId: params.documentId,
      workflowType: params.workflowType,
      outputFormat: params.outputFormat,
      async: true,
    });
    const execution = await services.functions.createExecution(
      FUNCTIONS.PROCESS_DOCUMENT,
      JSON.stringify({
        documentId: params.documentId,
        workflowType: params.workflowType,
        outputFormat: params.outputFormat,
      }),
      true,
    );
    console.info("[InvoiceFlowAI] functions.createExecution completed", {
      functionId: FUNCTIONS.PROCESS_DOCUMENT,
      executionId: execution.$id,
      status: execution.status,
      responseStatusCode: execution.responseStatusCode,
      responseBody: execution.responseBody,
      errors: execution.errors,
    });

    if (!execution.$id) {
      appLogger.error("services", "Function execution failed.", {
        documentId: params.documentId,
        execution,
      });
      throw new Error("Failed to start document processing.");
    }

    appLogger.info("services", "Starting async functions.createExecution", {
      documentId: params.documentId,
      executionId: execution.$id,
      functionId: FUNCTIONS.PROCESS_DOCUMENT,
    });

    const { document, timedOut } = await pollDocumentUntilSettled(params.documentId, 30, 3000);

    if (timedOut) {
      return {
        executionId: execution.$id,
        document,
        outputs: [],
        stage: "processing",
        timedOut: true,
      };
    }

    const detail = await this.getDocumentDetail(params.documentId);

    if (document.status === "completed") {
      appLogger.info("services", "Processing completed", {
        documentId: params.documentId,
        executionId: execution.$id,
      });
    } else if (document.status === "needs_review") {
      appLogger.warn("services", "Processing needs review", {
        documentId: params.documentId,
        executionId: execution.$id,
      });
    } else if (document.status === "failed") {
      appLogger.error("services", "Processing failed", {
        documentId: params.documentId,
        executionId: execution.$id,
        errorMessage: document.errorMessage,
      });
    }

    return {
      executionId: execution.$id,
      document,
      extractedData: detail?.extractedData,
      outputs: detail?.outputs || [],
      stage:
        document.status === "needs_review"
          ? "needs_review"
          : document.status === "failed"
            ? "failed"
            : "completed",
    };
  },
  async updateExtractedData(extractedDataId: string, updates: Partial<ExtractedData>): Promise<ExtractedData> {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.error("services", "updateExtractedData called without Appwrite services.", {
        extractedDataId,
      });
      throw new Error("Appwrite services are unavailable.");
    }

    appLogger.info("services", "Updating extracted data.", {
      extractedDataId,
      updatedKeys: Object.keys(updates),
    });
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
    const services = getAppwriteServices();
    if (!services) {
      appLogger.error("services", "deleteDocument called without Appwrite services.", { documentId });
      throw new Error("Appwrite services are unavailable.");
    }

    appLogger.info("services", "Deleting document.", { documentId });
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
    const services = getAppwriteServices();
    if (!services) {
      appLogger.warn("services", "getAuditLogs called without Appwrite services.");
      return [];
    }

    appLogger.info("services", "Loading audit logs.");
    const response = await services.databases.listDocuments(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, [
      Query.orderDesc("createdAt"),
      Query.limit(100),
    ]);
    return response.documents.map(mapAuditLog);
  },
  async getUsage(userId: string): Promise<UserUsage | undefined> {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.warn("services", "getUsage called without Appwrite services.", { userId });
      return undefined;
    }

    appLogger.info("services", "Loading usage record.", { userId });
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
    appLogger.info("services", "Calculating admin metrics.");
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
    appLogger.info("services", "Starting impersonation simulation.", {
      adminUserId: adminProfile.userId,
      targetUserId,
    });
    const target = (await this.listProfiles()).find((item) => item.userId === targetUserId);

    if (!target) {
      throw new Error("Target user not found.");
    }

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
          strategy: "frontend-simulation",
          note: "This MVP uses a visible support simulation banner and audit trail, not a backend auth bypass.",
        },
      }).catch(() => undefined);
    }

    return target;
  },
};
