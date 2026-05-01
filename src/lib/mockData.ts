import type {
  AdminMetrics,
  AuditLog,
  DocumentDetail,
  DocumentRecord,
  ExtractedData,
  GeneratedOutput,
  Profile,
  UserUsage,
} from "../types";

const now = new Date().toISOString();

export const mockProfiles: Profile[] = [
  {
    id: "admin-user",
    userId: "admin-user",
    email: "admin@invoiceflow.ai",
    fullName: "Helena Carter",
    companyName: "InvoiceFlow AI",
    role: "admin",
    status: "active",
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-001",
    userId: "user-001",
    email: "ops@northstar-trading.com",
    fullName: "Daniel Meyer",
    companyName: "Northstar Trading GmbH",
    role: "user",
    status: "active",
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockDocuments: DocumentRecord[] = [
  {
    id: "doc-001",
    userId: "user-001",
    originalFileId: "file-001",
    originalFileName: "northstar-april-invoice.pdf",
    originalMimeType: "application/pdf",
    originalSize: 235000,
    workflowType: "invoice_reader",
    status: "completed",
    requestedOutputFormat: "json",
    generatedFileIds: ["out-001"],
    extractedDataId: "extract-001",
    confidenceScore: 0.94,
    complianceStatus: "not_applicable",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "doc-002",
    userId: "user-001",
    originalFileId: "file-002",
    originalFileName: "supplier-einvoice-source.png",
    originalMimeType: "image/png",
    originalSize: 182000,
    workflowType: "e_invoice_creator",
    status: "needs_review",
    requestedOutputFormat: "xml",
    generatedFileIds: ["out-002"],
    extractedDataId: "extract-002",
    confidenceScore: 0.81,
    complianceStatus: "needs_review",
    createdAt: now,
    updatedAt: now,
  },
];

const lineItems = [
  {
    id: "line-001",
    description: "Consulting services - financial systems migration",
    quantity: 1,
    unitPrice: 4200,
    taxRate: 21,
    netAmount: 4200,
    taxAmount: 882,
    totalAmount: 5082,
  },
  {
    id: "line-002",
    description: "Document parsing support package",
    quantity: 2,
    unitPrice: 350,
    taxRate: 21,
    netAmount: 700,
    taxAmount: 147,
    totalAmount: 847,
  },
];

export const mockExtractedData: ExtractedData[] = [
  {
    id: "extract-001",
    documentId: "doc-001",
    userId: "user-001",
    supplierName: "Northstar Services Ltd.",
    supplierTaxId: "GB123456789",
    supplierAddress: "1 Bishopsgate, London, United Kingdom",
    buyerName: "Northstar Trading GmbH",
    buyerTaxId: "DE987654321",
    buyerAddress: "Leopoldstrasse 24, Munich, Germany",
    invoiceNumber: "NS-2026-0415",
    invoiceDate: "2026-04-15",
    dueDate: "2026-05-15",
    currency: "EUR",
    subtotal: 4900,
    taxTotal: 1029,
    total: 5929,
    lineItems,
    rawExtractedJson: { source: "mockProvider", pages: 2 },
    normalizedJson: { vatScheme: "standard", payableAmount: 5929 },
    validationIssues: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "extract-002",
    documentId: "doc-002",
    userId: "user-001",
    supplierName: "Acme Industrial S.L.",
    supplierTaxId: "ESB12398765",
    supplierAddress: "Calle Serrano 18, Madrid, Spain",
    buyerName: "Northstar Trading GmbH",
    buyerTaxId: "DE987654321",
    buyerAddress: "Leopoldstrasse 24, Munich, Germany",
    invoiceNumber: "ACME-90313",
    invoiceDate: "2026-04-12",
    dueDate: "2026-05-12",
    currency: "EUR",
    subtotal: 1800,
    taxTotal: 378,
    total: 2178,
    lineItems: lineItems.slice(0, 1),
    rawExtractedJson: { source: "mockProvider", lowConfidenceFields: ["buyerTaxId"] },
    normalizedJson: { peppolReady: false },
    validationIssues: ["Buyer VAT ID should be confirmed before submission."],
    createdAt: now,
    updatedAt: now,
  },
];

export const mockOutputs: GeneratedOutput[] = [
  {
    id: "out-001",
    documentId: "doc-001",
    extractedDataId: "extract-001",
    outputFormat: "json",
    fileName: "northstar-april-invoice.json",
    downloadUrl: "#mock-download-json",
    createdAt: now,
  },
  {
    id: "out-002",
    documentId: "doc-002",
    extractedDataId: "extract-002",
    outputFormat: "xml",
    fileName: "supplier-einvoice.xml",
    downloadUrl: "#mock-download-xml",
    createdAt: now,
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-001",
    actorUserId: "admin-user",
    targetUserId: "user-001",
    action: "admin.impersonation_started",
    entityType: "profile",
    entityId: "user-001",
    metadata: { reason: "Support walkthrough", explicit: true },
    ipAddress: "127.0.0.1",
    createdAt: now,
  },
  {
    id: "audit-002",
    actorUserId: "user-001",
    action: "document.processed",
    entityType: "document",
    entityId: "doc-001",
    metadata: { workflowType: "invoice_reader", outputFormat: "json" },
    ipAddress: "127.0.0.1",
    createdAt: now,
  },
];

export const mockUsage: UserUsage[] = [
  {
    id: "user-001",
    userId: "user-001",
    documentsProcessed: 18,
    eInvoicesCreated: 7,
    readerConversions: 11,
    failedJobs: 1,
    lastActivityAt: now,
  },
];

export const mockAdminMetrics: AdminMetrics = {
  totalUsers: 42,
  activeUsers: 39,
  documentsProcessed: 1240,
  failedDocuments: 31,
  eInvoicesCreated: 388,
  averageConfidence: 0.91,
};

export const getMockDocumentDetail = (documentId: string): DocumentDetail | undefined => {
  const document = mockDocuments.find((item) => item.id === documentId);
  if (!document) {
    return undefined;
  }

  return {
    document,
    extractedData: mockExtractedData.find((item) => item.documentId === documentId),
    outputs: mockOutputs.filter((item) => item.documentId === documentId),
    auditLogs: mockAuditLogs.filter((item) => item.entityId === documentId),
  };
};
