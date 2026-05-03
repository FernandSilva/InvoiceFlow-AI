import type { AIProvider } from "./aiProvider";

export const anthropicPlaceholderProvider: AIProvider = {
  name: "anthropic-placeholder",
  async processDocument() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic.");
    }

    // TODO: Implement a real Anthropic-backed extraction workflow.
    throw new Error("Anthropic provider is not implemented yet.");
  },
};
