import { useMemo } from "react";
import { ErrorState } from "../components/ErrorState";
import { EInvoiceChecklist } from "../components/invoice/EInvoiceChecklist";
import { ExtractedInvoicePreview } from "../components/invoice/ExtractedInvoicePreview";
import { StatusBadge } from "../components/StatusBadge";
import { UploadDropzone } from "../components/UploadDropzone";
import { useDocuments } from "../context/DocumentsContext";
import { appLogger } from "../lib/logger";

export const EInvoiceCreatorPage = () => {
  const { uploadAndProcess, stage, processingError, selectedDetail, updateExtractedData } = useDocuments();
  const selectedOutput = useMemo(() => selectedDetail?.outputs[0], [selectedDetail]);

  return (
    <div className="space-y-8">
      <div className="panel p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">E-Invoice Creator</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Upload a source document and InvoiceFlow AI will generate a PDF e-invoice record with a unique InvoiceFlow ID, extracted invoice summary, and compliance-ready metadata.
            </p>
          </div>
          <StatusBadge status={stage} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <UploadDropzone
            helperText="Upload a PDF, JPG, PNG, WEBP, or DOCX file. E-Invoice Creator always produces a PDF record with a unique InvoiceFlow ID."
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onFileSelected={(file) => {
              appLogger.info("EInvoiceCreatorPage", "File selected for upload.", {
                fileName: file.name,
                fileSize: file.size,
                outputFormat: "pdf",
              });
              void uploadAndProcess({ file, workflowType: "e_invoice_creator", outputFormat: "pdf" });
            }}
          />
          <div className="panel-muted p-5">
            <div className="rounded-2xl border border-brand-200 bg-white px-4 py-4 text-sm text-brand-900">
              E-Invoice Creator always produces a PDF record with a unique InvoiceFlow ID.
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
              Compliance status is marked as Ready when structured extraction is solid, and Needs Review when InvoiceFlow preserves the source with fallback or partial extraction.
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
                <p className="mt-2 text-sm text-slate-600">
                  Output type: PDF record
                </p>
                {selectedDetail.extractedData?.normalizedJson &&
                typeof selectedDetail.extractedData.normalizedJson === "object" &&
                "metadata" in selectedDetail.extractedData.normalizedJson &&
                (selectedDetail.extractedData.normalizedJson as any).metadata?.invoiceFlowId ? (
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    InvoiceFlow ID: {(selectedDetail.extractedData.normalizedJson as any).metadata.invoiceFlowId}
                  </p>
                ) : null}
                <a className="button-primary mt-5" href={selectedOutput.downloadUrl}>
                  Download PDF record
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
