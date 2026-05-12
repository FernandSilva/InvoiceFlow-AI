import { useMemo } from "react";
import { ErrorState } from "../components/ErrorState";
import { StatusBadge } from "../components/StatusBadge";
import { UploadDropzone } from "../components/UploadDropzone";
import { useDocuments } from "../context/DocumentsContext";
import { appLogger } from "../lib/logger";

export const EInvoiceCreatorPage = () => {
  const { uploadAndProcess, stage, processingError, selectedDetail } = useDocuments();
  const selectedOutput = useMemo(() => selectedDetail?.outputs[0], [selectedDetail]);
  const invoiceFlowId =
    selectedDetail?.extractedData?.normalizedJson &&
    typeof selectedDetail.extractedData.normalizedJson === "object" &&
    "metadata" in selectedDetail.extractedData.normalizedJson
      ? (selectedDetail.extractedData.normalizedJson as any).metadata?.invoiceFlowId
      : undefined;

  return (
    <div className="space-y-8">
      <div className="panel p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">E-Invoice Creator</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              E-Invoice Creator preserves your uploaded document and creates a stamped PDF record with a unique InvoiceFlow ID.
            </p>
          </div>
          <StatusBadge status={stage} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <UploadDropzone
            helperText="Upload a PDF, JPG, PNG, WEBP, or DOCX file. The original document is preserved visually and stamped into a PDF record."
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
              E-Invoice Creator always produces a stamped PDF record with a unique InvoiceFlow ID.
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
              This workflow preserves the original document and adds a minimal InvoiceFlow stamp. It does not rebuild the invoice layout.
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
      {selectedDetail ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="panel p-6">
            <h3 className="text-lg font-bold text-slate-900">Preservation record</h3>
            <p className="mt-2 text-sm text-slate-600">
              The uploaded document is preserved and stamped into a PDF record. InvoiceFlow does not rebuild the invoice layout in this workflow.
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <div>Source file: {selectedDetail.document.originalFileName}</div>
              <div>Output type: PDF</div>
              <div>Compliance status: {selectedDetail.document.complianceStatus.replace(/_/g, " ")}</div>
              {invoiceFlowId ? <div>InvoiceFlow ID: {invoiceFlowId}</div> : null}
            </div>
          </div>
          {selectedOutput ? (
            <div className="panel p-6">
              <h3 className="text-lg font-bold text-slate-900">Stamped PDF</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedOutput.fileName}</p>
              <a className="button-primary mt-5" href={selectedOutput.downloadUrl}>
                Download stamped PDF
              </a>
            </div>
          ) : (
            <div className="panel p-6">
              <h3 className="text-lg font-bold text-slate-900">Stamped PDF</h3>
              <p className="mt-2 text-sm text-slate-600">The stamped PDF will appear here once processing completes.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
