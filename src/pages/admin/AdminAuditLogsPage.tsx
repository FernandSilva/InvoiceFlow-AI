import { useEffect, useState } from "react";
import { AuditLogTable } from "../../components/admin/AuditLogTable";
import { platformService } from "../../lib/services";
import type { AuditLog } from "../../types";

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    platformService.getAuditLogs().then(setLogs);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Audit Logs</h1>
        <p className="mt-2 text-sm text-slate-600">Track actor, target, entity, timestamp, and metadata for administrative and processing events.</p>
      </div>
      <AuditLogTable logs={logs} />
    </div>
  );
};
