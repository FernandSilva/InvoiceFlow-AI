"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCanonicalInvoice = void 0;
const logger_1 = require("./logger");
const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));
const buildCanonicalInvoice = ({ extracted, documentId, workflowType, outputFormat, }) => {
    const generatedAt = new Date().toISOString();
    const invoice = {
        metadata: {
            generatedAt,
            sourceDocumentId: documentId,
            workflowType,
            outputFormat,
            confidenceScore: roundCurrency(extracted.confidenceScore),
            validationIssues: extracted.validationIssues,
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
        workflowType,
        outputFormat,
        lineItemCount: invoice.lineItems.length,
        validationIssueCount: invoice.metadata.validationIssues.length,
    });
    return invoice;
};
exports.buildCanonicalInvoice = buildCanonicalInvoice;
