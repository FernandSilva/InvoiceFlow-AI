"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIProvider = void 0;
const openaiProvider_1 = require("./openaiProvider");
const azureProvider_placeholder_1 = require("./azureProvider.placeholder");
const anthropicProvider_placeholder_1 = require("./anthropicProvider.placeholder");
const veryfiProvider_placeholder_1 = require("./veryfiProvider.placeholder");
const getAIProvider = () => {
    const provider = process.env.AI_PROVIDER || "openai";
    switch (provider) {
        case "openai":
            return openaiProvider_1.openaiProvider;
        case "azure-document-intelligence":
            return azureProvider_placeholder_1.azurePlaceholderProvider;
        case "anthropic":
            return anthropicProvider_placeholder_1.anthropicPlaceholderProvider;
        case "veryfi":
            return veryfiProvider_placeholder_1.veryfiPlaceholderProvider;
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
};
exports.getAIProvider = getAIProvider;
