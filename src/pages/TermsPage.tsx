const termsSections = [
  "Users may not upload illegal, malicious, or unauthorized content.",
  "Users remain responsible for the accuracy, lawfulness, and business validity of invoices and accounting records submitted to the service.",
  "AI-generated outputs must be reviewed before accounting, filing, payment, or compliance use.",
  "InvoiceFlow AI does not guarantee legal, tax, or jurisdiction-specific compliance and should not be treated as legal advice.",
  "Subscription, pricing, and payment terms are placeholders in this MVP and must be finalized before commercial launch.",
  "Limitation of liability, service availability, and indemnity terms should be reviewed by legal counsel before production release.",
];

export const TermsPage = () => (
  <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
    <div className="panel p-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Terms of Service</h1>
      <div className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
        {termsSections.map((section) => (
          <p key={section}>{section}</p>
        ))}
      </div>
    </div>
  </div>
);
