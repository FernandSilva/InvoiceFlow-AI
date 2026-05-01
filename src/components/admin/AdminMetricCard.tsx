export const AdminMetricCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) => (
  <div className="panel p-6">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-600">{hint}</p>
  </div>
);
