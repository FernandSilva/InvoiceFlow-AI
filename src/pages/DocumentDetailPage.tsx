import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { ExtractedInvoicePreview } from "../components/invoice/ExtractedInvoicePreview";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { useDocuments } from "../context/DocumentsContext";
import { appLogger } from "../lib/logger";
import type { DocumentDetail } from "../types";
import { formatDate, formatFileSize } from "../utils/format";

export const DocumentDetailPage = () => {
  const { id } = useParams();
  const { getDocumentDetail, updateExtractedData, deleteDocument } = useDocuments();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DocumentDetail>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      appLogger.error("DocumentDetailPage", "Document detail opened without an id parameter.");
      setError("Missing document identifier.");
      setLoading(false);
      return;
    }

    appLogger.info("DocumentDetailPage", "Loading document detail page.", { documentId: id });
    setLoading(true);
    setError("");
    getDocumentDetail(id)
      .then((response) => {
        setDetail(response);
        if (!response) {
          appLogger.warn("DocumentDetailPage", "No document detail returned.", { documentId: id });
          setError("This document could not be loaded. It may have been deleted or you may not have permission to view its extracted data.");
        }
      })
      .catch((detailError) => {
        appLogger.error("DocumentDetailPage", "Document detail load failed.", {
          documentId: id,
          error: detailError instanceof Error ? detailError.message : "unknown",
        });
        setError(detailError instanceof Error ? detailError.message : "Unable to load document details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [getDocumentDetail, id]);

  if (loading) {
    return <LoadingState label="Loading document details..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load document details"
        description={error}
      />
    );
  }

  if (!detail) {
    return (
      <ErrorState
        title="Document not available"
        description="We could not find this document detail view."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="panel p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{detail.document.originalFileName}</h1>
            <p className="mt-3 text-sm text-slate-600">
              Uploaded {formatDate(detail.document.createdAt)} • {detail.document.originalMimeType} • {formatFileSize(detail.document.originalSize)}
            </p>
          </div>
          <StatusBadge status={detail.document.status} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="button-secondary px-4 py-2 text-xs">
            Regenerate output
          </button>
          <button type="button" className="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700" onClick={() => void deleteDocument(detail.document.id)}>
            Delete document
          </button>
        </div>
      </div>
      {detail.extractedData ? (
        <ExtractedInvoicePreview
          data={detail.extractedData}
          confidence={detail.document.confidenceScore}
          editable
          onUpdate={(updates) => void updateExtractedData(detail.extractedData!.id, { ...detail.extractedData, ...updates })}
        />
      ) : (
        <ErrorState
          title="Extracted data unavailable"
          description="The document record exists, but the extracted invoice data could not be loaded for this user. New processed documents will include the required access automatically after the backend function is redeployed."
        />
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-6">
          <h3 className="text-lg font-bold text-slate-900">Generated outputs</h3>
          <div className="mt-4 space-y-3">
            {detail.outputs.map((output) => (
              <a key={output.id} href={output.downloadUrl} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                <span>{output.fileName}</span>
                <span className="text-brand-700">Download</span>
              </a>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <h3 className="text-lg font-bold text-slate-900">Processing logs</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {detail.auditLogs.length ? detail.auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="font-semibold text-slate-900">{log.action}</div>
                <div className="mt-1">{JSON.stringify(log.metadata)}</div>
              </div>
            )) : <div>No logs available.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
