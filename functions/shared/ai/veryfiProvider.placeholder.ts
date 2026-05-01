import type { AIProvider } from "./aiProvider";

export const veryfiPlaceholderProvider: AIProvider = {
  name: "veryfi-placeholder",
  async processDocument() {
    if (!process.env.VERYFI_CLIENT_ID || !process.env.VERYFI_CLIENT_SECRET) {
      throw new Error("Veryfi client credentials are required when AI_PROVIDER=veryfi.");
    }

    // TODO: Implement a real Veryfi extraction workflow.
    throw new Error("Veryfi provider is not implemented yet. Use AI_PROVIDER=mock for MVP mode.");
  },
};
