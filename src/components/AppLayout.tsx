import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export const AppLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-cloud">
      <ImpersonationBanner />
      <TopNav
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((current) => !current)}
        onCloseMobileNav={() => setMobileNavOpen(false)}
      />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>

      <div
        className={`fixed inset-0 z-30 bg-slate-950/35 transition lg:hidden ${mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />
      <div
        id="mobile-app-navigation"
        className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[88vw] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Navigation</div>
          <div className="mt-2 text-sm text-slate-600">Move through your workspace, documents, and admin tools from one place.</div>
        </div>
        <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
      </div>
    </div>
  );
};
