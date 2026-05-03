import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../lib/auth";
import { ROUTES } from "../lib/constants";
import { appLogger } from "../lib/logger";
import type { AuthUser, Profile } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appLogger.info("AuthContext", "Initializing auth session.");
    authApi
      .getCurrentSession()
      .then((session) => {
        if (session) {
          appLogger.info("AuthContext", "Recovered active session.", {
            userId: session.user.id,
            email: session.user.email,
          });
          setUser(session.user);
          setProfile(session.profile);
        }
      })
      .finally(() => {
        appLogger.info("AuthContext", "Auth initialization complete.");
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    appLogger.info("AuthContext", "Login requested.", { email });
    setLoading(true);
    try {
      const session = await authApi.login(email, password);
      setUser(session.user);
      setProfile(session.profile);
      appLogger.info("AuthContext", "Login stored in context.", {
        userId: session.user.id,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: { email: string; password: string; fullName: string; companyName: string }) => {
      appLogger.info("AuthContext", "Registration requested.", {
        email: payload.email,
        companyName: payload.companyName,
      });
      setLoading(true);
      try {
        setUser(null);
        setProfile(null);
        const session = await authApi.register(payload);
        setUser(session.user);
        setProfile(session.profile);
        appLogger.info("AuthContext", "Registration stored in context.", {
          userId: session.user.id,
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    appLogger.info("AuthContext", "Logout requested.");
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setProfile(null);
      appLogger.info("AuthContext", "Context cleared after logout.");
      window.location.assign(ROUTES.login);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      login,
      register,
      logout,
      setProfile,
    }),
    [loading, login, logout, profile, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
