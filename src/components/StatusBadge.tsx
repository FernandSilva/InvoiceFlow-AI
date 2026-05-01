import clsx from "clsx";
import type { DocumentStatus, ProcessingStage } from "../types";

const toneMap: Record<DocumentStatus | ProcessingStage, string> = {
  uploaded: "bg-slate-100 text-slate-700",
  processing: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
  needs_review: "bg-orange-100 text-orange-800",
  idle: "bg-slate-100 text-slate-700",
  uploading: "bg-sky-100 text-sky-800",
  extracting: "bg-indigo-100 text-indigo-800",
  generating: "bg-violet-100 text-violet-800",
  complete: "bg-emerald-100 text-emerald-800",
};

export const StatusBadge = ({ status }: { status: DocumentStatus | ProcessingStage }) => (
  <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize", toneMap[status])}>
    {status.replace(/_/g, " ")}
  </span>
);
