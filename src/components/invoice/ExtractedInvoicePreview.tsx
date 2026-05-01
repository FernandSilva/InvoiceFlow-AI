import type { ExtractedData } from "../../types";
import { formatCurrency } from "../../utils/format";
import { ConfidenceBadge } from "../ConfidenceBadge";
import { LineItemsTable } from "./LineItemsTable";

const fieldLabels: Array<{ key: keyof ExtractedData; label: string }> = [
  { key: "supplierName", label: "Supplier" },
  { key: "buyerName", label: "Buyer" },
  { key: "invoiceNumber", label: "Invoice number" },
  { key: "invoiceDate", label: "Invoice date" },
  { key: "dueDate", label: "Due date" },
  { key: "currency", label: "Currency" },
];

export const ExtractedInvoicePreview = ({
  data,
  confidence,
  editable = false,
  onUpdate,
}: {
  data: ExtractedData;
  confidence: number;
  editable?: boolean;
  onUpdate?: (updates: Partial<ExtractedData>) => void;
}) => (
  <div className="space-y-6">
    <div className="panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Extracted invoice preview</h3>
          <p className="mt-1 text-sm text-slate-600">Review the normalized fields before export or e-invoice generation.</p>
        </div>
        <ConfidenceBadge score={confidence} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fieldLabels.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</span>
            {editable ? (
              <input
                className="input-base"
                value={String(data[field.key] ?? "")}
                onChange={(event) => onUpdate?.({ [field.key]: event.target.value } as Partial<ExtractedData>)}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">{String(data[field.key] ?? "N/A")}</div>
            )}
          </label>
        ))}
      </div>
    </div>
    <div className="panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Line items</h3>
        <div className="text-sm text-slate-500">
          Subtotal {formatCurrency(data.subtotal, data.currency)} • Tax {formatCurrency(data.taxTotal, data.currency)} • Total {formatCurrency(data.total, data.currency)}
        </div>
      </div>
      <LineItemsTable
        lineItems={data.lineItems}
        editable={editable}
        onChange={(lineItems) => onUpdate?.({ lineItems })}
      />
      {data.validationIssues.length ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-semibold">Validation notes</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {data.validationIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  </div>
);
