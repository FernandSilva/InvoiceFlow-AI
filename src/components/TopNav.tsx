import { Menu, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME, ROUTES, USE_MOCKS } from "../lib/constants";

export const TopNav = () => {
  const { profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-600 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <Link to={ROUTES.landing} className="text-lg font-extrabold tracking-tight text-slate-950">
            {APP_NAME}
          </Link>
          {USE_MOCKS ? (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Mock mode</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-slate-900">{profile?.fullName || "Guest"}</div>
            <div className="text-xs text-slate-500">{profile?.companyName || "Workspace"}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-2 text-slate-700">
            <UserCircle2 className="h-6 w-6" />
          </div>
          {profile ? (
            <button type="button" className="button-secondary px-4 py-2 text-xs" onClick={() => void logout()}>
              Logout
            </button>
          ) : (
            <Link to={ROUTES.login} className="button-secondary px-4 py-2 text-xs">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
