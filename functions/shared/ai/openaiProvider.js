"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../logger");
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-nano";
const OPENAI_TIMEOUT_MS = 20000;
const MAX_MVP_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
]);
const extractionSchema = {
    type: "object",
    properties: {
        supplierName: { type: "string" },
        supplierTaxId: { type: "string" },
        supplierAddress: { type: "string" },
        buyerName: { type: "string" },
        buyerTaxId: { type: "string" },
        buyerAddress: { type: "string" },
        invoiceNumber: { type: "string" },
        invoiceDate: { type: "string" },
        dueDate: { type: "string" },
        currency: { type: "string" },
        subtotal: { type: "number" },
        taxTotal: { type: "number" },
        total: { type: "number" },
        lineItems: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    unitPrice: { type: "number" },
                    taxRate: { type: "number" },
                    total: { type: "number" },
                },
                required: ["description", "quantity", "unitPrice", "taxRate", "total"],
                additionalProperties: false,
            },
        },
        confidenceScore: { type: "number" },
        validationIssues: {
            type: "array",
            items: { type: "string" },
        },
        rawNotes: { type: "string" },
    },
    required: [
        "supplierName",
        "supplierTaxId",
        "supplierAddress",
        "buyerName",
        "buyerTaxId",
        "buyerAddress",
        "invoiceNumber",
        "invoiceDate",
        "dueDate",
        "currency",
        "subtotal",
        "taxTotal",
        "total",
        "lineItems",
        "confidenceScore",
        "validationIssues",
        "rawNotes",
    ],
    additionalProperties: false,
};
const systemInstructions = `Extract invoice fields from the document.
Only return visible or strongly inferable values.
Use empty strings or 0 when missing.
Return dates as YYYY-MM-DD where possible.
Return currency as ISO code where possible.
Do not invent invoice data.`;
const clampConfidenceScore = (value) => {
    if (Number.isNaN(value)) {
        return 0;
    }
    return Math.min(1, Math.max(0, value));
};
const hasRequiredInvoiceFields = (result) => Boolean(result.supplierName &&
    result.buyerName &&
    result.invoiceNumber &&
    result.invoiceDate &&
    result.currency &&
    Number(result.subtotal) > 0 &&
    Number(result.taxTotal) >= 0 &&
    Number(result.total) > 0 &&
    result.lineItems.length > 0);
