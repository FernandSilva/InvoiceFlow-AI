import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const ModuleCard = ({
  title,
  description,
  to,
  accent,
}: {
  title: string;
  description: string;
  to: string;
  accent: string;
}) => (
  <Link to={to} className="panel group flex h-full flex-col justify-between p-6 transition hover:-translate-y-1 hover:shadow-panel">
    <div>
      <div className={`mb-5 h-14 w-14 rounded-2xl ${accent}`} />
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
      Open workflow
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
    </div>
  </Link>
);
