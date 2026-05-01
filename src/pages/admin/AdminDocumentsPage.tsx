import { useEffect, useState } from "react";
import { platformService } from "../../lib/services";
import type { DocumentRecord } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../utils/format";

export const AdminDocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    platformService.listDocuments(null).then(setDocuments);
  }, []);

  return (
    <div className="space-y-6">
      <div className="panel border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-2xl font-extrabold tracking-tight">Admin Documents</h1>
        <p className="mt-2 text-sm">
          This view is metadata-first by design. Admins should avoid casually opening private content and should capture a support reason before accessing sensitive documents.
        </p>
      </div>
      <div className="grid gap-4">
        {documents.map((document) => (
          <div key={document.id} className="panel p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-bold text-slate-900">{document.originalFileName}</div>
                <div className="mt-1 text-sm text-slate-600">
                  Owner {document.userId} • {formatDate(document.createdAt)} • {document.requestedOutputFormat.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={document.status} />
                <button type="button" className="button-secondary px-4 py-2 text-xs">
                  View sensitive detail
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
