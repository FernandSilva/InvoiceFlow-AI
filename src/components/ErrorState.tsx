import { AlertTriangle } from "lucide-react";

export const ErrorState = ({ title, description }: { title: string; description: string }) => (
  <div className="panel rounded-3xl border-rose-200 bg-rose-50 px-6 py-8 text-rose-900">
    <div className="flex items-start gap-4">
      <div className="rounded-2xl bg-rose-100 p-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-rose-800">{description}</p>
      </div>
    </div>
  </div>
);
