import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useImpersonation } from "../../context/ImpersonationContext";
import { ROUTES } from "../../lib/constants";
import { platformService } from "../../lib/services";
import type { Profile } from "../../types";
import { formatDate } from "../../utils/format";

export const AdminUsersPage = () => {
  const { profile } = useAuth();
  const { startImpersonation } = useImpersonation();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    platformService.listProfiles().then(setProfiles);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Users</h1>
        <p className="mt-2 text-sm text-slate-600">Inspect user records, support activity, and access controls.</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">User name</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Company</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold text-slate-900">{item.fullName}</td>
                  <td className="px-5 py-4">{item.email}</td>
                  <td className="px-5 py-4">{item.companyName}</td>
                  <td className="px-5 py-4 capitalize">{item.role}</td>
                  <td className="px-5 py-4">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-4 capitalize">{item.status}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="button-secondary px-4 py-2 text-xs" to={`${ROUTES.adminUsers}/${item.userId}`}>
                        View user
                      </Link>
                      <button type="button" className="button-secondary px-4 py-2 text-xs">
                        Suspend
                      </button>
                      <button type="button" className="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700">
                        Delete
                      </button>
                      {profile && item.role !== "admin" ? (
                        <button
                          type="button"
                          className="button-primary px-4 py-2 text-xs"
                          onClick={async () => {
                            const target = await platformService.impersonateUser(profile, item.userId);
                            startImpersonation(profile, target);
                          }}
                        >
                          Impersonate user
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
