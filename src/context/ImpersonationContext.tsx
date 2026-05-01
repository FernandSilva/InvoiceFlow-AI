import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Profile } from "../types";

interface ImpersonationState {
  active: boolean;
  adminProfile: Profile | null;
  targetProfile: Profile | null;
}

interface ImpersonationContextValue extends ImpersonationState {
  startImpersonation: (adminProfile: Profile, targetProfile: Profile) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue | undefined>(undefined);

export const ImpersonationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ImpersonationState>({
    active: false,
    adminProfile: null,
    targetProfile: null,
  });

  const value = useMemo(
    () => ({
      ...state,
      startImpersonation: (adminProfile: Profile, targetProfile: Profile) =>
        setState({ active: true, adminProfile, targetProfile }),
      stopImpersonation: () =>
        setState({ active: false, adminProfile: null, targetProfile: null }),
    }),
    [state],
  );

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
};

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error("useImpersonation must be used within ImpersonationProvider");
  }
  return context;
};
