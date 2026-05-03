import { AdminMetricCard } from "../../components/admin/AdminMetricCard";
import { useEffect, useState } from "react";
import { platformService } from "../../lib/services";
import type { AdminMetrics, AuditLog } from "../../types";
import { AuditLogTable } from "../../components/admin/AuditLogTable";

export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState<AdminMetrics>();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    platformService.getAdminMetrics().then(setMetrics);
    platformService.getAuditLogs().then((items) => setLogs(items.slice(0, 5)));
  }, []);

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Platform analytics, service posture, and recent admin activity.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <AdminMetricCard label="Total users" value={String(metrics.totalUsers)} hint="Registered users across the platform." />
        <AdminMetricCard label="Active users" value={String(metrics.activeUsers)} hint="Profiles currently marked active." />
        <AdminMetricCard label="Documents processed" value={String(metrics.documentsProcessed)} hint="All ingested documents to date." />
        <AdminMetricCard label="Failed documents" value={String(metrics.failedDocuments)} hint="Jobs requiring retry or investigation." />
        <AdminMetricCard label="E-invoices created" value={String(metrics.eInvoicesCreated)} hint="Structured e-invoice outputs initiated." />
        <AdminMetricCard label="Average confidence" value={`${Math.round(metrics.averageConfidence * 100)}%`} hint="Extraction quality across processed documents." />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-6">
          <h2 className="text-xl font-bold text-slate-900">Recent activity</h2>
          <div className="mt-5 rounded-3xl bg-slate-950 p-6 text-white">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-slate-300">Processing throughput</div>
                <div className="mt-2 text-3xl font-extrabold">+18%</div>
              </div>
              <div>
                <div className="text-sm text-slate-300">Needs review rate</div>
                <div className="mt-2 text-3xl font-extrabold">7.4%</div>
              </div>
              <div>
                <div className="text-sm text-slate-300">Service status</div>
                <div className="mt-2 text-3xl font-extrabold">Nominal</div>
              </div>
            </div>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="text-xl font-bold text-slate-900">Platform configuration</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 px-4 py-3">AI provider: configurable via Appwrite Function env vars</div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">Storage bucket: 69f4baed0038dc6f98a8 with logical original, outputs, and temp prefixes</div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">Admin support access: explicit audited simulation banner enabled for MVP</div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Audit highlights</h2>
        <AuditLogTable logs={logs} />
      </div>
    </div>
  );
};
