import { useMemo, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { EInvoiceChecklist } from "../components/invoice/EInvoiceChecklist";
import { ExtractedInvoicePreview } from "../components/invoice/ExtractedInvoicePreview";
import { StatusBadge } from "../components/StatusBadge";
import { UploadDropzone } from "../components/UploadDropzone";
import { useDocuments } from "../context/DocumentsContext";
import { OUTPUT_FORMAT_OPTIONS } from "../lib/constants";
import { appLogger } from "../lib/logger";
import type { OutputFormat } from "../types";

export const EInvoiceCreatorPage = () => {
  const { uploadAndProcess, stage, processingError, selectedDetail, updateExtractedData } = useDocuments();
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("xml");
  const selectedOutput = useMemo(() => selectedDetail?.outputs[0], [selectedDetail]);

  return (
    <div className="space-y-8">
      <div className="panel p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">E-Invoice Creator</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Upload a source document or prepare invoice fields manually, validate required data, and generate a structured e-invoice-ready payload.
            </p>
          </div>
          <StatusBadge status={stage} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <UploadDropzone
            helperText="Upload the source invoice or supporting business document, then review the normalized data and readiness checklist."
            onFileSelected={(file) => {
              appLogger.info("EInvoiceCreatorPage", "File selected for upload.", {
                fileName: file.name,
                fileSize: file.size,
                outputFormat,
              });
              void uploadAndProcess({ file, workflowType: "e_invoice_creator", outputFormat });
            }}
          />
          <div className="panel-muted p-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Structured output</span>
              <select className="input-base" value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}>
                {OUTPUT_FORMAT_OPTIONS.filter((option) => option.value === "json" || option.value === "xml").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
              Compliance status is marked as Draft, Needs Review, or Ready depending on extracted field completeness and validation issues.
            </div>
          </div>
        </div>
      </div>
      {processingError ? (
        stage === "processing" ? (
          <div className="panel border-brand-200 bg-brand-50 px-6 py-5 text-brand-900">
            <h3 className="text-lg font-bold">Processing continues in the background</h3>
            <p className="mt-2 text-sm text-brand-800">{processingError}</p>
          </div>
        ) : (
          <ErrorState title="Processing failed" description={processingError} />
        )
      ) : null}
      {selectedDetail?.extractedData ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
          <div className="space-y-6">
            <EInvoiceChecklist data={selectedDetail.extractedData} />
            {selectedOutput ? (
              <div className="panel p-6">
                <h3 className="text-lg font-bold text-slate-900">Structured result</h3>
                <p className="mt-2 text-sm text-slate-600">{selectedOutput.fileName}</p>
                <p className="mt-4 text-sm font-semibold text-amber-800">
                  Compliance status: {selectedDetail.document.complianceStatus.replace(/_/g, " ")}
                </p>
                <a className="button-primary mt-5" href={selectedOutput.downloadUrl}>
                  Download structured output
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
