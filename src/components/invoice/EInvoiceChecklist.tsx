import { CheckCircle2, CircleAlert } from "lucide-react";
import type { ExtractedData } from "../../types";

const buildItems = (data: ExtractedData) => [
  { label: "Seller details", complete: Boolean(data.supplierName && data.supplierTaxId) },
  { label: "Buyer details", complete: Boolean(data.buyerName && data.buyerTaxId) },
  { label: "Invoice number", complete: Boolean(data.invoiceNumber) },
  { label: "Invoice date", complete: Boolean(data.invoiceDate) },
  { label: "Due date", complete: Boolean(data.dueDate) },
  { label: "Currency", complete: Boolean(data.currency) },
  { label: "VAT/tax data", complete: data.taxTotal >= 0 },
  { label: "Line items", complete: data.lineItems.length > 0 },
  { label: "Total/net/gross", complete: data.total > 0 && data.subtotal > 0 },
];

export const EInvoiceChecklist = ({ data }: { data: ExtractedData }) => {
  const items = buildItems(data);
  return (
    <div className="panel p-6">
      <h3 className="text-lg font-bold text-slate-900">E-invoice readiness checklist</h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="font-medium text-slate-800">{item.label}</span>
            {item.complete ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                <CircleAlert className="h-4 w-4" />
                Review required
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
