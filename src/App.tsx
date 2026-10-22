import { lazy, Suspense } from "react";
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

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";

// Telas internas carregadas sob demanda (code splitting por rota)
const CadastroEmpresa = lazy(() => import("./pages/auth/CadastroEmpresa"));
const RecuperarSenha = lazy(() => import("./pages/auth/RecuperarSenha"));
const PortalLogin = lazy(() => import("./pages/auth/PortalLogin"));

const EmpresaDashboard = lazy(() => import("./pages/empresa/Dashboard"));
const EmpresaColaboradores = lazy(() => import("./pages/empresa/Colaboradores"));
const EmpresaCursos = lazy(() => import("./pages/empresa/Cursos"));
const EmpresaCursoEditor = lazy(() => import("./pages/empresa/CursoEditor"));
const EmpresaAvaliacoes = lazy(() => import("./pages/empresa/Avaliacoes"));
const EmpresaRelatorios = lazy(() => import("./pages/empresa/Relatorios"));
const EmpresaPersonalizacao = lazy(() => import("./pages/empresa/Personalizacao"));
const EmpresaConfiguracoes = lazy(() => import("./pages/empresa/Configuracoes"));

const AlunoDashboard = lazy(() => import("./pages/aluno/Dashboard"));
const AlunoCursos = lazy(() => import("./pages/aluno/Cursos"));
const AlunoCursoPlayer = lazy(() => import("./pages/aluno/CursoPlayer"));
const AlunoCertificados = lazy(() => import("./pages/aluno/Certificados"));
const AlunoCertificado = lazy(() => import("./pages/aluno/Certificado"));
const AlunoPerfil = lazy(() => import("./pages/aluno/Perfil"));

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
        </TooltipProvider>
      </AuthProvider>
    </HashRouter>
  </QueryClientProvider>
);

/** Suspense interno: a navegação entre páginas do painel mantém a sidebar visível */
const Lazy = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

export default App;
