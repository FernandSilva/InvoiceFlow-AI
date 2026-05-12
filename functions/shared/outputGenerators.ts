import ExcelJS from "exceljs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import PDFDocument from "pdfkit";
import { functionLogger } from "./logger";
import type { GeneratedOutput, InvoiceReaderExport, OutputFormat } from "./types";

const HUMAN_READABLE_NA = "N/A";

const displayText = (value: string | number) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  }

  return value || HUMAN_READABLE_NA;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const ensureExportCompleteness = (invoice: InvoiceReaderExport) => {
  if (!invoice.supplier || !invoice.buyer || !invoice.invoice || !Array.isArray(invoice.lineItems)) {
    throw new Error("Invoice Reader export payload is incomplete.");
  }

  functionLogger.debug("outputGenerators", "Validated invoice reader export payload.", {
    invoiceNumber: invoice.invoice.invoiceNumber,
    lineItemCount: invoice.lineItems.length,
  });
};

const ensureBuffer = async (value: Buffer | ArrayBuffer | Uint8Array): Promise<Buffer> => {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  throw new Error("Unable to normalize generated workbook buffer.");
};

const autoFitColumns = (worksheet: ExcelJS.Worksheet) => {
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, String(cell.value ?? "").length + 2);
    });
    column.width = Math.min(maxLength, 42);
  });
};

const createInvoiceReaderPdf = (invoice: InvoiceReaderExport) =>
  new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const writeSectionHeading = (title: string) => {
      doc.moveDown();
      doc.font("Helvetica-Bold").fontSize(14).text(title);
      doc.moveDown(0.4);
      doc.font("Helvetica").fontSize(11);
    };

    const writeKeyValue = (label: string, value: string | number) => {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(displayText(value));
    };

    doc.font("Helvetica-Bold").fontSize(22).text("Invoice Summary");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);

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
    const columns = [48, 240, 320, 400, 470];
    const headers = ["Description", "Quantity", "Unit Price", "Tax Rate", "Total"];
    doc.font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, index) => doc.text(header, columns[index], tableTop));
    doc.moveTo(48, tableTop + 14).lineTo(548, tableTop + 14).stroke("#CBD5E1");

    let currentY = tableTop + 22;
    doc.font("Helvetica").fontSize(10);
    invoice.lineItems.forEach((item) => {
      doc.text(displayText(item.description), columns[0], currentY, { width: 180 });
      doc.text(displayText(item.quantity), columns[1], currentY, { width: 60 });
      doc.text(displayText(item.unitPrice), columns[2], currentY, { width: 60 });
      doc.text(displayText(item.taxRate), columns[3], currentY, { width: 50 });
      doc.text(displayText(item.total), columns[4], currentY, { width: 70, align: "right" });
      currentY += 20;
    });

    doc.y = currentY + 10;
    writeSectionHeading("Notes");
    doc.font("Helvetica").text(invoice.notes || HUMAN_READABLE_NA);

    doc.end();
  });

export const generateJsonOutput = async (invoice: InvoiceReaderExport): Promise<GeneratedOutput> => {
  ensureExportCompleteness(invoice);
  return {
    buffer: Buffer.from(JSON.stringify(invoice, null, 2), "utf-8"),
    filename: "invoice-output.json",
    mimeType: "application/json",
  };
};

