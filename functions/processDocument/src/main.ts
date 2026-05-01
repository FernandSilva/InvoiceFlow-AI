import { ID, InputFile } from "node-appwrite";
import { buildAuditEvent } from "../../shared/audit";
import { getAIProvider } from "../../shared/ai/aiProvider";
import { getAppwriteAdmin, getBackendConfig } from "../../shared/appwriteAdmin";
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
      )
      .catch(() => undefined);
  };

  try {
    const payload = JSON.parse(req.body || "{}") as ProcessDocumentPayload;
    const userId = req.headers["x-appwrite-user-id"];
    const userRole = req.headers["x-appwrite-user-role"] === "admin" ? "admin" : "user";
    const ipAddress = req.headers["x-forwarded-for"] || "unknown";

    if (!userId) {
      return res.json({ error: "Authentication required." }, 401);
    }

    if (!payload.documentId || !payload.workflowType || !payload.outputFormat) {
      return res.json({ ok: false, error: "documentId, workflowType, and outputFormat are required." }, 400);
    }

    if (!["invoice_reader", "e_invoice_creator"].includes(payload.workflowType)) {
      return res.json({ ok: false, error: "Invalid workflowType." }, 400);
    }

    if (!["xlsx", "docx", "pdf", "json", "xml"].includes(payload.outputFormat)) {
      return res.json({ ok: false, error: "Invalid outputFormat." }, 400);
    }

    const document = await admin.databases.getDocument(
      databaseId,
      collectionDocuments,
      payload.documentId,
    );

    if (document.userId !== userId && userRole !== "admin") {
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

    const provider = getAIProvider();
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

    const validationIssues = [
      ...new Set([...extractedValidationIssues, ...validateInvoiceData(normalizedForValidation, payload.workflowType)]),
    ];
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
    );

    const output = generateOutputBuffer(extracted, payload.outputFormat);
    const outputPath = buildOutputFilePath(
      document.userId,
      payload.documentId,
      `invoice-output.${output.extension}`,
    );
    const outputFile = await admin.storage.createFile(
      process.env.STORAGE_BUCKET_ID || STORAGE_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(output.buffer, outputPath),
    );

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
    );

    return res.json({
      ok: true,
      documentId: payload.documentId,
      extractedDataId: extractedData.$id,
      generatedFileId: outputFile.$id,
      status: nextStatus,
      validationIssues,
    });
  } catch (error) {
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
