import { ShieldAlert } from "lucide-react";
import { useImpersonation } from "../context/ImpersonationContext";

export const ImpersonationBanner = () => {
  const { active, targetProfile, stopImpersonation } = useImpersonation();
  if (!active || !targetProfile) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5" />
          <span className="font-semibold">
            Impersonating user: {targetProfile.fullName} ({targetProfile.email})
          </span>
        </div>
        <button type="button" className="font-semibold underline" onClick={stopImpersonation}>
          End impersonation
        </button>
      </div>
    </div>
  );
};
