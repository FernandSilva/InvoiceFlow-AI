"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOutput = exports.generatePdfOutput = exports.generateDocxOutput = exports.generateXlsxOutput = exports.generateXmlOutput = exports.generateJsonOutput = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const docx_1 = require("docx");
const pdfkit_1 = __importDefault(require("pdfkit"));
const logger_1 = require("./logger");
const HUMAN_READABLE_NA = "N/A";
const asDisplayValue = (value) => {
    if (Array.isArray(value)) {
        return value.length ? value.join(" | ") : HUMAN_READABLE_NA;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value.toFixed(2) : "0.00";
    }
    return value || HUMAN_READABLE_NA;
};
const escapeXml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const assertInvoiceCompleteness = (invoice) => {
    const requiredChecks = [
        ["metadata.generatedAt", invoice.metadata.generatedAt],
        ["metadata.sourceDocumentId", invoice.metadata.sourceDocumentId],
        ["metadata.sourceFileId", invoice.metadata.sourceFileId],
        ["metadata.sourceFilename", invoice.metadata.sourceFilename],
        ["metadata.workflowType", invoice.metadata.workflowType],
        ["metadata.confidenceScore", invoice.metadata.confidenceScore],
        ["supplier.name", invoice.supplier.name],
        ["supplier.taxId", invoice.supplier.taxId],
        ["supplier.address", invoice.supplier.address],
        ["buyer.name", invoice.buyer.name],
        ["buyer.taxId", invoice.buyer.taxId],
        ["buyer.address", invoice.buyer.address],
        ["invoice.invoiceNumber", invoice.invoice.invoiceNumber],
        ["invoice.invoiceDate", invoice.invoice.invoiceDate],
        ["invoice.dueDate", invoice.invoice.dueDate],
        ["invoice.currency", invoice.invoice.currency],
        ["invoice.subtotal", invoice.invoice.subtotal],
        ["invoice.taxTotal", invoice.invoice.taxTotal],
        ["invoice.total", invoice.invoice.total],
        ["notes", invoice.notes],
    ];
    const missingFields = requiredChecks
        .filter(([, value]) => value === undefined || value === null)
        .map(([field]) => field);
    if (missingFields.length) {
        throw new Error(`Normalized invoice is missing canonical fields: ${missingFields.join(", ")}`);
    }
    if (invoice.metadata.workflowType === "e_invoice_creator") {
        if (!invoice.metadata.invoiceFlowId) {
            throw new Error("E-Invoice Creator exports require metadata.invoiceFlowId.");
        }
        if (!invoice.metadata.extractionStatus) {
            throw new Error("E-Invoice Creator exports require metadata.extractionStatus.");
        }
    }
    if (invoice.lineItems.length < 0) {
        throw new Error("Line item count cannot be negative.");
    }
    logger_1.functionLogger.debug("outputGenerators", "Validated canonical invoice for export.", {
        sourceDocumentId: invoice.metadata.sourceDocumentId,
        outputFormat: invoice.metadata.outputFormat,
        lineItemCount: invoice.lineItems.length,
    });
};
const ensureBuffer = async (value) => {
    if (Buffer.isBuffer(value)) {
        return value;
    }
    if (value instanceof ArrayBuffer) {
        return Buffer.from(value);
    }
    if (ArrayBuffer.isView(value)) {
        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    }
    throw new Error("Unable to normalize generated output into a buffer.");
};
const autoFitColumns = (worksheet) => {
    worksheet.columns.forEach((column) => {
        let maxLength = 12;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const length = String(cell.value ?? "").length;
            maxLength = Math.max(maxLength, length + 2);
        });
        column.width = Math.min(maxLength, 42);
    });
};
const createPdfBuffer = (invoice) => new Promise((resolve, reject) => {
    const doc = new pdfkit_1.default({ margin: 48 });
    const chunks = [];
    doc.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const writeSectionHeading = (label) => {
        doc.moveDown();
        doc.font("Helvetica-Bold").fontSize(14).text(label);
        doc.moveDown(0.4);
        doc.font("Helvetica").fontSize(11);
    };
    const writeKeyValue = (label, value) => {
        doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
        doc.font("Helvetica").text(asDisplayValue(value));
    };
    const isEInvoiceRecord = invoice.metadata.workflowType === "e_invoice_creator";
    doc.font("Helvetica-Bold").fontSize(22).text(isEInvoiceRecord ? "InvoiceFlow AI - E-Invoice Record" : "Invoice Export");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);
    writeSectionHeading("Metadata");
    writeKeyValue("Generated At", invoice.metadata.generatedAt);
    writeKeyValue("Source Document ID", invoice.metadata.sourceDocumentId);
    writeKeyValue("Source File ID", invoice.metadata.sourceFileId);
    writeKeyValue("Source Filename", invoice.metadata.sourceFilename);
    writeKeyValue("Workflow Type", invoice.metadata.workflowType);
    writeKeyValue("Output Format", invoice.metadata.outputFormat);
    writeKeyValue("Confidence Score", invoice.metadata.confidenceScore);
    writeKeyValue("Validation Issues", invoice.metadata.validationIssues);
    if (invoice.metadata.invoiceFlowId) {
        writeKeyValue("InvoiceFlow ID", invoice.metadata.invoiceFlowId);
    }
    if (invoice.metadata.extractionStatus) {
        writeKeyValue("Extraction Status", invoice.metadata.extractionStatus);
    }
    writeSectionHeading("Supplier");
    writeKeyValue("Name", invoice.supplier.name);
    writeKeyValue("Tax ID", invoice.supplier.taxId);
    writeKeyValue("Address", invoice.supplier.address);
    writeSectionHeading("Buyer");
    writeKeyValue("Name", invoice.buyer.name);
    writeKeyValue("Tax ID", invoice.buyer.taxId);
    writeKeyValue("Address", invoice.buyer.address);
    writeSectionHeading("Invoice Details");
    writeKeyValue("Invoice Number", invoice.invoice.invoiceNumber);
    writeKeyValue("Invoice Date", invoice.invoice.invoiceDate);
    writeKeyValue("Due Date", invoice.invoice.dueDate);
    writeKeyValue("Currency", invoice.invoice.currency);
    writeKeyValue("Subtotal", invoice.invoice.subtotal);
    writeKeyValue("Tax Total", invoice.invoice.taxTotal);
    writeKeyValue("Total", invoice.invoice.total);
    writeSectionHeading("Line Items");
    const tableTop = doc.y;
    const columns = [48, 220, 300, 380, 450];
    const headers = ["Description", "Quantity", "Unit Price", "Tax Rate", "Total"];
    doc.font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, index) => doc.text(header, columns[index], tableTop));
    doc.moveTo(48, tableTop + 14).lineTo(548, tableTop + 14).stroke("#CBD5E1");
    let currentY = tableTop + 22;
    doc.font("Helvetica").fontSize(10);
    invoice.lineItems.forEach((item) => {
        doc.text(asDisplayValue(item.description), columns[0], currentY, { width: 160 });
        doc.text(asDisplayValue(item.quantity), columns[1], currentY, { width: 60 });
        doc.text(asDisplayValue(item.unitPrice), columns[2], currentY, { width: 60 });
        doc.text(asDisplayValue(item.taxRate), columns[3], currentY, { width: 50 });
        doc.text(asDisplayValue(item.total), columns[4], currentY, { width: 70, align: "right" });
        currentY += 20;
    });
    doc.y = currentY + 8;
    writeSectionHeading("Notes");
    doc.font("Helvetica").text(invoice.notes || HUMAN_READABLE_NA);
    if (invoice.metadata.validationIssues.length) {
        writeSectionHeading("Validation Issues");
        invoice.metadata.validationIssues.forEach((issue) => {
            doc.text(`- ${issue}`);
        });
    }
    doc.fontSize(9).fillColor("#64748B");
    doc.text(invoice.metadata.invoiceFlowId
        ? `Generated by InvoiceFlow AI • ${invoice.metadata.invoiceFlowId} • Page 1`
        : "Generated by InvoiceFlow AI • Page 1", 48, doc.page.height - 48, {
        align: "center",
        width: doc.page.width - 96,
    });
    doc.end();
});
const generateJsonOutput = async (invoice) => {
    assertInvoiceCompleteness(invoice);
    return {
        buffer: Buffer.from(JSON.stringify(invoice, null, 2), "utf-8"),
        filename: "invoice-output.json",
        mimeType: "application/json",
    };
};
exports.generateJsonOutput = generateJsonOutput;
const generateXmlOutput = async (invoice) => {
    assertInvoiceCompleteness(invoice);
    const validationIssuesXml = invoice.metadata.validationIssues.length
        ? invoice.metadata.validationIssues.map((issue) => `      <Issue>${escapeXml(issue)}</Issue>`).join("\n")
        : "      <Issue></Issue>";
    const lineItemsXml = invoice.lineItems.length
        ? invoice.lineItems
            .map((item) => `    <LineItem>
      <Description>${escapeXml(item.description)}</Description>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unitPrice}</UnitPrice>
      <TaxRate>${item.taxRate}</TaxRate>
      <Total>${item.total}</Total>
    </LineItem>`)
            .join("\n")
        : `    <LineItem>
      <Description></Description>
      <Quantity>0</Quantity>
      <UnitPrice>0</UnitPrice>
      <TaxRate>0</TaxRate>
      <Total>0</Total>
    </LineItem>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<InvoiceExport>
  <Metadata>
    <GeneratedAt>${escapeXml(invoice.metadata.generatedAt)}</GeneratedAt>
    <SourceDocumentId>${escapeXml(invoice.metadata.sourceDocumentId)}</SourceDocumentId>
    <SourceFileId>${escapeXml(invoice.metadata.sourceFileId)}</SourceFileId>
    <SourceFilename>${escapeXml(invoice.metadata.sourceFilename)}</SourceFilename>
    <WorkflowType>${escapeXml(invoice.metadata.workflowType)}</WorkflowType>
    <OutputFormat>${escapeXml(invoice.metadata.outputFormat)}</OutputFormat>
    <ConfidenceScore>${invoice.metadata.confidenceScore}</ConfidenceScore>
    <InvoiceFlowId>${escapeXml(invoice.metadata.invoiceFlowId || "")}</InvoiceFlowId>
    <ExtractionStatus>${escapeXml(invoice.metadata.extractionStatus || "")}</ExtractionStatus>
    <ValidationIssues>
${validationIssuesXml}
    </ValidationIssues>
  </Metadata>
  <Supplier>
    <Name>${escapeXml(invoice.supplier.name)}</Name>
    <TaxId>${escapeXml(invoice.supplier.taxId)}</TaxId>
    <Address>${escapeXml(invoice.supplier.address)}</Address>
  </Supplier>
  <Buyer>
    <Name>${escapeXml(invoice.buyer.name)}</Name>
    <TaxId>${escapeXml(invoice.buyer.taxId)}</TaxId>
    <Address>${escapeXml(invoice.buyer.address)}</Address>
  </Buyer>
  <InvoiceDetails>
    <InvoiceNumber>${escapeXml(invoice.invoice.invoiceNumber)}</InvoiceNumber>
    <InvoiceDate>${escapeXml(invoice.invoice.invoiceDate)}</InvoiceDate>
    <DueDate>${escapeXml(invoice.invoice.dueDate)}</DueDate>
    <Currency>${escapeXml(invoice.invoice.currency)}</Currency>
    <Subtotal>${invoice.invoice.subtotal}</Subtotal>
    <TaxTotal>${invoice.invoice.taxTotal}</TaxTotal>
    <Total>${invoice.invoice.total}</Total>
  </InvoiceDetails>
  <LineItems>
${lineItemsXml}
  </LineItems>
  <Notes>${escapeXml(invoice.notes)}</Notes>
</InvoiceExport>`;
    return {
        buffer: Buffer.from(xml, "utf-8"),
        filename: "invoice-output.xml",
        mimeType: "application/xml",
    };
};
exports.generateXmlOutput = generateXmlOutput;
const generateXlsxOutput = async (invoice) => {
    assertInvoiceCompleteness(invoice);
    const workbook = new exceljs_1.default.Workbook();
    workbook.creator = "InvoiceFlow AI";
    workbook.created = new Date(invoice.metadata.generatedAt);
    const summary = workbook.addWorksheet("Summary");
    summary.columns = [
        { header: "Field", key: "field", width: 28 },
        { header: "Value", key: "value", width: 42 },
    ];
    summary.getRow(1).font = { bold: true };
    const summaryRows = [
        ["Generated At", invoice.metadata.generatedAt],
        ["Source Document ID", invoice.metadata.sourceDocumentId],
        ["Source File ID", invoice.metadata.sourceFileId],
        ["Source Filename", invoice.metadata.sourceFilename],
        ["Workflow Type", invoice.metadata.workflowType],
        ["Output Format", invoice.metadata.outputFormat],
        ["Confidence Score", invoice.metadata.confidenceScore],
        ["InvoiceFlow ID", invoice.metadata.invoiceFlowId || ""],
        ["Extraction Status", invoice.metadata.extractionStatus || ""],
        ["Validation Issues", invoice.metadata.validationIssues],
        ["Supplier Name", invoice.supplier.name],
        ["Supplier Tax ID", invoice.supplier.taxId],
        ["Supplier Address", invoice.supplier.address],
        ["Buyer Name", invoice.buyer.name],
        ["Buyer Tax ID", invoice.buyer.taxId],
        ["Buyer Address", invoice.buyer.address],
        ["Invoice Number", invoice.invoice.invoiceNumber],
        ["Invoice Date", invoice.invoice.invoiceDate],
        ["Due Date", invoice.invoice.dueDate],
        ["Currency", invoice.invoice.currency],
        ["Subtotal", invoice.invoice.subtotal],
        ["Tax Total", invoice.invoice.taxTotal],
        ["Total", invoice.invoice.total],
        ["Notes", invoice.notes],
    ];
    summaryRows.forEach(([field, value]) => {
        summary.addRow([field, asDisplayValue(value)]);
    });
    summary.eachRow((row) => {
        row.alignment = { vertical: "top", wrapText: true };
    });
    autoFitColumns(summary);
    const items = workbook.addWorksheet("Line Items", {
        views: [{ state: "frozen", ySplit: 1 }],
    });
    items.columns = [
        { header: "Description", key: "description", width: 36 },
        { header: "Quantity", key: "quantity", width: 14 },
        { header: "Unit Price", key: "unitPrice", width: 16 },
        { header: "Tax Rate", key: "taxRate", width: 14 },
        { header: "Total", key: "total", width: 16 },
    ];
    items.getRow(1).font = { bold: true };
    invoice.lineItems.forEach((item) => {
        items.addRow({
            description: item.description || HUMAN_READABLE_NA,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total,
        });
    });
    items.getColumn("unitPrice").numFmt = "#,##0.00";
    items.getColumn("taxRate").numFmt = "0.00";
    items.getColumn("total").numFmt = "#,##0.00";
    autoFitColumns(items);
    return {
        buffer: await ensureBuffer(await workbook.xlsx.writeBuffer()),
        filename: "invoice-output.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
};
exports.generateXlsxOutput = generateXlsxOutput;
const paragraphForField = (label, value) => new docx_1.Paragraph({
    spacing: { after: 120 },
    children: [
        new docx_1.TextRun({ text: `${label}: `, bold: true }),
        new docx_1.TextRun(asDisplayValue(value)),
    ],
});
const generateDocxOutput = async (invoice) => {
    assertInvoiceCompleteness(invoice);
    const lineItemRows = [
        new docx_1.TableRow({
            tableHeader: true,
            children: ["Description", "Quantity", "Unit Price", "Tax Rate", "Total"].map((header) => new docx_1.TableCell({
                children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: header, bold: true })] })],
            })),
        }),
        ...invoice.lineItems.map((item) => new docx_1.TableRow({
            children: [
                item.description,
                String(item.quantity),
                asDisplayValue(item.unitPrice),
                asDisplayValue(item.taxRate),
                asDisplayValue(item.total),
            ].map((value) => new docx_1.TableCell({
                children: [new docx_1.Paragraph(String(value || HUMAN_READABLE_NA))],
            })),
        })),
    ];
    const doc = new docx_1.Document({
        sections: [
            {
                properties: {},
                children: [
                    new docx_1.Paragraph({
                        text: "Invoice Export",
                        heading: docx_1.HeadingLevel.TITLE,
                        spacing: { after: 240 },
                    }),
                    new docx_1.Paragraph({ text: "Metadata", heading: docx_1.HeadingLevel.HEADING_1 }),
                    paragraphForField("Generated At", invoice.metadata.generatedAt),
                    paragraphForField("Source Document ID", invoice.metadata.sourceDocumentId),
                    paragraphForField("Source File ID", invoice.metadata.sourceFileId),
                    paragraphForField("Source Filename", invoice.metadata.sourceFilename),
                    paragraphForField("Workflow Type", invoice.metadata.workflowType),
                    paragraphForField("Output Format", invoice.metadata.outputFormat),
                    paragraphForField("Confidence Score", invoice.metadata.confidenceScore),
                    paragraphForField("InvoiceFlow ID", invoice.metadata.invoiceFlowId || ""),
                    paragraphForField("Extraction Status", invoice.metadata.extractionStatus || ""),
                    paragraphForField("Validation Issues", invoice.metadata.validationIssues),
                    new docx_1.Paragraph({ text: "Supplier", heading: docx_1.HeadingLevel.HEADING_1 }),
                    paragraphForField("Name", invoice.supplier.name),
                    paragraphForField("Tax ID", invoice.supplier.taxId),
                    paragraphForField("Address", invoice.supplier.address),
                    new docx_1.Paragraph({ text: "Buyer", heading: docx_1.HeadingLevel.HEADING_1 }),
                    paragraphForField("Name", invoice.buyer.name),
                    paragraphForField("Tax ID", invoice.buyer.taxId),
                    paragraphForField("Address", invoice.buyer.address),
                    new docx_1.Paragraph({ text: "Invoice Details", heading: docx_1.HeadingLevel.HEADING_1 }),
                    paragraphForField("Invoice Number", invoice.invoice.invoiceNumber),
                    paragraphForField("Invoice Date", invoice.invoice.invoiceDate),
                    paragraphForField("Due Date", invoice.invoice.dueDate),
                    paragraphForField("Currency", invoice.invoice.currency),
                    paragraphForField("Subtotal", invoice.invoice.subtotal),
                    paragraphForField("Tax Total", invoice.invoice.taxTotal),
                    paragraphForField("Total", invoice.invoice.total),
                    new docx_1.Paragraph({ text: "Line Items", heading: docx_1.HeadingLevel.HEADING_1 }),
                    new docx_1.Table({
                        rows: lineItemRows,
                        width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
                        columnWidths: [4200, 1200, 1500, 1200, 1500],
                        alignment: docx_1.AlignmentType.CENTER,
                    }),
                    new docx_1.Paragraph({ text: "Notes", heading: docx_1.HeadingLevel.HEADING_1 }),
                    new docx_1.Paragraph(invoice.notes || HUMAN_READABLE_NA),
                    ...(invoice.metadata.validationIssues.length
                        ? [
                            new docx_1.Paragraph({ text: "Validation Issues", heading: docx_1.HeadingLevel.HEADING_1 }),
                            ...invoice.metadata.validationIssues.map((issue) => new docx_1.Paragraph(`- ${issue}`)),
                        ]
                        : []),
                ],
            },
        ],
    });
    return {
        buffer: await docx_1.Packer.toBuffer(doc),
        filename: "invoice-output.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
};
exports.generateDocxOutput = generateDocxOutput;
const generatePdfOutput = async (invoice) => {
    assertInvoiceCompleteness(invoice);
    return {
        buffer: await createPdfBuffer(invoice),
        filename: invoice.metadata.workflowType === "e_invoice_creator" && invoice.metadata.invoiceFlowId
            ? `e-invoice-record-${invoice.metadata.invoiceFlowId}.pdf`
            : "invoice-output.pdf",
        mimeType: "application/pdf",
    };
};
exports.generatePdfOutput = generatePdfOutput;
const generateOutput = async (invoice, outputFormat) => {
    logger_1.functionLogger.info("outputGenerators", "Generating canonical invoice output.", {
        outputFormat,
        sourceDocumentId: invoice.metadata.sourceDocumentId,
        lineItemCount: invoice.lineItems.length,
    });
    switch (outputFormat) {
        case "json":
            return (0, exports.generateJsonOutput)(invoice);
        case "xml":
            return (0, exports.generateXmlOutput)(invoice);
        case "xlsx":
            return (0, exports.generateXlsxOutput)(invoice);
        case "docx":
            return (0, exports.generateDocxOutput)(invoice);
        case "pdf":
            return (0, exports.generatePdfOutput)(invoice);
    }
};
exports.generateOutput = generateOutput;
