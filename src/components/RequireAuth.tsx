import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export const homeFor = (role: Role) => (role === "admin" ? "/empresa/dashboard" : "/aluno/dashboard");

export const RequireAuth = ({ role, children }: { role: Role; children: ReactNode }) => {
  const { isAuthenticated, role: current } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !current) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (current !== role) return <Navigate to={homeFor(current)} replace />;
  return <>{children}</>;
};
