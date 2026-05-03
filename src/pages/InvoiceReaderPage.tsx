import { useMemo, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { ExtractedInvoicePreview } from "../components/invoice/ExtractedInvoicePreview";
import { StatusBadge } from "../components/StatusBadge";
import { UploadDropzone } from "../components/UploadDropzone";
import { useDocuments } from "../context/DocumentsContext";
import { OUTPUT_FORMAT_OPTIONS } from "../lib/constants";
import { appLogger } from "../lib/logger";
import type { OutputFormat } from "../types";

export const InvoiceReaderPage = () => {
  const { uploadAndProcess, stage, processingError, selectedDetail, updateExtractedData } = useDocuments();
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("json");
  const [notes, setNotes] = useState("");
  const selectedOutput = useMemo(() => selectedDetail?.outputs[0], [selectedDetail]);

  return (
    <div className="space-y-8">
      <div className="panel p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Invoice Reader & Converter</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Upload invoices or business documents, extract the fields through the backend processor, then review and export the structured result.
            </p>
          </div>
          <StatusBadge status={stage} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <UploadDropzone
            helperText="Supported MVP inputs include PDF, image/photo, Excel, Word, CSV, XML, and scanned document uploads."
            onFileSelected={(file) => {
              appLogger.info("InvoiceReaderPage", "File selected for upload.", {
                fileName: file.name,
                fileSize: file.size,
                outputFormat,
              });
              void uploadAndProcess({ file, workflowType: "invoice_reader", outputFormat });
            }}
          />
          <div className="panel-muted p-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Output format</span>
              <select className="input-base" value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}>
                {OUTPUT_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes / instructions</span>
              <textarea className="input-base min-h-32" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional routing notes for a future backend processor." />
            </label>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              Uploaded files are stored in Appwrite, processed by the backend function, and returned as structured outputs for review and export.
            </p>
          </div>
        </div>
      </div>
      {processingError ? (
        <ErrorState
          title="Processing failed"
          description={processingError}
        />
      ) : null}
      {selectedDetail?.extractedData ? (
        <div className="space-y-6">
          <ExtractedInvoicePreview
            data={selectedDetail.extractedData}
            confidence={selectedDetail.document.confidenceScore}
            editable
            onUpdate={(updates) => {
              void updateExtractedData(selectedDetail.extractedData!.id, {
                ...selectedDetail.extractedData,
                ...updates,
              });
            }}
          />
          {selectedOutput ? (
            <div className="panel p-6">
              <h3 className="text-lg font-bold text-slate-900">Generated output</h3>
              <p className="mt-3 text-sm text-slate-600">{selectedOutput.fileName}</p>
              <a className="button-primary mt-5" href={selectedOutput.downloadUrl}>
                Download output
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
