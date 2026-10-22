import { createContext } from "react";
import type { Company, PublicUser, Role } from "@/types";
import type { AuthPayload, authApi } from "@/services/api";

export interface AuthContextValue {
  user: PublicUser | null;
  company: Company | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, companySlug?: string) => Promise<AuthPayload>;
  registerCompany: (input: Parameters<typeof authApi.registerCompany>[0]) => Promise<AuthPayload>;
  /** Encerra a sessão e devolve a rota de login adequada ao perfil */
  logout: () => string;
  /** Relê usuário/empresa do back-end (após editar perfil, tema etc.) */
  refresh: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AUTH_EXPIRED_EVENT = "sabia:auth-expired";
