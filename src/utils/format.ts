export const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

export const formatCurrency = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
