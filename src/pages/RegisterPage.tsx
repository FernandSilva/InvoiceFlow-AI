import { motion } from "motion/react";
import { ArrowLeft, Briefcase, FileText, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../lib/constants";

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-12"
      >
        <div className="mb-12 space-y-6 text-center">
          <Link to={ROUTES.landing} className="group mb-4 inline-flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Back to site</span>
          </Link>
          <div className="flex justify-center">
            <div className="rounded-[1.25rem] bg-brand-500 p-3 shadow-xl shadow-brand-500/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">Start your journey.</h1>
          <p className="mx-auto max-w-xs text-slate-500">Modernize your finance operations in under 5 minutes.</p>
        </div>
        <form
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) {
              return;
            }

            setError("");
            setIsSubmitting(true);
            try {
              await register(form);
              navigate(ROUTES.dashboard);
            } catch (registerError) {
              setError(
                registerError instanceof Error
                  ? registerError.message
                  : "Unable to create your account right now. Please try again.",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Alex Rivera"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Company</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Acme Finance"
                value={form.companyName}
                onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                disabled={isSubmitting}
                placeholder="alex@acme.co"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                disabled={isSubmitting}
                placeholder="Min. 12 characters"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {error ? <div className="text-sm text-rose-700 md:col-span-2">{error}</div> : null}

          <div className="py-4 md:col-span-2">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating workspace..." : "Create My Workspace"}
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-4 text-center">
          <p className="px-4 text-xs leading-relaxed text-slate-400">
            By joining, you agree to our{" "}
            <Link to={ROUTES.terms} className="underline">
              Terms of Service
            </Link>{" "}
            and acknowledge our{" "}
            <Link to={ROUTES.privacy} className="underline">
              Privacy Commitment
            </Link>
            .
          </p>
          <div className="border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              Already using InvoiceFlow?{" "}
              <Link to={ROUTES.login} className="font-bold text-brand-500 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
