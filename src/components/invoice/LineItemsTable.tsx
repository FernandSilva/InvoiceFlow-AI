import type { LineItem } from "../../types";
import { formatCurrency } from "../../utils/format";

export const LineItemsTable = ({
  lineItems,
  editable = false,
  onChange,
}: {
  lineItems: LineItem[];
  editable?: boolean;
  onChange?: (lineItems: LineItem[]) => void;
}) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-3 font-semibold">Description</th>
          <th className="px-4 py-3 font-semibold">Qty</th>
          <th className="px-4 py-3 font-semibold">Unit price</th>
          <th className="px-4 py-3 font-semibold">Tax</th>
          <th className="px-4 py-3 font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>
        {lineItems.map((item) => (
          <tr key={item.id} className="border-t border-slate-100">
            <td className="px-4 py-3">
              {editable ? (
                <input
                  className="input-base py-2"
                  value={item.description}
                  onChange={(event) =>
                    onChange?.(
                      lineItems.map((line) =>
                        line.id === item.id ? { ...line, description: event.target.value } : line,
                      ),
                    )
                  }
                />
              ) : (
                item.description
              )}
            </td>
            <td className="px-4 py-3">{item.quantity}</td>
            <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
            <td className="px-4 py-3">{item.taxRate}%</td>
            <td className="px-4 py-3">{formatCurrency(item.totalAmount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
