import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function RequireSuperAdmin() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "SUPERADMIN") {
    return <Navigate to="/torneios" replace />;
  }

  return <Outlet />;
}
