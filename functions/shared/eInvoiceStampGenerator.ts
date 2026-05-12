import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import PDFKit from "pdfkit";
import { functionLogger } from "./logger";

const FALLBACK_MARGIN = 48;
const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

const createFallbackPdf = ({
  invoiceFlowId,
  sourceFilename,
  sourceDocumentId,
  generatedAt,
  message,
}: {
  invoiceFlowId: string;
  sourceFilename: string;
  sourceDocumentId: string;
  generatedAt: string;
  message: string;
}) =>
  new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFKit({ margin: FALLBACK_MARGIN });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(20).text("InvoiceFlow AI - Preservation Record");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);
    doc.text(`InvoiceFlow ID: ${invoiceFlowId}`);
    doc.text(`Generated At: ${generatedAt}`);
    doc.text(`Source Filename: ${sourceFilename}`);
    doc.text(`Source Document ID: ${sourceDocumentId}`);
    doc.moveDown();
    doc.text(message);
    doc.end();
  });

const stampPages = async (pdfBytes: Uint8Array, stampText: string) => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const { width } = page.getSize();
    page.drawText(stampText, {
      x: 36,
      y: 18,
      size: 9,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
    page.drawText(`Page ${index + 1}`, {
      x: width - 72,
      y: 18,
      size: 9,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
  });

  return Buffer.from(await pdfDoc.save());
};

const createImagePdf = async (sourceBuffer: Buffer, sourceMimeType: string, stampText: string) => {
  const pdfDoc = await PDFDocument.create();
  let embeddedImage;

  if (sourceMimeType === "image/png") {
    embeddedImage = await pdfDoc.embedPng(sourceBuffer);
  } else {
    embeddedImage = await pdfDoc.embedJpg(sourceBuffer);
  }

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const imageWidth = embeddedImage.width;
  const imageHeight = embeddedImage.height;
  const scale = Math.min((width - 72) / imageWidth, (height - 108) / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2 + 18;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawImage(embeddedImage, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  });
  page.drawText(stampText, {
    x: 36,
    y: 18,
    size: 9,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });

  return Buffer.from(await pdfDoc.save());
};

export const generateStampedEInvoicePdf = async ({
  sourceBuffer,
  sourceMimeType,
  sourceFilename,
  documentId,
  userId,
  invoiceFlowId,
  generatedAt,
}: {
  sourceBuffer: Buffer;
  sourceMimeType: string;
  sourceFilename: string;
  documentId: string;
  userId: string;
  invoiceFlowId: string;
  generatedAt: string;
}) => {
  const stampText = `InvoiceFlow ID: ${invoiceFlowId} • ${generatedAt} • InvoiceFlow AI`;

  functionLogger.info("eInvoiceStampGenerator", "Generating stamped e-invoice PDF.", {
    sourceFilename,
    sourceMimeType,
    documentId,
    userId,
    invoiceFlowId,
  });

  if (sourceMimeType === "application/pdf") {
    return {
      buffer: await stampPages(sourceBuffer, stampText),
      filename: `e-invoice-record-${invoiceFlowId}.pdf`,
      mimeType: "application/pdf" as const,
    };
  }

  if (SUPPORTED_IMAGE_MIME_TYPES.has(sourceMimeType)) {
    return {
      buffer: await createImagePdf(sourceBuffer, sourceMimeType, stampText),
      filename: `e-invoice-record-${invoiceFlowId}.pdf`,
      mimeType: "application/pdf" as const,
    };
  }

  return {
    buffer: await createFallbackPdf({
      invoiceFlowId,
      sourceFilename,
      sourceDocumentId: documentId,
      generatedAt,
      message:
        "Original document preserved as a reference record. Direct visual stamping was not available for this file type in the current MVP workflow.",
    }),
    filename: `e-invoice-record-${invoiceFlowId}.pdf`,
    mimeType: "application/pdf" as const,
  };
};
