import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function RequireAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Avoids a flash-redirect to /login while we're still reading
    // the persisted session from localStorage.
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
