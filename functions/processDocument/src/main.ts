import { ID, Permission, Role } from "node-appwrite";
import { buildAuditEvent } from "../../shared/audit";
import { getAIProvider } from "../../shared/ai/aiProvider";
import { getAppwriteAdmin, getBackendConfig } from "../../shared/appwriteAdmin";
import { functionLogger } from "../../shared/logger";
import { generateOutputBuffer } from "../../shared/outputGenerators";
import { buildOutputFilePath, STORAGE_BUCKET_ID } from "../../shared/storagePaths";
import { validateInvoiceData } from "../../shared/validation";
import type { ProcessDocumentPayload } from "../../shared/types";

export default async ({ req, res }: { req: any; res: any }) => {
  const { databaseId, collectionDocuments, collectionExtractedData, collectionAuditLogs, collectionUserUsage } =
    getBackendConfig();
  const admin = getAppwriteAdmin();

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
    const userId = req.headers["x-appwrite-user-id"];
    const userRole = req.headers["x-appwrite-user-role"] === "admin" ? "admin" : "user";
    const ipAddress = req.headers["x-forwarded-for"] || "unknown";
    functionLogger.info("processDocument", "Function invoked.", {
      payload,
      userId,
      userRole,
      ipAddress,
    });

    if (!userId) {
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

    const document = await admin.databases.getDocument(
      databaseId,
      collectionDocuments,
      payload.documentId,
    );
    functionLogger.info("processDocument", "Loaded source document record.", {
      documentId: payload.documentId,
      ownerUserId: document.userId,
      originalFileId: document.originalFileId,
      originalFileName: document.originalFileName,
      currentStatus: document.status,
    });

    if (document.userId !== userId && userRole !== "admin") {
      functionLogger.warn("processDocument", "Forbidden access to document.", {
        requestedBy: userId,
        ownerUserId: document.userId,
      });
      return res.json({ error: "Forbidden." }, 403);
    }

    await admin.databases.updateDocument(
      databaseId,
      collectionDocuments,
      payload.documentId,
      { status: "processing", errorMessage: "", updatedAt: new Date().toISOString() },
    );

    const file = await admin.storage.getFileDownload(process.env.STORAGE_BUCKET_ID || STORAGE_BUCKET_ID, document.originalFileId);
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
    const extractedData = await admin.databases.createDocument(
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
    const outputFile = await admin.storage.createFile(
      process.env.STORAGE_BUCKET_ID || STORAGE_BUCKET_ID,
      ID.unique(),
      new File([output.buffer], outputPath, { type: output.mimeType }),
      ownerFilePermissions,
    );
    functionLogger.info("processDocument", "Created output file.", {
      documentId: payload.documentId,
      outputFileId: outputFile.$id,
      outputPath,
      outputFormat: payload.outputFormat,
    });

    const needsReview = validationIssues.length > 0 || extracted.confidenceScore < 0.75;
    const nextStatus = needsReview ? "needs_review" : "completed";

    await admin.databases.updateDocument(
      databaseId,
      collectionDocuments,
      payload.documentId,
      {
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
      },
    );
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
      await admin.databases.updateDocument(databaseId, collectionUserUsage, document.userId, {
        documentsProcessed: Number(usage.documentsProcessed || 0) + 1,
        eInvoicesCreated:
          Number(usage.eInvoicesCreated || 0) + (payload.workflowType === "e_invoice_creator" ? 1 : 0),
        readerConversions:
          Number(usage.readerConversions || 0) + (payload.workflowType === "invoice_reader" ? 1 : 0),
        failedJobs: Number(usage.failedJobs || 0),
        lastActivityAt: new Date().toISOString(),
      });
      functionLogger.info("processDocument", "Updated user usage counters.", {
        userId: document.userId,
        documentsProcessed: Number(usage.documentsProcessed || 0) + 1,
      });
    }

    await admin.databases.createDocument(
      databaseId,
      collectionAuditLogs,
      ID.unique(),
      buildAuditEvent({
        actorUserId: userId,
        targetUserId: document.userId,
        action: "document.processed",
        entityType: "document",
        entityId: payload.documentId,
        metadata: { workflowType: payload.workflowType, outputFormat: payload.outputFormat, provider: provider.name },
        ipAddress,
      }),
      ownerDocumentPermissions,
    );
    functionLogger.info("processDocument", "Created success audit log.", {
      documentId: payload.documentId,
      actorUserId: userId,
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
    functionLogger.error("processDocument", "Unhandled processing error.", {
      error: error instanceof Error ? error.message : "Unknown processing error.",
    });
    const payload = JSON.parse(req.body || "{}") as Partial<ProcessDocumentPayload>;
    const userId = req.headers["x-appwrite-user-id"] || "unknown";
    const ipAddress = req.headers["x-forwarded-for"] || "unknown";
    if (payload.documentId) {
      const document = await admin.databases.getDocument(databaseId, collectionDocuments, payload.documentId).catch(() => null);
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
