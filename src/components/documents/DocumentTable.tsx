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
    <div className="divide-y divide-slate-100 md:hidden">
      {documents.map((document) => (
        <div key={document.id} className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-900">{document.originalFileName}</div>
              <div className="mt-1 truncate text-xs text-slate-500">{document.originalMimeType}</div>
            </div>
            <StatusBadge status={document.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</div>
              <div className="mt-1 capitalize text-slate-700">{document.workflowType.replace(/_/g, " ")}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output</div>
              <div className="mt-1 uppercase text-slate-700">{document.requestedOutputFormat}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</div>
              <div className="mt-1 text-slate-700">{formatDate(document.createdAt)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</div>
              <div className="mt-1">
                <ConfidenceBadge score={document.confidenceScore} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="button-secondary w-full px-4 py-2 text-xs sm:w-auto" to={`${ROUTES.documents}/${document.id}`}>
              View details
            </Link>
            {onDelete ? (
              <button
                type="button"
                className="w-full rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 sm:w-auto"
                onClick={() => onDelete(document.id)}
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
    <div className="hidden overflow-x-auto md:block">
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
