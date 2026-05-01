import type { OutputFormat, WorkflowType } from "../types";

export const APP_NAME = import.meta.env.VITE_APP_NAME || "InvoiceFlow AI";
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || "69f37b080009c77bacc1";

export const DATABASE_ID = "69f3813a00274d97c7c5";

export const COLLECTIONS = {
  PROFILES: "profiles",
  DOCUMENTS: "documents",
  EXTRACTED_DATA: "extracted_data",
  AUDIT_LOGS: "audit_logs",
  USER_USAGE: "user_usage",
} as const;

export const STORAGE_BUCKET_ID = "69f4baed0038dc6f98a8";

export const FUNCTIONS = {
  PROCESS_DOCUMENT: "processDocument",
  DELETE_USER_DATA: "deleteUserData",
} as const;

export const OUTPUT_FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "docx", label: "Word (.docx)" },
  { value: "pdf", label: "PDF" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
];

export const WORKFLOW_OPTIONS: { value: WorkflowType; label: string; description: string }[] = [
  {
    value: "invoice_reader",
    label: "Invoice Reader & Converter",
    description: "Extract fields, validate totals, and export clean outputs from almost any document.",
  },
  {
    value: "e_invoice_creator",
    label: "Create E-Invoice",
    description: "Normalize invoice data into structured records designed for digital invoicing workflows.",
  },
];

export const ROUTES = {
  landing: "/",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  login: "/login",
  register: "/register",
  dashboard: "/app/dashboard",
  onboarding: "/app/onboarding",
  invoiceReader: "/app/invoice-reader",
  eInvoiceCreator: "/app/e-invoice-creator",
  documents: "/app/documents",
  profile: "/app/profile",
  adminDashboard: "/admin",
  adminUsers: "/admin/users",
  adminDocuments: "/admin/documents",
  adminAuditLogs: "/admin/audit-logs",
} as const;
