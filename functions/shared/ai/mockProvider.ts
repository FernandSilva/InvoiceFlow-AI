import type { AIProvider } from "./aiProvider";

export const mockProvider: AIProvider = {
  name: "mock",
  async processDocument({ workflowType }) {
    const base = {
      supplierName: "Demo Supplies GmbH",
      supplierTaxId: "DE123456789",
      supplierAddress: "Alexanderplatz 1, 10178 Berlin, Germany",
      buyerName: "Example Client Ltd",
      buyerTaxId: "GB123456789",
      buyerAddress: "10 Market Street, London, UK",
      invoiceNumber: "INV-2026-001",
      invoiceDate: "2026-05-01",
      dueDate: "2026-05-15",
      currency: "EUR",
      subtotal: 1000,
      taxTotal: 190,
      total: 1190,
      lineItems: [
        {
          description: "Consulting services",
          quantity: 1,
          unitPrice: 1000,
          taxRate: 19,
          netAmount: 1000,
          taxAmount: 190,
          totalAmount: 1190,
        },
      ],
      rawExtractedJson: { provider: "mock" },
      normalizedJson: {
        schemaVersion: "mvp-1",
        workflowType,
        auditTrailIncluded: true,
      },
      validationIssues:
        workflowType === "e_invoice_creator"
          ? ["Buyer VAT ID should be reviewed before formal submission."]
          : [],
      confidenceScore: 0.92,
      rawNotes: "Mock extraction provider used for MVP mode.",
    };

    return base;
  },
};
