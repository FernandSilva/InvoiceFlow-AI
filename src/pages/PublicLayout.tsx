import { Link, Outlet } from "react-router-dom";
import { APP_NAME, ROUTES } from "../lib/constants";

export const PublicLayout = () => (
  <div className="min-h-screen bg-cloud">
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to={ROUTES.landing} className="text-lg font-extrabold tracking-tight text-slate-950">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link to={ROUTES.about}>About</Link>
          <Link to={ROUTES.privacy}>Privacy</Link>
          <Link to={ROUTES.terms}>Terms</Link>
          <Link className="button-secondary px-4 py-2 text-xs" to={ROUTES.login}>
            Login
          </Link>
          <Link className="button-primary px-4 py-2 text-xs" to={ROUTES.register}>
            Get Started
          </Link>
        </nav>
      </div>
    </header>
    <main>
      <Outlet />
    </main>
  </div>
);
