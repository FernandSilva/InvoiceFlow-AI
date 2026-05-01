import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../lib/constants";

const featureCards = [
  {
    title: "Read any invoice",
    body: "Upload PDFs, scans, spreadsheets, Word files, XML, CSV, and photographed receipts into one controlled intake flow.",
  },
  {
    title: "Convert documents into structured outputs",
    body: "Generate reviewable invoice data and export-ready JSON, XML, Excel, Word, and PDF placeholders designed for operational handoff.",
  },
  {
    title: "Prepare for digital invoicing",
    body: "Normalize invoice fields, tax values, buyer/seller metadata, and audit records so finance teams can move toward EU e-invoicing readiness.",
  },
  {
    title: "For small businesses and finance teams",
    body: "Designed for accountants, operations managers, shared services teams, and enterprise finance leaders that need throughput without losing oversight.",
  },
  {
    title: "Secure by design",
    body: "Private-by-default storage, role-aware access, explicit impersonation banners, and auditable admin actions create a credible security posture from day one.",
  },
];

export const LandingPage = () => (
  <div>
    <section className="bg-hero-grid">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            Investor-ready invoice infrastructure
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-extrabold tracking-tight text-slate-950 lg:text-6xl">
            Turn unstructured invoice documents into clean, compliant, usable business data.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            InvoiceFlow AI combines document intake, extraction review, and e-invoice preparation in one polished workspace built for modern finance operations.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link className="button-primary" to={ROUTES.register}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link className="button-secondary" to={ROUTES.login}>
              Login
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              "Multi-format invoice ingestion",
              "Structured output generation",
              "E-invoice normalization controls",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="panel overflow-hidden p-6">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Live operations snapshot</p>
                <p className="mt-2 text-2xl font-bold">April finance cycle</p>
              </div>
              <Sparkles className="h-8 w-8 text-brand-300" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/8 p-4">
                <div className="text-sm text-slate-300">Documents ingested</div>
                <div className="mt-3 text-3xl font-extrabold">12,480</div>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <div className="text-sm text-slate-300">Avg. extraction confidence</div>
                <div className="mt-3 text-3xl font-extrabold">91%</div>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <div className="text-sm text-slate-300">Review-ready outputs</div>
                <div className="mt-3 text-3xl font-extrabold">6 output types</div>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <div className="text-sm text-slate-300">Controls</div>
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Audit logging enabled
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((card) => (
          <div key={card.title} className="panel p-6">
            <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);
