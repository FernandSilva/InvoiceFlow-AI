import type { AIProvider } from "./aiProvider";

export const azurePlaceholderProvider: AIProvider = {
  name: "azure-document-intelligence-placeholder",
  async processDocument() {
    if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
      throw new Error("Azure Document Intelligence env vars are required when using the Azure provider.");
    }

    // TODO: Replace with a real Azure Document Intelligence client implementation.
    // Keep credentials inside Appwrite Functions and map raw fields into NormalizedInvoiceData.
    throw new Error("Azure Document Intelligence provider is not implemented yet. Switch AI_PROVIDER=mock for MVP mode.");
  },
};
