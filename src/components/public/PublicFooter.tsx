import { FileText, Github, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_NAME, ROUTES } from "../../lib/constants";

export const PublicFooter = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <Link to={ROUTES.landing} className="flex items-center space-x-2">
              <div className="rounded-lg bg-brand-500 p-1.5">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                {APP_NAME.split(" ")[0]} <span className="text-brand-400">AI</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Modern invoice infrastructure for forward-thinking finance teams. Automated, secure, and ready for e-invoicing.
            </p>
            <div className="flex space-x-4">
              {[Twitter, Linkedin, Github].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="rounded-full bg-slate-800 p-2 transition-colors hover:bg-brand-500"
                  aria-label="Social link placeholder"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><Link to={ROUTES.landing} className="text-sm text-slate-400 transition-colors hover:text-white">Features</Link></li>
              <li><Link to={ROUTES.about} className="text-sm text-slate-400 transition-colors hover:text-white">About Us</Link></li>
              <li><Link to={ROUTES.login} className="text-sm text-slate-400 transition-colors hover:text-white">Security</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li><Link to={ROUTES.privacy} className="text-sm text-slate-400 transition-colors hover:text-white">Privacy Policy</Link></li>
              <li><Link to={ROUTES.terms} className="text-sm text-slate-400 transition-colors hover:text-white">Terms of Service</Link></li>
              <li><span className="text-sm text-slate-500">Cookie Policy</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Stay Informed</h4>
            <p className="mb-4 text-sm text-slate-400">Get updates on invoicing regulations and AI advances.</p>
            <form className="flex space-x-2" onSubmit={(event) => event.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-lg border-none bg-slate-800 px-4 py-2 text-sm outline-none ring-0 focus:ring-2 focus:ring-brand-400"
              />
              <button className="rounded-lg bg-brand-500 px-4 py-2 transition-colors hover:bg-brand-400" type="submit">
                Join
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500 md:flex-row">
          <p>© 2026 InvoiceFlow AI. Built for modern finance operations.</p>
          <p>Proudly serving SMEs and enterprises worldwide.</p>
        </div>
      </div>
    </footer>
  );
};
