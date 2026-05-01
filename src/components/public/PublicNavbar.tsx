import { motion } from "motion/react";
import { FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { APP_NAME, ROUTES } from "../../lib/constants";

export const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="glass fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={ROUTES.landing} className="flex items-center space-x-2">
            <div className="rounded-lg bg-brand-500 p-1.5">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {APP_NAME.split(" ")[0]} <span className="text-brand-500">AI</span>
            </span>
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            <Link to={ROUTES.landing} className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600">Home</Link>
            <Link to={ROUTES.about} className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600">About</Link>
            <Link to={ROUTES.privacy} className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600">Privacy</Link>
            <Link to={ROUTES.login} className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600">Login</Link>
            <Link
              to={ROUTES.register}
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen((value) => !value)} className="p-2 text-slate-600" type="button" aria-label="Toggle navigation">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-slate-200 bg-white px-4 py-6 shadow-xl md:hidden"
        >
          <div className="space-y-4">
            <Link onClick={() => setIsOpen(false)} to={ROUTES.landing} className="block text-base font-medium text-slate-600">Home</Link>
            <Link onClick={() => setIsOpen(false)} to={ROUTES.about} className="block text-base font-medium text-slate-600">About</Link>
            <Link onClick={() => setIsOpen(false)} to={ROUTES.privacy} className="block text-base font-medium text-slate-600">Privacy</Link>
            <Link onClick={() => setIsOpen(false)} to={ROUTES.login} className="block text-base font-medium text-slate-600">Login</Link>
            <Link
              onClick={() => setIsOpen(false)}
              to={ROUTES.register}
              className="block w-full rounded-lg bg-brand-500 px-4 py-2 text-center text-base font-semibold text-white shadow-lg shadow-brand-500/20"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      ) : null}
    </nav>
  );
};
