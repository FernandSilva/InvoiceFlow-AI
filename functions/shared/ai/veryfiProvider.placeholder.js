"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.veryfiPlaceholderProvider = void 0;
exports.veryfiPlaceholderProvider = {
    name: "veryfi-placeholder",
    async processDocument() {
        if (!process.env.VERYFI_CLIENT_ID || !process.env.VERYFI_CLIENT_SECRET) {
            throw new Error("Veryfi client credentials are required when AI_PROVIDER=veryfi.");
        }
        // TODO: Implement a real Veryfi extraction workflow.
        throw new Error("Veryfi provider is not implemented yet.");
    },
};
