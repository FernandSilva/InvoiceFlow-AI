import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useImpersonation } from "../../context/ImpersonationContext";
import { platformService } from "../../lib/services";
import type { DocumentRecord, Profile, UserUsage } from "../../types";

export const AdminUserDetailPage = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const { startImpersonation } = useImpersonation();
  const [userProfile, setUserProfile] = useState<Profile>();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [usage, setUsage] = useState<UserUsage>();

  useEffect(() => {
    platformService.listProfiles().then((profiles) => {
      const target = profiles.find((item) => item.userId === id);
      setUserProfile(target);
      if (target) {
        platformService.listDocuments(target).then(setDocuments);
        platformService.getUsage(target.userId).then(setUsage);
      }
    });
  }, [id]);

  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <div className="panel p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{userProfile.fullName}</h1>
            <p className="mt-3 text-sm text-slate-600">{userProfile.email} • {userProfile.companyName}</p>
          </div>
          {profile ? (
            <button
              type="button"
              className="button-primary"
              onClick={async () => {
                const target = await platformService.impersonateUser(profile, userProfile.userId);
                startImpersonation(profile, target);
              }}
            >
              Impersonate user
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-6">
          <h2 className="text-xl font-bold text-slate-900">Usage stats</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 px-4 py-3">Documents processed: {usage?.documentsProcessed || 0}</div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">E-invoices created: {usage?.eInvoicesCreated || 0}</div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">Reader conversions: {usage?.readerConversions || 0}</div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">Failed jobs: {usage?.failedJobs || 0}</div>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="text-xl font-bold text-slate-900">User documents metadata</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            {documents.map((document) => (
              <div key={document.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="font-semibold text-slate-900">{document.originalFileName}</div>
                <div className="mt-1 capitalize">{document.workflowType.replace(/_/g, " ")} • {document.status.replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
