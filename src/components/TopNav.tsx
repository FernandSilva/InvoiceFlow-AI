import { Menu, Shield, UserCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME, ROUTES } from "../lib/constants";
import { isAdmin } from "../lib/permissions";

interface TopNavProps {
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  onCloseMobileNav: () => void;
}

export const TopNav = ({ mobileNavOpen, onToggleMobileNav, onCloseMobileNav }: TopNavProps) => {
  const { profile, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    onCloseMobileNav();
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-brand-200 hover:text-brand-700 lg:hidden"
            onClick={onToggleMobileNav}
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-app-navigation"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <Link to={ROUTES.dashboard} className="block truncate text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">
              {APP_NAME}
            </Link>
            <div className="hidden text-xs font-medium text-slate-500 sm:block">
              Document automation and e-invoice readiness
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3" ref={menuRef}>
          <div className="hidden text-right md:block">
            <div className="max-w-[12rem] truncate text-sm font-semibold text-slate-900">{profile?.fullName || "Guest"}</div>
            <div className="max-w-[12rem] truncate text-xs text-slate-500">{profile?.companyName || "Workspace"}</div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
            onClick={() => setAccountMenuOpen((current) => !current)}
            aria-label="Toggle account menu"
            aria-expanded={accountMenuOpen}
          >
            <UserCircle2 className="h-6 w-6 shrink-0" />
            <span className="hidden text-sm font-semibold sm:inline">{profile?.fullName?.split(" ")[0] || "Account"}</span>
          </button>
          {accountMenuOpen ? (
            <div className="absolute right-4 top-[calc(100%-0.25rem)] w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 sm:right-6 lg:right-8">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="truncate text-sm font-semibold text-slate-900">{profile?.fullName || "Guest"}</div>
                <div className="mt-1 truncate text-xs text-slate-500">{profile?.email || "No email available"}</div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to={ROUTES.profile}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onCloseMobileNav();
                  }}
                >
                  Profile settings
                  <UserCircle2 className="h-4 w-4" />
                </Link>
                {isAdmin(profile) ? (
                  <Link
                    to={ROUTES.adminDashboard}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onCloseMobileNav();
                    }}
                  >
                    Admin workspace
                    <Shield className="h-4 w-4" />
                  </Link>
                ) : null}
                {profile ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    onClick={() => void handleLogout()}
                  >
                    Logout
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    to={ROUTES.login}
                    className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onCloseMobileNav();
                    }}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