const normalizeInvoiceResult = (result) => {
    const lineItems = result.lineItems.map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const taxRate = Number(item.taxRate || 0);
        const netAmount = Number((quantity * unitPrice).toFixed(2));
        const totalAmount = Number(item.total || 0);
        const taxAmount = Number((totalAmount - netAmount).toFixed(2));
        return {
            description: item.description,
            quantity,
            unitPrice,
            taxRate,
            netAmount,
            taxAmount,
            totalAmount,
        };
    });
    const originalConfidenceScore = Number(result.confidenceScore);
    const hasValidationIssues = result.validationIssues.length > 0;
    const shouldAutoRaiseConfidence = (!Number.isFinite(originalConfidenceScore) || originalConfidenceScore === 0) &&
        hasRequiredInvoiceFields(result) &&
        !hasValidationIssues;
    let normalizedConfidenceScore = shouldAutoRaiseConfidence ? 0.9 : clampConfidenceScore(Number(result.confidenceScore || 0));
    if (hasValidationIssues) {
        normalizedConfidenceScore = Math.min(normalizedConfidenceScore, 0.74);
    }
    logger_1.functionLogger.info("openaiProvider", "Normalized confidence score", {
        originalConfidenceScore: Number.isFinite(originalConfidenceScore) ? originalConfidenceScore : null,
        normalizedConfidenceScore,
        hasValidationIssues,
        requiredFieldsPresent: hasRequiredInvoiceFields(result),
    });
    return {
        supplierName: result.supplierName,
        supplierTaxId: result.supplierTaxId,
        supplierAddress: result.supplierAddress,
        buyerName: result.buyerName,
        buyerTaxId: result.buyerTaxId,
        buyerAddress: result.buyerAddress,
        invoiceNumber: result.invoiceNumber,
        invoiceDate: result.invoiceDate,
        dueDate: result.dueDate,
        currency: result.currency,
        subtotal: Number(result.subtotal || 0),
        taxTotal: Number(result.taxTotal || 0),
        total: Number(result.total || 0),
        lineItems,
        rawExtractedJson: result,
        normalizedJson: {},
        validationIssues: result.validationIssues,
        confidenceScore: normalizedConfidenceScore,
        rawNotes: result.rawNotes,
    };
};
const buildDocumentInput = (fileBuffer, fileName, mimeType) => {
    const base64 = fileBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    if (SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
        return {
            type: "input_image",
            image_url: dataUrl,
            detail: "auto",
        };
    }
    return {
        type: "input_file",
        filename: fileName,
        file_data: dataUrl,
    };
};
exports.openaiProvider = {
    name: "openai",
    async processDocument({ fileName, mimeType, workflowType, outputFormat, fileBuffer }) {
        if (!process.env.OPENAI_API_KEY) {
            logger_1.functionLogger.error("openaiProvider", "OPENAI_API_KEY is missing.");
            throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
        }
        if (fileBuffer.byteLength > MAX_MVP_FILE_SIZE_BYTES) {
            logger_1.functionLogger.warn("openaiProvider", "File exceeded MVP processing limit.", {
                fileName,
                fileSizeBytes: fileBuffer.byteLength,
                maxFileSizeBytes: MAX_MVP_FILE_SIZE_BYTES,
            });
            throw new Error("File too large for MVP processing. Please upload a smaller invoice.");
        }
        const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
        const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
        const startedAt = Date.now();
        const abortController = new AbortController();
        const timeoutHandle = setTimeout(() => abortController.abort(), OPENAI_TIMEOUT_MS);
        logger_1.functionLogger.info("openaiProvider", "OpenAI request started", {
            model,
            fileName,
            mimeType,
            workflowType,
            outputFormat,
            fileSizeBytes: fileBuffer.byteLength,
            inputType: SUPPORTED_IMAGE_MIME_TYPES.has(mimeType) ? "input_image" : "input_file",
        });
        let response;
        try {
            response = await client.responses.create({
                model,
                input: [
                    {
                        role: "system",
                        content: [{ type: "input_text", text: systemInstructions }],
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: `Workflow: ${workflowType}\nOutput: ${outputFormat}\nFilename: ${fileName}\nMIME type: ${mimeType}`,
                            },
                            buildDocumentInput(fileBuffer, fileName, mimeType),
                        ],
                    },
                ],
                max_output_tokens: 700,
                text: {
                    format: {
                        type: "json_schema",
                        name: "extracted_invoice_result",
                        strict: true,
                        schema: extractionSchema,
                    },
                },
            }, {
                signal: abortController.signal,
            });
        }
        catch (error) {
            const elapsedMs = Date.now() - startedAt;
            if (error?.name === "AbortError") {
                logger_1.functionLogger.error("openaiProvider", "OpenAI request timed out", {
                    model,
                    fileName,
                    elapsedMs,
                    timeoutMs: OPENAI_TIMEOUT_MS,
                });
                throw new Error("OpenAI extraction timed out. Try a smaller file or use mock mode.");
            }
            logger_1.functionLogger.error("openaiProvider", "OpenAI request failed", {
                model,
                fileName,
                elapsedMs,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
        finally {
            clearTimeout(timeoutHandle);
        }
        logger_1.functionLogger.info("openaiProvider", "OpenAI request completed", {
            model,
            responseId: response.id,
            hasOutputText: Boolean(response.output_text),
            elapsedMs: Date.now() - startedAt,
        });
        if (!response.output_text) {
            logger_1.functionLogger.error("openaiProvider", "OpenAI response did not contain output_text.", {
                responseId: response.id,
            });
            throw new Error("OpenAI did not return structured extraction output.");
        }
        let parsed;
        try {
            parsed = JSON.parse(response.output_text);
        }
        catch {
            logger_1.functionLogger.error("openaiProvider", "Failed to parse structured OpenAI response.", {
                responseId: response.id,
                outputPreview: response.output_text.slice(0, 500),
            });
            throw new Error("OpenAI returned an invalid structured response.");
        }
        logger_1.functionLogger.info("openaiProvider", "Structured extraction parsed successfully.", {
            invoiceNumber: parsed.invoiceNumber,
            supplierName: parsed.supplierName,
            buyerName: parsed.buyerName,
            lineItems: parsed.lineItems.length,
            confidenceScore: parsed.confidenceScore,
            validationIssueCount: parsed.validationIssues.length,
        });
        return normalizeInvoiceResult(parsed);
    },
};
