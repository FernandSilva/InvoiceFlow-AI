import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AdminRoute } from "../components/AdminRoute";
import { AppLayout } from "../components/AppLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../lib/constants";
import { AboutPage } from "../pages/AboutPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DocumentDetailPage } from "../pages/DocumentDetailPage";
import { DocumentsPage } from "../pages/DocumentsPage";
import { EInvoiceCreatorPage } from "../pages/EInvoiceCreatorPage";
import { InvoiceReaderPage } from "../pages/InvoiceReaderPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { ProfilePage } from "../pages/ProfilePage";
import { PublicLayout } from "../pages/PublicLayout";
import { RegisterPage } from "../pages/RegisterPage";
import { TermsPage } from "../pages/TermsPage";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminDocumentsPage } from "../pages/admin/AdminDocumentsPage";
import { AdminUserDetailPage } from "../pages/admin/AdminUserDetailPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";

const OnboardingGate = () => {
  const { profile } = useAuth();
  if (profile && !profile.onboardingCompleted) {
    return <Navigate to={ROUTES.onboarding} replace />;
  }
  return <Outlet />;
};

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.landing} element={<LandingPage />} />
        <Route path={ROUTES.about} element={<AboutPage />} />
        <Route path={ROUTES.privacy} element={<PrivacyPage />} />
        <Route path={ROUTES.terms} element={<TermsPage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.onboarding} element={<OnboardingPage />} />
        <Route element={<OnboardingGate />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="invoice-reader" element={<InvoiceReaderPage />} />
            <Route path="e-invoice-creator" element={<EInvoiceCreatorPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
              <Route path="/admin/documents" element={<AdminDocumentsPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
