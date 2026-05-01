const privacySections = [
  "Users retain ownership of all uploaded documents and extracted invoice data.",
  "InvoiceFlow AI does not claim ownership over uploaded invoices, receipts, or business records.",
  "Documents are processed solely to perform the workflow selected by the user, such as invoice extraction or e-invoice preparation.",
  "Storage access is private by default and should be enforced with Appwrite storage permissions and per-user access controls.",
  "Administrative access is restricted, role-checked, and expected to be logged in audit records for review and support accountability.",
  "AI-assisted extraction may involve probabilistic processing. Users must review outputs before relying on them for accounting, legal, or tax purposes.",
  "Users may request deletion of their data, subject to retention obligations, security investigations, or lawful preservation requirements.",
];

export const PrivacyPage = () => (
  <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
    <div className="panel p-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Privacy Policy</h1>
      <div className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
        {privacySections.map((section) => (
          <p key={section}>{section}</p>
        ))}
      </div>
    </div>
  </div>
);
