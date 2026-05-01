export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended" | "deleted";
export type WorkflowType = "invoice_reader" | "e_invoice_creator";
export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review";
export type OutputFormat = "xlsx" | "docx" | "pdf" | "json" | "xml";
export type ComplianceStatus = "not_applicable" | "draft" | "needs_review" | "ready";
export type ProcessingStage =
  | "idle"
  | "uploading"
  | "processing"
  | "extracting"
  | "generating"
  | "complete"
  | "needs_review"
  | "failed";

export interface Profile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
  role: UserRole;
  status: UserStatus;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface ExtractedData {
  id: string;
  documentId: string;
  userId: string;
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
  lineItems: LineItem[];
  rawExtractedJson: Record<string, unknown>;
  normalizedJson: Record<string, unknown>;
  validationIssues: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  originalFileId: string;
  originalFileName: string;
  originalMimeType: string;
  originalSize: number;
  workflowType: WorkflowType;
  status: DocumentStatus;
  requestedOutputFormat: OutputFormat;
  generatedFileIds: string[];
  extractedDataId?: string;
  confidenceScore: number;
  complianceStatus: ComplianceStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserUsage {
  id: string;
  userId: string;
  documentsProcessed: number;
  eInvoicesCreated: number;
  readerConversions: number;
  failedJobs: number;
  lastActivityAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export interface DocumentDetail {
  document: DocumentRecord;
  extractedData?: ExtractedData;
  outputs: GeneratedOutput[];
  auditLogs: AuditLog[];
}

export interface GeneratedOutput {
  id: string;
  documentId: string;
  extractedDataId: string;
  outputFormat: OutputFormat;
  fileName: string;
  downloadUrl: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  documentsProcessed: number;
  failedDocuments: number;
  eInvoicesCreated: number;
  averageConfidence: number;
}

export interface ProcessingResult {
  document: DocumentRecord;
  extractedData: ExtractedData;
  outputs: GeneratedOutput[];
  stage: ProcessingStage;
}

export interface InvoiceFormData {
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
  lineItems: LineItem[];
}
