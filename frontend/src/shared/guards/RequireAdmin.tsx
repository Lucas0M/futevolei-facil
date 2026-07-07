import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function RequireAdmin() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    // Not an admin - redirect to the regular tournament list instead of
    // showing an error page, since this isn't a page they were ever meant to reach.
    return <Navigate to="/torneios" replace />;
  }

  return <Outlet />;
}
