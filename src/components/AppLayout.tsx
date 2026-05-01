import { Outlet } from "react-router-dom";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export const AppLayout = () => (
  <div className="min-h-screen bg-cloud">
    <ImpersonationBanner />
    <TopNav />
    <div className="mx-auto flex max-w-7xl">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  </div>
);
