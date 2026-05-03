import { motion } from "motion/react";
import { ArrowLeft, FileText, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../lib/constants";
import { appLogger } from "../lib/logger";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-12"
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Access Dashboard</h1>
          <p className="text-slate-500">Secure entry to your finance workspace.</p>
        </div>
        <form
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) {
              appLogger.warn("LoginPage", "Duplicate login submission blocked.", { email });
              return;
            }
            setError("");
            setIsSubmitting(true);
            try {
              appLogger.info("LoginPage", "Submitting login form.", { email });
              await login(email, password);
              navigate(location.state?.from || ROUTES.dashboard);
              appLogger.info("LoginPage", "Login navigation completed.", {
                destination: location.state?.from || ROUTES.dashboard,
              });
            } catch (loginError) {
              appLogger.error("LoginPage", "Login form submission failed.", {
                email,
                error: loginError instanceof Error ? loginError.message : "unknown",
              });
              setError(loginError instanceof Error ? loginError.message : "Unable to login.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Work Email</label>
            <div className="group relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-500" />
              <input
                type="email"
                disabled={isSubmitting}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="finance@acme.co"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="ml-1 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Forgot?</span>
            </div>
            <div className="group relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-500" />
              <input
                type="password"
                disabled={isSubmitting}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {error ? <div className="text-sm text-rose-700">{error}</div> : null}

          <button
            className="w-full rounded-2xl bg-brand-500 py-4 font-bold text-white shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Enter Workspace"}
          </button>
        </form>

        <div className="mt-12 border-t border-slate-100 pt-8 text-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to={ROUTES.register} className="font-bold text-brand-500 hover:underline">
              Start transformation
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
