import { FileSearch } from "lucide-react";

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="panel flex min-h-60 flex-col items-center justify-center px-6 py-10 text-center">
    <div className="mb-4 rounded-2xl bg-brand-50 p-4 text-brand-700">
      <FileSearch className="h-8 w-8" />
    </div>
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
  </div>
);
