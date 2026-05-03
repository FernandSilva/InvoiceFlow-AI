import type { NormalizedInvoiceData, OutputFormat } from "./types";
import { functionLogger } from "./logger";

const asJsonBuffer = (data: NormalizedInvoiceData) => Buffer.from(JSON.stringify(data, null, 2), "utf-8");

const asXmlBuffer = (data: NormalizedInvoiceData) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<invoice>
  <invoiceNumber>${data.invoiceNumber}</invoiceNumber>
  <supplier>${data.supplierName}</supplier>
  <buyer>${data.buyerName}</buyer>
  <currency>${data.currency}</currency>
  <total>${data.total}</total>
</invoice>`;
  return Buffer.from(xml, "utf-8");
};

const asCsvBuffer = (data: NormalizedInvoiceData) => {
  const header = "description,quantity,unitPrice,taxRate,netAmount,taxAmount,totalAmount";
  const rows = data.lineItems.map((item) =>
    [item.description, item.quantity, item.unitPrice, item.taxRate, item.netAmount, item.taxAmount, item.totalAmount].join(","),
  );
  return Buffer.from([header, ...rows].join("\n"), "utf-8");
};

const asDocxPlaceholder = (data: NormalizedInvoiceData) =>
  Buffer.from(
    `DOCX placeholder for ${data.invoiceNumber}\nTODO: Replace with a real DOCX generator.`,
    "utf-8",
  );

const asPdfPlaceholder = (data: NormalizedInvoiceData) =>
  Buffer.from(`PDF placeholder for ${data.invoiceNumber}\nTODO: Replace with a real PDF generator.`, "utf-8");

export const generateOutputBuffer = (data: NormalizedInvoiceData, outputFormat: OutputFormat) => {
  functionLogger.info("outputGenerators", "Generating output buffer.", {
    outputFormat,
    invoiceNumber: data.invoiceNumber,
    lineItems: data.lineItems.length,
  });
  switch (outputFormat) {
    case "json":
      return { extension: "json", mimeType: "application/json", buffer: asJsonBuffer(data) };
    case "xml":
      return { extension: "xml", mimeType: "application/xml", buffer: asXmlBuffer(data) };
    case "xlsx":
      return { extension: "xlsx", mimeType: "text/plain", buffer: asCsvBuffer(data) };
    case "docx":
      return {
        extension: "docx",
        mimeType: "text/plain",
        buffer: asDocxPlaceholder(data),
      };
    case "pdf":
      return { extension: "pdf", mimeType: "text/plain", buffer: asPdfPlaceholder(data) };
  }
};
