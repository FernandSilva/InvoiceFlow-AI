"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.azurePlaceholderProvider = void 0;
exports.azurePlaceholderProvider = {
    name: "azure-document-intelligence-placeholder",
    async processDocument() {
        if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
            throw new Error("Azure Document Intelligence env vars are required when using the Azure provider.");
        }
        // TODO: Replace with a real Azure Document Intelligence client implementation.
        // Keep credentials inside Appwrite Functions and map raw fields into NormalizedInvoiceData.
        throw new Error("Azure Document Intelligence provider is not implemented yet.");
    },
};
