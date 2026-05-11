"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInvoiceData = void 0;
const logger_1 = require("./logger");
const validateInvoiceData = (data, workflowType) => {
    logger_1.functionLogger.debug("validation", "Validating normalized invoice data.", {
        workflowType,
        invoiceNumber: data.invoice.invoiceNumber,
        supplierName: data.supplier.name,
        buyerName: data.buyer.name,
        currency: data.invoice.currency,
        lineItems: data.lineItems.length,
    });
    const issues = [];
    if (!data.invoice.invoiceNumber)
        issues.push("Invoice number is required.");
    if (!data.supplier.name)
        issues.push("Supplier is required.");
    if (!data.buyer.name)
        issues.push("Buyer is required.");
    if (!data.invoice.invoiceDate)
        issues.push("Invoice date is required.");
    if (!data.invoice.currency)
        issues.push("Currency is required.");
    if (!data.lineItems.length)
        issues.push("At least one line item is required.");
    if (!data.invoice.total)
        issues.push("Invoice total is required.");
    if (!data.invoice.subtotal)
        issues.push("Invoice subtotal is required.");
    if (data.invoice.taxTotal === undefined || data.invoice.taxTotal === null)
        issues.push("Invoice tax total is required.");
    if (workflowType === "e_invoice_creator") {
        if (!data.supplier.taxId)
            issues.push("Supplier tax ID is required for e-invoice readiness.");
        if (!data.supplier.address)
            issues.push("Supplier address is required for e-invoice readiness.");
        if (!data.buyer.address)
            issues.push("Buyer address is required for e-invoice readiness.");
    }
    const computedSubtotal = data.lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
    const computedTotal = data.lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const computedTax = Number((computedTotal - computedSubtotal).toFixed(2));
    if (Math.abs(computedSubtotal - data.invoice.subtotal) > 0.01) {
        issues.push("Subtotal does not match line items.");
    }
    if (Math.abs(computedTax - data.invoice.taxTotal) > 0.01) {
        issues.push("Tax total does not match line items.");
    }
    if (Math.abs(computedTotal - data.invoice.total) > 0.01) {
        issues.push("Total does not match line items.");
    }
    logger_1.functionLogger.info("validation", "Validation completed.", {
        workflowType,
        issueCount: issues.length,
        issues,
    });
    return issues;
};
exports.validateInvoiceData = validateInvoiceData;
