"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anthropicPlaceholderProvider = void 0;
exports.anthropicPlaceholderProvider = {
    name: "anthropic-placeholder",
    async processDocument() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic.");
        }
        // TODO: Implement a real Anthropic-backed extraction workflow.
        throw new Error("Anthropic provider is not implemented yet.");
    },
};
