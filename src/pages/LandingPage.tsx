import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCheck,
  FileJson,
  Files,
  Globe,
  Lock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../lib/constants";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const LandingPage = () => {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="absolute right-0 top-0 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-brand-500/10 opacity-30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-8">
              <motion.div
                variants={fadeIn}
                className="inline-flex items-center space-x-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600"
              >
                <Zap className="h-3 w-3" />
                <span>Investor-ready invoice infrastructure</span>
              </motion.div>

              <motion.h1 variants={fadeIn} className="text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-7xl">
                Turn <span className="italic text-brand-500">unstructured</span> invoice documents into{" "}
                <span className="underline decoration-emerald-500/30">usable</span> data.
              </motion.h1>

              <motion.p variants={fadeIn} className="max-w-xl text-xl leading-relaxed text-slate-600">
                InvoiceFlow AI combines document intake, extraction review, and e-invoice preparation in one polished workspace built for modern finance operations.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
                <Link
                  to={ROUTES.register}
                  className="flex items-center gap-2 rounded-full bg-brand-500 px-8 py-4 font-bold text-white shadow-xl shadow-brand-500/25 transition-all hover:-translate-y-1 hover:bg-brand-600"
                >
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to={ROUTES.login}
                  className="rounded-full border border-slate-200 bg-slate-100 px-8 py-4 font-bold text-slate-900 transition-all hover:bg-slate-200"
                >
                  View Demo
                </Link>
              </motion.div>

              <motion.div variants={fadeIn} className="flex items-center gap-6 pt-4 text-slate-400 grayscale opacity-70">
                <span className="text-xs font-bold uppercase tracking-widest">Trusted by builders at</span>
                <div className="flex gap-4">
                  <div className="h-6 w-24 rounded-md bg-slate-200" />
                  <div className="h-6 w-24 rounded-md bg-slate-200" />
                  <div className="h-6 w-24 rounded-md bg-slate-200" />
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 rounded-3xl border border-slate-700/50 bg-slate-900 p-6 shadow-2xl">
                <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-500">April finance cycle</span>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                      <p className="mb-1 text-xs font-mono uppercase tracking-tighter text-slate-400">Documents ingested</p>
                      <p className="text-2xl font-bold tracking-widest text-white">12,480</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                      <p className="mb-1 text-xs font-mono uppercase tracking-tighter text-emerald-400">Avg. confidence</p>
                      <p className="text-2xl font-bold tracking-widest text-white">91%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1.5, delay: 1 }}
                        className="h-full bg-brand-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[10px] text-slate-500">
                      <span>EXTRACTION PIPELINE</span>
                      <span>85% CAPACITY</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-brand-500/20 bg-brand-500/10 p-4">
                    <div className="rounded-lg bg-brand-500 p-2">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight text-white">Security Posture Active</p>
                      <p className="text-xs text-slate-400">Encryption L4 enabled • Audit logging active</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -left-4 -right-4 top-10 -z-10 rounded-3xl bg-brand-500/20 blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Files className="h-6 w-6 text-brand-500" />}
              title="Multi-format Ingestion"
              description="Upload PDFs, scans, spreadsheets, XML, and photographed receipts."
            />
            <FeatureCard
              icon={<Cpu className="h-6 w-6 text-emerald-500" />}
              title="Autonomous Extraction"
              description="AI-driven field mapping with dynamic confidence scoring."
            />
            <FeatureCard
              icon={<FileJson className="h-6 w-6 text-orange-500" />}
              title="E-invoice Ready"
              description="Normalize tax values and metadata for EU compliance mandates."
            />
            <FeatureCard
              icon={<FileCheck className="h-6 w-6 text-violet-500" />}
              title="Audit Controls"
              description="Full traceability for every document, edit, and export event."
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="mb-8 inline-block rounded-2xl border border-slate-200 bg-slate-100 p-2">
                  <div className="flex h-48 w-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-200">
                    <Files className="h-12 w-12 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="order-1 space-y-6 lg:order-2">
                <div className="mb-2 font-mono text-sm font-bold uppercase tracking-widest text-brand-600">01. INGEST</div>
                <h2 className="text-4xl font-bold leading-tight text-slate-900">Read any invoice, from any source, in any format.</h2>
                <p className="text-lg leading-relaxed text-slate-600">
                  Bulk upload documents from your desktop, forward them by email, or connect your cloud storage. The pipeline is designed to handle low-resolution scans and complex multi-page documents without turning review into a bottleneck.
                </p>
                <ul className="space-y-3">
                  {["PDF & Image support", "Excel & Word conversion", "API-first intake"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="mb-2 font-mono text-sm font-bold uppercase tracking-widest text-emerald-500">02. EXTRACT</div>
                <h2 className="text-4xl font-bold leading-tight text-slate-900">Convert documents into clean, structured data outputs.</h2>
                <p className="text-lg leading-relaxed text-slate-600">
                  Automatically identify line items, tax rates, vendor IDs, and currency. Review lower-confidence extractions in a polished workspace before data moves downstream.
                </p>
                <ul className="space-y-3">
                  {["Line-item extraction", "Structured output generation", "Confidence thresholding"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-inner">
                  <div className="space-y-4 font-mono text-[10px]">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-400">VENDOR_NAME</span>
                      <span className="font-bold text-slate-900">LUMINA CORP</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-400">INVOICE_NUMBER</span>
                      <span className="font-bold text-slate-900">INV-990-21</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-400">TOTAL_AMOUNT</span>
                      <span className="font-bold text-slate-900">€1,450.00</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-400">TAX_RATE</span>
                      <span className="font-bold text-slate-900">21% VAT</span>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-center">
                    <div className="animate-pulse rounded-full bg-emerald-500 px-4 py-1.5 text-[10px] font-bold text-white">
                      READY FOR ERP
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="flex h-64 items-center justify-center rounded-3xl bg-slate-900">
                  <Globe className="h-24 w-24 animate-[spin_20s_linear_infinite] text-slate-700" />
                </div>
              </div>
              <div className="order-1 space-y-6 lg:order-2">
                <div className="mb-2 font-mono text-sm font-bold uppercase tracking-widest text-orange-500">03. COMPLY</div>
                <h2 className="text-4xl font-bold leading-tight text-slate-900">Prepare for the future of digital invoicing.</h2>
                <p className="text-lg leading-relaxed text-slate-600">
                  Normalize your data for the next generation of e-invoicing workflows. Generate structured JSON or XML outputs designed for clean operational handoff and future compliance layers.
                </p>
                <ul className="space-y-3">
                  {["Structured XML generation", "Semantic field validation", "Cross-border tax logic readiness"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
        <div className="absolute bottom-0 left-0 -z-10 h-1/2 w-full bg-gradient-to-t from-brand-500/10 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-4xl font-bold">Secure by Design.</h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              We built InvoiceFlow AI with a security-first architecture so your data stays inside a controlled perimeter with role-aware access and backend-only AI processing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <SecurityFeature
              icon={<Lock className="h-6 w-6" />}
              title="Private-by-default Storage"
              description="Documents remain protected in Appwrite storage with controlled access and no client-side secret exposure."
            />
            <SecurityFeature
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Role-Aware Access"
              description="Granular permissions for owners, reviewers, and admin-only support actions."
            />
            <SecurityFeature
              icon={<FileCheck className="h-6 w-6" />}
              title="Auditable Admin Actions"
              description="Every impersonation, export, and configuration change is logged for compliance review."
            />
          </div>
        </div>
      </section>

      <section className="relative bg-brand-500 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl">Ready to stop manual rekeying?</h2>
            <p className="mx-auto max-w-2xl text-xl text-white/80">
              Join finance teams modernizing their invoice infrastructure with InvoiceFlow AI.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to={ROUTES.register}
                className="rounded-full bg-white px-10 py-5 text-lg font-bold text-brand-600 shadow-2xl transition-all hover:scale-105"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </motion.div>
  );
};

const SecurityFeature = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-800/50 p-8 transition-all hover:border-brand-500/50">
      <div className="mb-4 text-brand-400">{icon}</div>
      <h3 className="mb-2 text-lg font-bold tracking-tight">{title}</h3>
      <p className="font-mono text-sm leading-relaxed tracking-tighter text-slate-400">{description}</p>
    </div>
  );
};
