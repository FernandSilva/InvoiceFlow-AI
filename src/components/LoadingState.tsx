export const LoadingState = ({ label = "Loading workspace..." }: { label?: string }) => (
  <div className="panel flex min-h-48 items-center justify-center px-6 py-10">
    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
      <span className="h-3 w-3 animate-pulse rounded-full bg-brand-600" />
      {label}
    </div>
  </div>
);
