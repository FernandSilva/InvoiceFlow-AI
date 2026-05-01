import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { platformService } from "../lib/services";
import { ROUTES } from "../lib/constants";

const steps = [
  "Upload a business document or invoice.",
  "Select the workflow and output format.",
  "Review the extracted structured fields.",
  "Download outputs or continue to e-invoice preparation.",
  "Your documents remain private by default and admin actions are intended to be logged.",
];

export const OnboardingPage = () => {
  const { profile, setProfile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="panel p-8">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">One-time onboarding</div>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">How InvoiceFlow AI works</h1>
        <div className="mt-8 space-y-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{index + 1}</div>
              <p className="text-sm text-slate-700">{step}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="button-primary mt-8"
          onClick={async () => {
            const updated = await platformService.updateProfile(profile.id, { onboardingCompleted: true });
            setProfile(updated);
            navigate(ROUTES.dashboard);
          }}
        >
          Finish onboarding
        </button>
      </div>
    </div>
  );
};
