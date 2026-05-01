import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../lib/constants";
import { LoadingState } from "./LoadingState";

export const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />;
  }

  if (profile && profile.status !== "active") {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
};