export const generateXmlOutput = async (invoice: InvoiceReaderExport): Promise<GeneratedOutput> => {
  ensureExportCompleteness(invoice);

  const lineItemsXml = invoice.lineItems.length
    ? invoice.lineItems
        .map(
          (item) => `    <LineItem>
      <Description>${escapeXml(item.description || "")}</Description>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unitPrice}</UnitPrice>
      <TaxRate>${item.taxRate}</TaxRate>
      <Total>${item.total}</Total>
    </LineItem>`,
        )
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
  <Supplier>
    <Name>${escapeXml(invoice.supplier.name || "")}</Name>
    <TaxId>${escapeXml(invoice.supplier.taxId || "")}</TaxId>
    <Address>${escapeXml(invoice.supplier.address || "")}</Address>
  </Supplier>
  <Buyer>
    <Name>${escapeXml(invoice.buyer.name || "")}</Name>
    <TaxId>${escapeXml(invoice.buyer.taxId || "")}</TaxId>
    <Address>${escapeXml(invoice.buyer.address || "")}</Address>
  </Buyer>
  <InvoiceDetails>
    <InvoiceNumber>${escapeXml(invoice.invoice.invoiceNumber || "")}</InvoiceNumber>
    <InvoiceDate>${escapeXml(invoice.invoice.invoiceDate || "")}</InvoiceDate>
    <DueDate>${escapeXml(invoice.invoice.dueDate || "")}</DueDate>
    <Currency>${escapeXml(invoice.invoice.currency || "")}</Currency>
    <Subtotal>${invoice.invoice.subtotal}</Subtotal>
    <TaxTotal>${invoice.invoice.taxTotal}</TaxTotal>
    <Total>${invoice.invoice.total}</Total>
  </InvoiceDetails>
  <LineItems>
${lineItemsXml}
  </LineItems>
  <Notes>${escapeXml(invoice.notes || "")}</Notes>
</InvoiceExport>`;

  return {
    buffer: Buffer.from(xml, "utf-8"),
    filename: "invoice-output.xml",
    mimeType: "application/xml",
  };
};

export const generateXlsxOutput = async (invoice: InvoiceReaderExport): Promise<GeneratedOutput> => {
  ensureExportCompleteness(invoice);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Invoice Summary", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = [
    { header: "Field", key: "field", width: 24 },
    { header: "Value", key: "value", width: 36 },
  ];
  worksheet.getRow(1).font = { bold: true };

  const summaryRows: Array<[string, string | number]> = [
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

  summaryRows.forEach(([field, value]) => worksheet.addRow([field, displayText(value)]));
  worksheet.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });
  autoFitColumns(worksheet);

  const itemsSheet = workbook.addWorksheet("Line Items", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  itemsSheet.columns = [
    { header: "Description", key: "description", width: 36 },
    { header: "Quantity", key: "quantity", width: 14 },
    { header: "Unit Price", key: "unitPrice", width: 16 },
    { header: "Tax Rate", key: "taxRate", width: 14 },
    { header: "Total", key: "total", width: 16 },
  ];
  itemsSheet.getRow(1).font = { bold: true };
  invoice.lineItems.forEach((item) => {
    itemsSheet.addRow({
      description: item.description || HUMAN_READABLE_NA,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      total: item.total,
    });
  });
  itemsSheet.getColumn("unitPrice").numFmt = "#,##0.00";
  itemsSheet.getColumn("taxRate").numFmt = "0.00";
  itemsSheet.getColumn("total").numFmt = "#,##0.00";
  autoFitColumns(itemsSheet);

  return {
    buffer: await ensureBuffer(await workbook.xlsx.writeBuffer()),
    filename: "invoice-output.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

const paragraphForField = (label: string, value: string | number) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun(displayText(value)),
    ],
  });

export const generateDocxOutput = async (invoice: InvoiceReaderExport): Promise<GeneratedOutput> => {
  ensureExportCompleteness(invoice);

  const lineItemRows = [
    new TableRow({
      tableHeader: true,
      children: ["Description", "Quantity", "Unit Price", "Tax Rate", "Total"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...invoice.lineItems.map(
      (item) =>
        new TableRow({
          children: [
            item.description || HUMAN_READABLE_NA,
            displayText(item.quantity),
            displayText(item.unitPrice),
            displayText(item.taxRate),
            displayText(item.total),
          ].map(
            (value) =>
              new TableCell({
                children: [new Paragraph(String(value))],
              }),
          ),
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Invoice Summary",
            heading: HeadingLevel.TITLE,
            spacing: { after: 240 },
          }),
          new Paragraph({ text: "Supplier", heading: HeadingLevel.HEADING_1 }),
          paragraphForField("Name", invoice.supplier.name),
          paragraphForField("Tax ID", invoice.supplier.taxId),
          paragraphForField("Address", invoice.supplier.address),
          new Paragraph({ text: "Buyer", heading: HeadingLevel.HEADING_1 }),
          paragraphForField("Name", invoice.buyer.name),
          paragraphForField("Tax ID", invoice.buyer.taxId),
          paragraphForField("Address", invoice.buyer.address),
          new Paragraph({ text: "Invoice Details", heading: HeadingLevel.HEADING_1 }),
          paragraphForField("Invoice Number", invoice.invoice.invoiceNumber),
          paragraphForField("Invoice Date", invoice.invoice.invoiceDate),
          paragraphForField("Due Date", invoice.invoice.dueDate),
          paragraphForField("Currency", invoice.invoice.currency),
          paragraphForField("Subtotal", invoice.invoice.subtotal),
          paragraphForField("Tax Total", invoice.invoice.taxTotal),
          paragraphForField("Total", invoice.invoice.total),
          new Paragraph({ text: "Line Items", heading: HeadingLevel.HEADING_1 }),
          new Table({
            rows: lineItemRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [4200, 1200, 1500, 1200, 1500],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "Notes", heading: HeadingLevel.HEADING_1 }),
          new Paragraph(invoice.notes || HUMAN_READABLE_NA),
        ],
      },
    ],
  });

  return {
    buffer: await Packer.toBuffer(doc),
    filename: "invoice-output.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
};

export const generatePdfOutput = async (invoice: InvoiceReaderExport): Promise<GeneratedOutput> => {
  ensureExportCompleteness(invoice);
  return {
    buffer: await createInvoiceReaderPdf(invoice),
    filename: "invoice-output.pdf",
    mimeType: "application/pdf",
  };
};

export const generateOutput = async (invoice: InvoiceReaderExport, outputFormat: OutputFormat): Promise<GeneratedOutput> => {
  functionLogger.info("outputGenerators", "Generating invoice reader output.", {
    outputFormat,
    invoiceNumber: invoice.invoice.invoiceNumber,
    lineItemCount: invoice.lineItems.length,
  });

  switch (outputFormat) {
    case "json":
      return generateJsonOutput(invoice);
    case "xml":
      return generateXmlOutput(invoice);
    case "xlsx":
      return generateXlsxOutput(invoice);
    case "docx":
      return generateDocxOutput(invoice);
    case "pdf":
      return generatePdfOutput(invoice);
  }
};
