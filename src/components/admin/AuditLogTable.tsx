import type { AuditLog } from "../../types";
import { formatDate } from "../../utils/format";

export const AuditLogTable = ({ logs }: { logs: AuditLog[] }) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-5 py-4 font-semibold">Actor</th>
            <th className="px-5 py-4 font-semibold">Target</th>
            <th className="px-5 py-4 font-semibold">Action</th>
            <th className="px-5 py-4 font-semibold">Entity</th>
            <th className="px-5 py-4 font-semibold">Timestamp</th>
            <th className="px-5 py-4 font-semibold">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-slate-100 align-top">
              <td className="px-5 py-4">{log.actorUserId}</td>
              <td className="px-5 py-4">{log.targetUserId || "N/A"}</td>
              <td className="px-5 py-4">{log.action}</td>
              <td className="px-5 py-4">
                {log.entityType} / {log.entityId}
              </td>
              <td className="px-5 py-4">{formatDate(log.createdAt)}</td>
              <td className="px-5 py-4 text-xs text-slate-600">{JSON.stringify(log.metadata)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
