import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Award, Briefcase, Shield, Target, Users, Zap } from "lucide-react";

export const AboutPage = () => {
  return (
    <div className="pb-32 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="mb-32 space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-600"
          >
            Our Mission
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl"
          >
            <span className="bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
              Removing the bottlenecks
            </span>
            <br className="hidden md:block" /> of modern finance.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600"
          >
            InvoiceFlow AI exists to remove manual invoice reading, manual rekeying, and inconsistent preparation for digital invoicing mandates.
          </motion.p>
        </section>

        <div className="mb-32 grid grid-cols-1 items-center gap-24 lg:grid-cols-2">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">Why we started.</h2>
              <p className="leading-relaxed text-slate-600">
                In 2024, we noticed that even advanced finance teams were still tethered to manual document processing. As digital invoicing mandates began expanding across Europe and beyond, the gap between cloud storage and real data intelligence became impossible to ignore.
              </p>
              <p className="leading-relaxed text-slate-600">
                We built InvoiceFlow AI to bridge that gap, giving SMEs, accountants, finance teams, and enterprises a reliable document-to-data pipeline that respects privacy and scales with operations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <ValueItem
                icon={<Shield className="h-5 w-5" />}
                title="Privacy First"
                text="Zero exposure of private credentials in browser environments."
              />
              <ValueItem
                icon={<Target className="h-5 w-5" />}
                title="SME Focused"
                text="Tools built for the real-world constraints of growing firms."
              />
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-square rotate-3 overflow-hidden rounded-[3rem] bg-slate-200 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-32 w-32 text-slate-400/30" />
              </div>
            </div>
            <div className="-z-10 absolute -left-12 -top-12 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-3">
          <Pillar
            icon={<Zap className="h-8 w-8 text-brand-500" />}
            title="Practical Speed"
            description="Faster processing without sacrificing oversight or control."
          />
          <Pillar
            icon={<Briefcase className="h-8 w-8 text-emerald-500" />}
            title="Smarter Data"
            description="Cleaner structured outputs ready for operational handoff and ERP workflows."
          />
          <Pillar
            icon={<Award className="h-8 w-8 text-orange-500" />}
            title="Future Ready"
            description="A credible path toward e-invoice readiness for global finance teams."
          />
        </div>
      </div>
    </div>
  );
};

const ValueItem = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-600">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-500">{text}</p>
    </div>
  );
};

const Pillar = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:border-brand-300">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
};
