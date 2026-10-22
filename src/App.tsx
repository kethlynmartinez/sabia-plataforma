import { Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthProvider";
import { AUTH_EXPIRED_EVENT } from "@/contexts/auth-context";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoader, Spinner } from "@/components/kit";
import { ApiError } from "@/services/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazyPage } from "@/lib/lazyPage";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";

// Telas internas carregadas sob demanda (code splitting por rota). lazyPage recarrega se a versão publicada mudou.
const CadastroEmpresa = lazyPage(() => import("./pages/auth/CadastroEmpresa"));
const RecuperarSenha = lazyPage(() => import("./pages/auth/RecuperarSenha"));
const PortalLogin = lazyPage(() => import("./pages/auth/PortalLogin"));

const EmpresaDashboard = lazyPage(() => import("./pages/empresa/Dashboard"));
const EmpresaColaboradores = lazyPage(() => import("./pages/empresa/Colaboradores"));
const EmpresaCursos = lazyPage(() => import("./pages/empresa/Cursos"));
const EmpresaCursoEditor = lazyPage(() => import("./pages/empresa/CursoEditor"));
const EmpresaAvaliacoes = lazyPage(() => import("./pages/empresa/Avaliacoes"));
const EmpresaRelatorios = lazyPage(() => import("./pages/empresa/Relatorios"));
const EmpresaPersonalizacao = lazyPage(() => import("./pages/empresa/Personalizacao"));
const EmpresaConfiguracoes = lazyPage(() => import("./pages/empresa/Configuracoes"));

const AlunoDashboard = lazyPage(() => import("./pages/aluno/Dashboard"));
const AlunoCursos = lazyPage(() => import("./pages/aluno/Cursos"));
const AlunoCursoPlayer = lazyPage(() => import("./pages/aluno/CursoPlayer"));
const AlunoCertificados = lazyPage(() => import("./pages/aluno/Certificados"));
const AlunoCertificado = lazyPage(() => import("./pages/aluno/Certificado"));
const AlunoPerfil = lazyPage(() => import("./pages/aluno/Perfil"));

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    },
  }),
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-primary">
    <Spinner className="h-6 w-6" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* HashRouter: funciona no GitHub Pages sem configuração de servidor */}
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <Toaster />
          <ErrorBoundary>
            <Suspense fallback={<FullScreenLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
                <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/e/:slug" element={<PortalLogin />} />

                <Route
                  path="/empresa"
                  element={
                    <RequireAuth role="admin">
                      <AppShell role="admin" />
                    </RequireAuth>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Lazy><EmpresaDashboard /></Lazy>} />
                  <Route path="colaboradores" element={<Lazy><EmpresaColaboradores /></Lazy>} />
                  <Route path="cursos" element={<Lazy><EmpresaCursos /></Lazy>} />
                  <Route path="cursos/:id" element={<Lazy><EmpresaCursoEditor /></Lazy>} />
                  <Route path="avaliacoes" element={<Lazy><EmpresaAvaliacoes /></Lazy>} />
                  <Route path="relatorios" element={<Lazy><EmpresaRelatorios /></Lazy>} />
                  <Route path="personalizacao" element={<Lazy><EmpresaPersonalizacao /></Lazy>} />
                  <Route path="configuracoes" element={<Lazy><EmpresaConfiguracoes /></Lazy>} />
                </Route>

                <Route
                  path="/aluno"
                  element={
                    <RequireAuth role="aluno">
                      <AppShell role="aluno" />
                    </RequireAuth>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Lazy><AlunoDashboard /></Lazy>} />
                  <Route path="cursos" element={<Lazy><AlunoCursos /></Lazy>} />
                  <Route path="cursos/:id" element={<Lazy><AlunoCursoPlayer /></Lazy>} />
                  <Route path="certificados" element={<Lazy><AlunoCertificados /></Lazy>} />
                  <Route path="certificados/:id" element={<Lazy><AlunoCertificado /></Lazy>} />
                  <Route path="perfil" element={<Lazy><AlunoPerfil /></Lazy>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </HashRouter>
  </QueryClientProvider>
);

/** Suspense interno: a navegação entre páginas do painel mantém a sidebar visível */
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ErrorBoundary>
);

export default App;
