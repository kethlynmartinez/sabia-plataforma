import { startTransition, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, type AuthPayload } from "@/services/api";
import { AUTH_EXPIRED_EVENT, AuthContext, type AuthContextValue } from "./auth-context";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  // O back simulado é síncrono na leitura da sessão: não há "flash" de tela deslogada.
  const [state, setState] = useState<AuthPayload | null>(() => authApi.current());

  const refresh = useCallback(() => setState(authApi.current()), []);

  const login = useCallback<AuthContextValue["login"]>(async (email, password, slug) => {
    const payload = await authApi.login(email, password, slug);
    queryClient.clear();
    setState(payload);
    return payload;
  }, [queryClient]);

  const registerCompany = useCallback<AuthContextValue["registerCompany"]>(async (input) => {
    const payload = await authApi.registerCompany(input);
    queryClient.clear();
    setState(payload);
    return payload;
  }, [queryClient]);

  const logout = useCallback(() => {
    const target = state?.session.role === "aluno" ? `/e/${state.company.slug}` : "/login";
    authApi.logout();
    queryClient.clear();
    // O router navega dentro de uma transição (v7_startTransition). Se a sessão
    // fosse limpa fora dela, a rota protegida redirecionaria para /login antes
    // de chegar ao destino correto — por isso as duas atualizações vão juntas.
    startTransition(() => setState(null));
    return target;
  }, [state, queryClient]);

  useEffect(() => {
    const onExpired = () => {
      if (!authApi.current()) {
        setState(null);
        toast.error("Sua sessão expirou. Entre novamente.");
      }
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state?.user ?? null,
      company: state?.company ?? null,
      role: state?.session.role ?? null,
      isAuthenticated: Boolean(state),
      login,
      registerCompany,
      logout,
      refresh,
    }),
    [state, login, registerCompany, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
