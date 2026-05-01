import { useAuth } from "../context/AuthContext";
import { platformService } from "../lib/services";

export const ProfilePage = () => {
  const { profile, setProfile } = useAuth();

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="panel p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Profile & Settings</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
            <input className="input-base" value={profile.fullName} readOnly />
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
            <input className="input-base" value={profile.companyName} readOnly />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
            <input className="input-base" value={profile.email} readOnly />
          </label>
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Onboarding completed</div>
              <p className="mt-1 text-sm text-slate-600">Reset onboarding if you want the guided product tour to appear again.</p>
            </div>
            <button
              type="button"
              className="button-secondary px-4 py-2 text-xs"
              onClick={async () => {
                const updated = await platformService.updateProfile(profile.id, {
                  onboardingCompleted: !profile.onboardingCompleted,
                });
                setProfile(updated);
              }}
            >
              {profile.onboardingCompleted ? "Reset onboarding" : "Mark completed"}
            </button>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          Uploaded documents should remain private by default. Account deletion, retention policy enforcement, and secure support access should be finalized before production.
        </div>
        <button type="button" className="mt-6 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
          Delete account placeholder
        </button>
      </div>
    </div>
  );
};
