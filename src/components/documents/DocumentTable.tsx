import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/constants";
import type { DocumentRecord } from "../../types";
import { formatDate } from "../../utils/format";
import { ConfidenceBadge } from "../ConfidenceBadge";
import { StatusBadge } from "../StatusBadge";

export const DocumentTable = ({
  documents,
  onDelete,
}: {
  documents: DocumentRecord[];
  onDelete?: (documentId: string) => void;
}) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-5 py-4 font-semibold">File</th>
            <th className="px-5 py-4 font-semibold">Workflow</th>
            <th className="px-5 py-4 font-semibold">Status</th>
            <th className="px-5 py-4 font-semibold">Created</th>
            <th className="px-5 py-4 font-semibold">Output</th>
            <th className="px-5 py-4 font-semibold">Confidence</th>
            <th className="px-5 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-t border-slate-100">
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">{document.originalFileName}</div>
                <div className="text-xs text-slate-500">{document.originalMimeType}</div>
              </td>
              <td className="px-5 py-4 capitalize">{document.workflowType.replace(/_/g, " ")}</td>
              <td className="px-5 py-4">
                <StatusBadge status={document.status} />
              </td>
              <td className="px-5 py-4 text-slate-600">{formatDate(document.createdAt)}</td>
              <td className="px-5 py-4 uppercase text-slate-600">{document.requestedOutputFormat}</td>
              <td className="px-5 py-4">
                <ConfidenceBadge score={document.confidenceScore} />
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link className="button-secondary px-4 py-2 text-xs" to={`${ROUTES.documents}/${document.id}`}>
                    View details
                  </Link>
                  {onDelete ? (
                    <button
                      type="button"
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700"
                      onClick={() => onDelete(document.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
