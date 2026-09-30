import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ReceiptProvider } from "@/context/ReceiptContext";
import { HomePage } from "@/pages/HomePage";
import { CreatePage } from "@/pages/CreatePage";
import { TrackPage } from "@/pages/TrackPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { DashboardPage } from "@/pages/DashboardPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
      <Route path="/track" element={<TrackPage />} />
      <Route
        path="/signin"
        element={<PublicOnlyRoute><SignInPage /></PublicOnlyRoute>}
      />
      <Route
        path="/signup"
        element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ReceiptProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ReceiptProvider>
    </AuthProvider>
  );
}

export default App;
