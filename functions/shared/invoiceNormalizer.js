"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCanonicalInvoice = exports.generateInvoiceFlowId = void 0;
const logger_1 = require("./logger");
const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));
const generateInvoiceFlowId = (documentId, userId) => {
    const year = new Date().getUTCFullYear();
    const shortUserId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "USER00";
    const shortDocumentId = documentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "DOC000";
    return `IFAI-${year}-${shortUserId}-${shortDocumentId}`;
};
exports.generateInvoiceFlowId = generateInvoiceFlowId;
const buildCanonicalInvoice = ({ extracted, documentId, sourceFileId, sourceFilename, workflowType, outputFormat, invoiceFlowId, extractionStatus, }) => {
    const generatedAt = new Date().toISOString();
    const invoice = {
        metadata: {
            generatedAt,
            sourceDocumentId: documentId,
            sourceFileId,
            sourceFilename,
            workflowType,
            outputFormat,
            confidenceScore: roundCurrency(extracted.confidenceScore),
            validationIssues: extracted.validationIssues,
            invoiceFlowId,
            extractionStatus,
        },
        supplier: {
            name: extracted.supplierName,
            taxId: extracted.supplierTaxId,
            address: extracted.supplierAddress,
        },
        buyer: {
            name: extracted.buyerName,
            taxId: extracted.buyerTaxId,
            address: extracted.buyerAddress,
        },
        invoice: {
            invoiceNumber: extracted.invoiceNumber,
            invoiceDate: extracted.invoiceDate,
            dueDate: extracted.dueDate,
            currency: extracted.currency,
            subtotal: roundCurrency(extracted.subtotal),
            taxTotal: roundCurrency(extracted.taxTotal),
            total: roundCurrency(extracted.total),
        },
        lineItems: extracted.lineItems.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity || 0),
            unitPrice: roundCurrency(item.unitPrice),
            taxRate: Number(item.taxRate || 0),
            total: roundCurrency(item.totalAmount),
        })),
        notes: extracted.rawNotes || "",
    };
    logger_1.functionLogger.info("invoiceNormalizer", "Built canonical invoice.", {
        sourceDocumentId: documentId,
        sourceFilename,
        workflowType,
        outputFormat,
        lineItemCount: invoice.lineItems.length,
        validationIssueCount: invoice.metadata.validationIssues.length,
        invoiceFlowId,
        extractionStatus,
    });
    return invoice;
};
exports.buildCanonicalInvoice = buildCanonicalInvoice;
