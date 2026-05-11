export type WorkflowType = "invoice_reader" | "e_invoice_creator";
export type OutputFormat = "xlsx" | "docx" | "pdf" | "json" | "xml";

export interface ProcessDocumentPayload {
  documentId: string;
  workflowType: WorkflowType;
  outputFormat: OutputFormat;
}

export interface ExtractedInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface ExtractedInvoiceResult {
  supplierName: string;
  supplierTaxId: string;
  supplierAddress: string;
  buyerName: string;
  buyerTaxId: string;
  buyerAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  lineItems: ExtractedInvoiceLineItem[];
  confidenceScore: number;
  validationIssues: string[];
  rawNotes: string;
}

export interface NormalizedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface ExtractedInvoiceData {
  supplierName: string;
  supplierTaxId: string;
  supplierAddress: string;
  buyerName: string;
  buyerTaxId: string;
  buyerAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  lineItems: NormalizedLineItem[];
  rawExtractedJson: Record<string, unknown>;
  validationIssues: string[];
  confidenceScore: number;
  rawNotes: string;
}

export interface CanonicalInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface NormalizedInvoice {
  metadata: {
    generatedAt: string;
    sourceDocumentId: string;
    workflowType: WorkflowType;
    outputFormat: OutputFormat;
    confidenceScore: number;
    validationIssues: string[];
  };
  supplier: {
    name: string;
    taxId: string;
    address: string;
  };
  buyer: {
    name: string;
    taxId: string;
    address: string;
  };
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    subtotal: number;
    taxTotal: number;
    total: number;
  };
  lineItems: CanonicalInvoiceLineItem[];
  notes: string;
}

export interface GeneratedOutput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface AuthenticatedFunctionContext {
  userId: string;
  role: "user" | "admin";
  ipAddress: string;
}
