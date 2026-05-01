import type { NormalizedInvoiceData, OutputFormat, WorkflowType } from "../types";
import { mockProvider } from "./mockProvider";
import { openaiProvider } from "./openaiProvider";
import { azurePlaceholderProvider } from "./azureProvider.placeholder";
import { anthropicPlaceholderProvider } from "./anthropicProvider.placeholder";
import { veryfiPlaceholderProvider } from "./veryfiProvider.placeholder";

export interface AIProvider {
  name: string;
  processDocument(args: {
    fileName: string;
    mimeType: string;
    workflowType: WorkflowType;
    outputFormat: OutputFormat;
    fileBuffer: Buffer;
    notes?: string;
  }): Promise<NormalizedInvoiceData>;
}

export const getAIProvider = (): AIProvider => {
  const provider = process.env.AI_PROVIDER || "mock";

  switch (provider) {
    case "openai":
      return openaiProvider;
    case "azure-document-intelligence":
      return azurePlaceholderProvider;
    case "anthropic":
      return anthropicPlaceholderProvider;
    case "veryfi":
      return veryfiPlaceholderProvider;
    default:
      return mockProvider;
  }
};
