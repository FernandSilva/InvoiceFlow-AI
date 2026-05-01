import { useMemo, useState } from "react";
import { DocumentTable } from "../components/documents/DocumentTable";
import { EmptyState } from "../components/EmptyState";
import { useDocuments } from "../context/DocumentsContext";

const tabs = [
  { id: "all", label: "All Documents" },
  { id: "reader", label: "Invoice Reader Outputs" },
  { id: "einvoice", label: "E-Invoice Outputs" },
  { id: "review", label: "Failed/Needs Review" },
] as const;

export const DocumentsPage = () => {
  const { documents, deleteDocument } = useDocuments();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");
  const filtered = useMemo(() => {
    switch (tab) {
      case "reader":
        return documents.filter((item) => item.workflowType === "invoice_reader");
      case "einvoice":
        return documents.filter((item) => item.workflowType === "e_invoice_creator");
      case "review":
        return documents.filter((item) => item.status === "failed" || item.status === "needs_review");
      default:
        return documents;
    }
  }, [documents, tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">My Documents</h1>
        <p className="mt-2 text-sm text-slate-600">Track uploads, review extracted data, and manage generated outputs.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "button-primary px-4 py-2 text-xs" : "button-secondary px-4 py-2 text-xs"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <DocumentTable documents={filtered} onDelete={(documentId) => void deleteDocument(documentId)} />
      ) : (
        <EmptyState title="No documents in this view" description="Upload your first invoice or source document to populate this workspace." />
      )}
    </div>
  );
};
