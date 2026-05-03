import type { NormalizedInvoiceData, WorkflowType } from "./types";
import { functionLogger } from "./logger";

export const validateInvoiceData = (data: NormalizedInvoiceData, workflowType: WorkflowType) => {
  functionLogger.debug("validation", "Validating normalized invoice data.", {
    workflowType,
    invoiceNumber: data.invoiceNumber,
    supplierName: data.supplierName,
    buyerName: data.buyerName,
    currency: data.currency,
    lineItems: data.lineItems.length,
  });
  const issues: string[] = [];

  if (!data.invoiceNumber) issues.push("Invoice number is required.");
  if (!data.supplierName) issues.push("Supplier is required.");
  if (!data.buyerName) issues.push("Buyer is required.");
  if (!data.invoiceDate) issues.push("Invoice date is required.");
  if (!data.currency) issues.push("Currency is required.");
  if (!data.lineItems.length) issues.push("At least one line item is required.");
  if (!data.total) issues.push("Invoice total is required.");
  if (!data.subtotal) issues.push("Invoice subtotal is required.");
  if (data.taxTotal === undefined || data.taxTotal === null) issues.push("Invoice tax total is required.");

  if (workflowType === "e_invoice_creator") {
    if (!data.supplierTaxId) issues.push("Supplier tax ID is required for e-invoice readiness.");
    if (!data.supplierAddress) issues.push("Supplier address is required for e-invoice readiness.");
    if (!data.buyerAddress) issues.push("Buyer address is required for e-invoice readiness.");
  }

  const computedSubtotal = data.lineItems.reduce((sum, item) => sum + item.netAmount, 0);
  const computedTax = data.lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const computedTotal = data.lineItems.reduce((sum, item) => sum + item.totalAmount, 0);

  if (Math.abs(computedSubtotal - data.subtotal) > 0.01) {
    issues.push("Subtotal does not match line items.");
  }
  if (Math.abs(computedTax - data.taxTotal) > 0.01) {
    issues.push("Tax total does not match line items.");
  }
  if (Math.abs(computedTotal - data.total) > 0.01) {
    issues.push("Total does not match line items.");
  }

  functionLogger.info("validation", "Validation completed.", {
    workflowType,
    issueCount: issues.length,
    issues,
  });
  return issues;
};
