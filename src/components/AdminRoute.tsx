import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../lib/constants";
import { isAdmin } from "../lib/permissions";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

export const AdminRoute = () => {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (profile?.status !== "active") {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!isAdmin(profile)) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <ErrorState
          title="Admin access required"
          description="This area is reserved for platform administrators. Role checks are enforced in the UI and should also be revalidated in Appwrite permissions and functions."
        />
      </div>
    );
  }

  return <Outlet />;
};
