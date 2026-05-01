import clsx from "clsx";

export const ConfidenceBadge = ({ score }: { score: number }) => {
  const tone = score >= 0.9 ? "bg-emerald-100 text-emerald-800" : score >= 0.8 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
  return <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tone)}>{Math.round(score * 100)}% confidence</span>;
};
