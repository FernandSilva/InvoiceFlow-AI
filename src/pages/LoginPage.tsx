import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../lib/constants";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="panel p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Login</h1>
        <p className="mt-3 text-sm text-slate-600">Access your invoice operations workspace.</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) {
              return;
            }
            setError("");
            setIsSubmitting(true);
            try {
              await login(email, password);
              navigate(location.state?.from || ROUTES.dashboard);
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : "Unable to login.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <input className="input-base" disabled={isSubmitting} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <input
            className="input-base"
            type="password"
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
          {error ? <div className="text-sm text-rose-700">{error}</div> : null}
          <button className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Forgot password placeholder. In mock mode, entering the admin email logs into the admin dashboard.</p>
      </div>
    </div>
  );
};
