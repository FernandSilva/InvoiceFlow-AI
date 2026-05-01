import OpenAI from "openai";
import type { AIProvider } from "./aiProvider";
import type { ExtractedInvoiceResult, NormalizedInvoiceData } from "../types";

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

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
} as const;

const systemInstructions = `You are an invoice extraction engine for a SaaS app called InvoiceFlow AI.
Extract invoice data from the provided document.
Return only data that is visible or strongly inferable from the document.
Do not invent supplier, buyer, tax, invoice number, or totals.
If a value is missing, return an empty string for string fields, 0 for number fields, and add a validation issue.
Dates should be returned as ISO-style YYYY-MM-DD where possible.
Currency should be ISO currency code where possible, e.g. EUR, GBP, USD.
Line items must preserve item descriptions, quantities, unit prices, tax rates, and totals where visible.
For e_invoice_creator workflow, focus on producing clean normalized invoice data suitable for later XML/e-invoice generation.
For invoice_reader workflow, focus on accurate extraction and conversion.
Return confidenceScore between 0 and 1.
Return validationIssues for missing or inconsistent data.`;

const normalizeInvoiceResult = (result: ExtractedInvoiceResult): NormalizedInvoiceData => {
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
    rawExtractedJson: result as unknown as Record<string, unknown>,
    normalizedJson: {},
    validationIssues: result.validationIssues,
    confidenceScore: Number(result.confidenceScore || 0),
    rawNotes: result.rawNotes,
  };
};

const buildDocumentInput = (fileBuffer: Buffer, fileName: string, mimeType: string) => {
  const base64 = fileBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  if (SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
    return {
      type: "input_image" as const,
      image_url: dataUrl,
    };
  }

  return {
    type: "input_file" as const,
    filename: fileName,
    file_data: dataUrl,
  };
};

export const openaiProvider: AIProvider = {
  name: "openai",
  async processDocument({ fileName, mimeType, workflowType, outputFormat, fileBuffer }) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

    const response = await client.responses.create({
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
              text: `Workflow: ${workflowType}\nRequested output format: ${outputFormat}\nFilename: ${fileName}\nMIME type: ${mimeType}`,
            },
            buildDocumentInput(fileBuffer, fileName, mimeType),
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "extracted_invoice_result",
          strict: true,
          schema: extractionSchema,
        },
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI did not return structured extraction output.");
    }

    let parsed: ExtractedInvoiceResult;
    try {
      parsed = JSON.parse(response.output_text) as ExtractedInvoiceResult;
    } catch {
      throw new Error("OpenAI returned an invalid structured response.");
    }

    return normalizeInvoiceResult(parsed);
  },
};
