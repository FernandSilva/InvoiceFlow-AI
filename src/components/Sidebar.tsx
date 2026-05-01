import clsx from "clsx";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Lock,
  Settings,
  Shield,
  Users,
  WandSparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../lib/constants";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../lib/permissions";

const userNav = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.invoiceReader, label: "Invoice Reader", icon: FileText },
  { to: ROUTES.eInvoiceCreator, label: "E-Invoice Creator", icon: WandSparkles },
  { to: ROUTES.documents, label: "My Documents", icon: BarChart3 },
  { to: ROUTES.profile, label: "Profile", icon: Settings },
];

const adminNav = [
  { to: ROUTES.adminDashboard, label: "Admin Dashboard", icon: Shield },
  { to: ROUTES.adminUsers, label: "Users", icon: Users },
  { to: ROUTES.adminDocuments, label: "Documents", icon: FileText },
  { to: ROUTES.adminAuditLogs, label: "Audit Logs", icon: Lock },
];

export const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const links = isAdmin(profile) ? [...userNav, ...adminNav] : userNav;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/85 px-5 py-8 lg:block">
      <div className="rounded-3xl bg-hero-grid p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">InvoiceFlow AI</div>
        <div className="mt-3 text-2xl font-extrabold text-slate-950">Structured document operations for modern finance teams.</div>
      </div>
      <nav className="mt-8 space-y-2">
        {links.map((link) => {
          const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
