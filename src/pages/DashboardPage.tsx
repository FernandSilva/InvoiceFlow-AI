import { Link } from "react-router-dom";
import { DocumentTable } from "../components/documents/DocumentTable";
import { ModuleCard } from "../components/ModuleCard";
import { useAuth } from "../context/AuthContext";
import { useDocuments } from "../context/DocumentsContext";
import { ROUTES } from "../lib/constants";

export const DashboardPage = () => {
  const { profile } = useAuth();
  const { documents, deleteDocument } = useDocuments();
  const recentDocuments = documents.slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="panel bg-hero-grid p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Workspace overview</div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
              Welcome back, {profile?.fullName?.split(" ")[0] || "team"}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Operate extraction, review, and e-invoice preparation from one secure dashboard built for finance teams.
            </p>
          </div>
          <Link className="button-primary" to={ROUTES.invoiceReader}>
            Quick upload
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ModuleCard
          title="Invoice Reader & Converter"
          description="Upload any business document, extract the fields, review the structure, and export to the format your team needs."
          to={ROUTES.invoiceReader}
          accent="bg-gradient-to-br from-brand-500 to-brand-700"
        />
        <ModuleCard
          title="Create E-Invoice"
          description="Normalize buyer, seller, tax, totals, and line items into a digital invoice structure ready for validation and downstream integration."
          to={ROUTES.eInvoiceCreator}
          accent="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent documents</h2>
            <Link className="text-sm font-semibold text-brand-700" to={ROUTES.documents}>
              View all
            </Link>
          </div>
          <DocumentTable documents={recentDocuments} onDelete={(documentId) => void deleteDocument(documentId)} />
        </div>
        <div className="space-y-6">
          <div className="panel p-6">
            <h3 className="text-lg font-bold text-slate-900">Processing stats</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Documents</div>
                <div className="mt-2 text-3xl font-extrabold">{documents.length}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Needs review</div>
                <div className="mt-2 text-3xl font-extrabold">{documents.filter((item) => item.status === "needs_review").length}</div>
              </div>
            </div>
          </div>
          <div className="panel p-6">
            <h3 className="text-lg font-bold text-slate-900">Compliance readiness</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Normalize VAT, line items, and buyer/seller identity before generating e-invoice payloads. Use the creator workflow for structured review and audit-friendly metadata.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
