import { Outlet } from "react-router-dom";
import { PublicFooter } from "../components/public/PublicFooter";
import { PublicNavbar } from "../components/public/PublicNavbar";

export const PublicLayout = () => (
  <div className="min-h-screen bg-cloud">
    <PublicNavbar />
    <main>
      <Outlet />
    </main>
    <PublicFooter />
  </div>
);
