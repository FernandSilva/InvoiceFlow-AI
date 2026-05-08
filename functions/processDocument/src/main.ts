import { AppwriteException, ID, Permission, Role } from "node-appwrite";
import { buildAuditEvent } from "../../shared/audit";
import { getAIProvider } from "../../shared/ai/aiProvider";
import { getAppwriteAdmin, getBackendConfig } from "../../shared/appwriteAdmin";
import { functionLogger } from "../../shared/logger";
import { generateOutputBuffer } from "../../shared/outputGenerators";
import { buildOutputFilePath, STORAGE_BUCKET_ID } from "../../shared/storagePaths";
import { validateInvoiceData } from "../../shared/validation";
import type { ProcessDocumentPayload } from "../../shared/types";

export default async ({ req, res }: { req: any; res: any }) => {
  const {
    databaseId,
    collectionProfiles,
    collectionDocuments,
    collectionExtractedData,
    collectionAuditLogs,
    collectionUserUsage,
  } =
    getBackendConfig();
  const admin = getAppwriteAdmin();
  const storageBucketId = process.env.STORAGE_BUCKET_ID || STORAGE_BUCKET_ID;

  const logAppwriteOperationError = (operation: string, error: unknown, meta?: Record<string, unknown>) => {
    if (error instanceof AppwriteException) {
      functionLogger.error("processDocument", `Appwrite operation failed: ${operation}`, {
        operation,
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
        ...meta,
      });
      return;
    }

    functionLogger.error("processDocument", `Non-Appwrite operation failed: ${operation}`, {
      operation,
      error: error instanceof Error ? error.message : "Unknown error",
      ...meta,
    });
  };

  const buildFallbackInvoiceNumber = (documentId: string, isoDate: string) => {
    const year = new Date(isoDate).getUTCFullYear() || new Date().getUTCFullYear();
    const shortDocumentId = documentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "DOC001";
    return `INV-${year}-${shortDocumentId}`;
  };

  const failProcessing = async ({
    documentId,
    actorUserId,
    targetUserId,
    errorMessage,
    ipAddress,
  }: {
    documentId: string;
    actorUserId: string;
    targetUserId?: string;
    errorMessage: string;
    ipAddress: string;
  }) => {
    functionLogger.error("processDocument", "Failing document processing.", {
      documentId,
      actorUserId,
      targetUserId,
      errorMessage,
      ipAddress,
    });
    const auditPermissions = targetUserId
      ? [
          Permission.read(Role.user(targetUserId)),
          Permission.update(Role.user(targetUserId)),
          Permission.delete(Role.user(targetUserId)),
        ]
      : [];

    await admin.databases
      .updateDocument(databaseId, collectionDocuments, documentId, {
        status: "failed",
        errorMessage,
        updatedAt: new Date().toISOString(),
      })
      .catch(() => undefined);

    if (targetUserId) {
      const usage = await admin.databases.getDocument(databaseId, collectionUserUsage, targetUserId).catch(() => null);
      if (usage) {
        await admin.databases
          .updateDocument(databaseId, collectionUserUsage, targetUserId, {
            failedJobs: Number(usage.failedJobs || 0) + 1,
            lastActivityAt: new Date().toISOString(),
          })
          .catch(() => undefined);
      }
    }

    await admin.databases
      .createDocument(
        databaseId,
        collectionAuditLogs,
        ID.unique(),
        buildAuditEvent({
          actorUserId,
          targetUserId,
          action: "document.processing_failed",
          entityType: "document",
          entityId: documentId,
          metadata: { errorMessage },
          ipAddress,
        }),
        auditPermissions,
      )
      .catch(() => undefined);
  };

  try {
    const payload = JSON.parse(req.body || "{}") as ProcessDocumentPayload;
    const actorUserId = req.headers["x-appwrite-user-id"];
    const ipAddress = req.headers["x-forwarded-for"] || "unknown";
    functionLogger.info("processDocument", "Function invoked.", {
      payload,
      actorUserId,
      ipAddress,
    });

    if (!actorUserId) {
      functionLogger.warn("processDocument", "Authentication missing for execution.");
      return res.json({ error: "Authentication required." }, 401);
    }

    if (!payload.documentId || !payload.workflowType || !payload.outputFormat) {
      functionLogger.warn("processDocument", "Required payload fields are missing.", { payload });
      return res.json({ ok: false, error: "documentId, workflowType, and outputFormat are required." }, 400);
    }

    if (!["invoice_reader", "e_invoice_creator"].includes(payload.workflowType)) {
      functionLogger.warn("processDocument", "Invalid workflowType supplied.", { workflowType: payload.workflowType });
      return res.json({ ok: false, error: "Invalid workflowType." }, 400);
    }

    if (!["xlsx", "docx", "pdf", "json", "xml"].includes(payload.outputFormat)) {
      functionLogger.warn("processDocument", "Invalid outputFormat supplied.", { outputFormat: payload.outputFormat });
      return res.json({ ok: false, error: "Invalid outputFormat." }, 400);
    }

    functionLogger.info("processDocument", "Fetching document with admin client", {
      documentId: payload.documentId,
      actorUserId,
    });
    let document;
    try {
      document = await admin.databases.getDocument(databaseId, collectionDocuments, payload.documentId);
    } catch (error) {
      logAppwriteOperationError("databases.getDocument(documents)", error, {
        documentId: payload.documentId,
        actorUserId,
      });
      throw error;
    }
    functionLogger.info("processDocument", "Document fetched", {
      documentId: payload.documentId,
      ownerUserId: document.userId,
      originalFileId: document.originalFileId,
      currentStatus: document.status,
    });

    functionLogger.info("processDocument", "Checking ownership", {
      documentId: payload.documentId,
      actorUserId,
      ownerUserId: document.userId,
    });
    let actorProfile: any = null;
    try {
      actorProfile = await admin.databases.getDocument(databaseId, collectionProfiles, actorUserId);
    } catch (error) {
      logAppwriteOperationError("databases.getDocument(profiles)", error, {
        actorUserId,
        documentId: payload.documentId,
      });
    }
    const actorIsAdmin = actorProfile?.role === "admin";
    if (document.userId !== actorUserId && !actorIsAdmin) {
      functionLogger.warn("processDocument", "Ownership check failed.", {
        actorUserId,
        ownerUserId: document.userId,
        actorRole: actorProfile?.role || "unknown",
      });
      return res.json({ error: "Forbidden." }, 403);
    }
    functionLogger.info("processDocument", "Loaded source document record.", {
      documentId: payload.documentId,
      ownerUserId: document.userId,
      originalFileId: document.originalFileId,
      originalFileName: document.originalFileName,
      currentStatus: document.status,
    });
    functionLogger.info("processDocument", "Ownership authorized", {
      documentId: payload.documentId,
      actorUserId,
      actorRole: actorProfile?.role || "user",
    });

    functionLogger.info("processDocument", "Setting document status to processing", {
      documentId: payload.documentId,
    });
    try {
      await admin.databases.updateDocument(databaseId, collectionDocuments, payload.documentId, {
        status: "processing",
        errorMessage: "",
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logAppwriteOperationError("databases.updateDocument(set-processing)", error, {
        documentId: payload.documentId,
      });
      throw error;
    }

    functionLogger.info("processDocument", "Downloading file with admin storage client", {
      documentId: payload.documentId,
      fileId: document.originalFileId,
      storageBucketId,
    });
    let file;
    try {
      file = await admin.storage.getFileDownload(storageBucketId, document.originalFileId);
    } catch (error) {
      logAppwriteOperationError("storage.getFileDownload", error, {
        documentId: payload.documentId,
        fileId: document.originalFileId,
        storageBucketId,
      });
      throw error;
    }
    const fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    functionLogger.info("processDocument", "Downloaded source file from storage.", {
      documentId: payload.documentId,
      originalFileId: document.originalFileId,
      bytes: fileBuffer.byteLength,
      mimeType: document.originalMimeType,
    });

    const provider = getAIProvider();
    functionLogger.info("processDocument", "Selected AI provider.", { provider: provider.name });
    const extracted = await provider.processDocument({
      fileName: document.originalFileName,
      mimeType: document.originalMimeType,
      workflowType: payload.workflowType,
      outputFormat: payload.outputFormat,
      fileBuffer,
    });

    const extractedValidationIssues = [...extracted.validationIssues];
    let invoiceNumber = extracted.invoiceNumber;

    if (!invoiceNumber && payload.workflowType === "e_invoice_creator") {
      invoiceNumber = buildFallbackInvoiceNumber(payload.documentId, extracted.invoiceDate || new Date().toISOString());
      extractedValidationIssues.push("Invoice number missing in source document. Temporary MVP invoice number generated.");
      functionLogger.warn("processDocument", "Fallback invoice number generated.", {
        documentId: payload.documentId,
        generatedInvoiceNumber: invoiceNumber,
      });
    }

    const normalizedInvoice = {
      supplierName: extracted.supplierName,
      supplierTaxId: extracted.supplierTaxId,
      supplierAddress: extracted.supplierAddress,
      buyerName: extracted.buyerName,
      buyerTaxId: extracted.buyerTaxId,
      buyerAddress: extracted.buyerAddress,
      invoiceNumber,
      invoiceDate: extracted.invoiceDate,
      dueDate: extracted.dueDate,
      currency: extracted.currency,
      subtotal: extracted.subtotal,
      taxTotal: extracted.taxTotal,
      total: extracted.total,
      lineItems: extracted.lineItems,
      workflowType: payload.workflowType,
      outputFormat: payload.outputFormat,
      confidenceScore: extracted.confidenceScore,
      rawNotes: extracted.rawNotes,
    };

    const normalizedForValidation = {
      ...extracted,
      invoiceNumber,
      validationIssues: extractedValidationIssues,
    };

    const ownerDocumentPermissions = [
      Permission.read(Role.user(document.userId)),
      Permission.update(Role.user(document.userId)),
      Permission.delete(Role.user(document.userId)),
    ];

    const ownerFilePermissions = [
      Permission.read(Role.user(document.userId)),
      Permission.update(Role.user(document.userId)),
      Permission.delete(Role.user(document.userId)),
    ];

    const validationIssues = [
      ...new Set([...extractedValidationIssues, ...validateInvoiceData(normalizedForValidation, payload.workflowType)]),
    ];
    functionLogger.info("processDocument", "Normalized extraction prepared.", {
      documentId: payload.documentId,
      invoiceNumber,
      confidenceScore: extracted.confidenceScore,
      validationIssueCount: validationIssues.length,
      validationIssues,
    });
    functionLogger.info("processDocument", "Creating extracted_data with admin client", {
      documentId: payload.documentId,
      ownerUserId: document.userId,
    });
    let extractedData;
    try {
      extractedData = await admin.databases.createDocument(
        databaseId,
        collectionExtractedData,
        ID.unique(),
        {
          documentId: payload.documentId,
          userId: document.userId,
          supplierName: extracted.supplierName,
          supplierTaxId: extracted.supplierTaxId,
          supplierAddress: extracted.supplierAddress,
          buyerName: extracted.buyerName,
          buyerTaxId: extracted.buyerTaxId,
          buyerAddress: extracted.buyerAddress,
          invoiceNumber,
          invoiceDate: extracted.invoiceDate,
          dueDate: extracted.dueDate,
          currency: extracted.currency,
          subtotal: extracted.subtotal,
          taxTotal: extracted.taxTotal,
          total: extracted.total,
          lineItems: JSON.stringify(extracted.lineItems),
          rawExtractedJson: JSON.stringify({
            ...extracted,
            invoiceNumber,
            validationIssues,
          }),
          normalizedJson: JSON.stringify(normalizedInvoice),
          validationIssues,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ownerDocumentPermissions,
      );
    } catch (error) {
      logAppwriteOperationError("databases.createDocument(extracted_data)", error, {
        documentId: payload.documentId,
        ownerUserId: document.userId,
      });
      throw error;
    }
    functionLogger.info("processDocument", "Created extracted_data record.", {
      documentId: payload.documentId,
      extractedDataId: extractedData.$id,
    });

    const output = generateOutputBuffer(normalizedForValidation, payload.outputFormat);
    const outputPath = buildOutputFilePath(
      document.userId,
      payload.documentId,
      `invoice-output.${output.extension}`,
    );
    functionLogger.info("processDocument", "Creating generated output with admin storage client", {
      documentId: payload.documentId,
      outputPath,
      storageBucketId,
    });
    let outputFile;
    try {
      outputFile = await admin.storage.createFile(
        storageBucketId,
        ID.unique(),
        new File([output.buffer], outputPath, { type: output.mimeType }),
        ownerFilePermissions,
      );
    } catch (error) {
      logAppwriteOperationError("storage.createFile(output)", error, {
        documentId: payload.documentId,
        outputPath,
        storageBucketId,
      });
      throw error;
    }
    functionLogger.info("processDocument", "Created output file.", {
      documentId: payload.documentId,
      outputFileId: outputFile.$id,
      outputPath,
      outputFormat: payload.outputFormat,
    });

    const needsReview = validationIssues.length > 0 || extracted.confidenceScore < 0.75;
    const nextStatus = needsReview ? "needs_review" : "completed";

    functionLogger.info("processDocument", "Updating final document status", {
      documentId: payload.documentId,
      nextStatus,
    });
    try {
      await admin.databases.updateDocument(databaseId, collectionDocuments, payload.documentId, {
        status: nextStatus,
        generatedFileIds: [...(Array.isArray(document.generatedFileIds) ? document.generatedFileIds : []), outputFile.$id],
        extractedDataId: extractedData.$id,
        confidenceScore: extracted.confidenceScore,
        complianceStatus:
          payload.workflowType === "e_invoice_creator"
            ? needsReview
              ? "needs_review"
              : "ready"
            : "not_applicable",
        errorMessage: validationIssues.length ? validationIssues.join(" | ") : "",
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logAppwriteOperationError("databases.updateDocument(final-status)", error, {
        documentId: payload.documentId,
        nextStatus,
      });
      throw error;
    }
    functionLogger.info("processDocument", "Updated document record after processing.", {
      documentId: payload.documentId,
      nextStatus,
      complianceStatus:
        payload.workflowType === "e_invoice_creator"
          ? needsReview
            ? "needs_review"
            : "ready"
          : "not_applicable",
      generatedFileId: outputFile.$id,
      extractedDataId: extractedData.$id,
    });

    const usage = await admin.databases.getDocument(databaseId, collectionUserUsage, document.userId).catch(() => null);
    if (usage) {
      try {
        await admin.databases.updateDocument(databaseId, collectionUserUsage, document.userId, {
          documentsProcessed: Number(usage.documentsProcessed || 0) + 1,
          eInvoicesCreated:
            Number(usage.eInvoicesCreated || 0) + (payload.workflowType === "e_invoice_creator" ? 1 : 0),
          readerConversions:
            Number(usage.readerConversions || 0) + (payload.workflowType === "invoice_reader" ? 1 : 0),
          failedJobs: Number(usage.failedJobs || 0),
          lastActivityAt: new Date().toISOString(),
        });
      } catch (error) {
        logAppwriteOperationError("databases.updateDocument(user_usage)", error, {
          documentId: payload.documentId,
          userId: document.userId,
        });
        throw error;
      }
      functionLogger.info("processDocument", "Updated user usage counters.", {
        userId: document.userId,
        documentsProcessed: Number(usage.documentsProcessed || 0) + 1,
      });
    }

    try {
      await admin.databases.createDocument(
        databaseId,
        collectionAuditLogs,
        ID.unique(),
        buildAuditEvent({
          actorUserId,
          targetUserId: document.userId,
          action: "document.processed",
          entityType: "document",
          entityId: payload.documentId,
          metadata: { workflowType: payload.workflowType, outputFormat: payload.outputFormat, provider: provider.name },
          ipAddress,
        }),
        ownerDocumentPermissions,
      );
    } catch (error) {
      logAppwriteOperationError("databases.createDocument(audit_logs)", error, {
        documentId: payload.documentId,
        actorUserId,
      });
      throw error;
    }
    functionLogger.info("processDocument", "Created success audit log.", {
      documentId: payload.documentId,
      actorUserId,
      provider: provider.name,
    });

    return res.json({
      ok: true,
      documentId: payload.documentId,
      extractedDataId: extractedData.$id,
      generatedFileId: outputFile.$id,
      status: nextStatus,
      validationIssues,
    });
  } catch (error) {
    logAppwriteOperationError("processDocument.catch", error);
    const payload = JSON.parse(req.body || "{}") as Partial<ProcessDocumentPayload>;
    const userId = req.headers["x-appwrite-user-id"] || "unknown";
    const ipAddress = req.headers["x-forwarded-for"] || "unknown";
    if (payload.documentId) {
      const document = await admin.databases.getDocument(databaseId, collectionDocuments, payload.documentId).catch((lookupError) => {
        logAppwriteOperationError("databases.getDocument(catch-lookup)", lookupError, {
          documentId: payload.documentId,
        });
        return null;
      });
      await failProcessing({
        documentId: payload.documentId,
        actorUserId: userId,
        targetUserId: document?.userId,
        errorMessage: error instanceof Error ? error.message : "Unknown processing error.",
        ipAddress,
      });
    }
    return res.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown processing error.",
      },
      500,
    );
  }
};
