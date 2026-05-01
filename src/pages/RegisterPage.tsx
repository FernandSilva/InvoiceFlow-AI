import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../lib/constants";

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "demo-password",
    fullName: "",
    companyName: "",
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="panel p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Create account</h1>
        <p className="mt-3 text-sm text-slate-600">Set up your workspace and create a profile row after registration.</p>
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
          <input
            className="input-base"
            disabled={isSubmitting}
            placeholder="Full name"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          />
          <input
            className="input-base"
            disabled={isSubmitting}
            placeholder="Company name"
            value={form.companyName}
            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
          />
          <input
            className="input-base"
            type="email"
            disabled={isSubmitting}
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            className="input-base"
            type="password"
            disabled={isSubmitting}
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          {error ? <div className="text-sm text-rose-700">{error}</div> : null}
          <button className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};
