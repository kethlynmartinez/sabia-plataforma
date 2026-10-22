import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Mail, MessageCircle, Wand2 } from "lucide-react";
import { companyApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTheme } from "@/hooks/useDocumentTheme";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { BrandMark } from "@/components/brand/BrandLogo";
import { Field, Spinner } from "@/components/kit";
import { homeFor } from "@/components/RequireAuth";
import { isEmail } from "@/lib/validation";
import { firstName } from "@/lib/format";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/mocks/seed";
import { BRAND } from "@/lib/brand";

/**
 * Portal white-label: o link que a empresa envia aos colaboradores (#/e/:slug).
 * Cores, logo, imagem e textos vêm da personalização feita pela empresa.
 */
const PortalLogin = () => {
  const { slug = "" } = useParams();
  const { login, logout, isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const { data: portal, isLoading, isError } = useQuery({
    queryKey: ["portal", slug],
    queryFn: () => companyApi.getPublic(slug),
  });
  usePageTitle(portal ? "Entrar" : "Portal", portal?.theme.displayName);
  useDocumentTheme(portal?.theme.primary, portal?.theme.highlight);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  // Já logado: mostra o portal com a marca e oferece continuar, em vez de redirecionar sem explicação
  const signedIn = isAuthenticated && Boolean(role) && Boolean(user) && !loading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError || !portal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="font-sora text-2xl font-bold">Portal não encontrado</h1>
        <p className="max-w-sm font-dm text-sm text-muted-foreground">Confira o link enviado pela sua empresa. O endereço “{slug}” não existe.</p>
        <Link to="/" className="btn-primary">
          Conhecer a plataforma
        </Link>
      </div>
    );
  }

  const { theme } = portal;
  const isDemo = slug === "vertice";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      email: !isEmail(email) ? "Informe um e-mail válido" : undefined,
      password: !password ? "Informe sua senha" : undefined,
    };
    setErrors(next);
    if (next.email || next.password) return;
    setLoading(true);
    try {
      const { session } = await login(email, password, slug);
      navigate(homeFor(session.role), { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Não foi possível entrar" });
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-primary-strong">
      {theme.loginImage && (
        <img src={theme.loginImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-strong/70 via-primary-strong/80 to-primary-strong/95 lg:to-primary-strong/90" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 py-6 lg:flex-row lg:items-center lg:gap-16 lg:px-12">
        <section className="flex flex-col justify-between py-6 text-white lg:flex-1 lg:self-stretch lg:py-10">
          <CompanyLogo theme={theme} variant="light" />
          <div className="mt-10 hidden lg:block">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-dm text-xs font-semibold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-highlight" /> {theme.displayName}
            </span>
            <h1 className="mt-5 max-w-xl font-sora text-[44px] font-bold leading-[1.1] text-balance">{theme.loginTitle}</h1>
            <p className="mt-4 max-w-lg font-dm text-lg text-white/75">{theme.loginSubtitle}</p>
            <p className="mt-8 inline-flex items-center gap-2 font-dm text-sm text-white/70">
              <MessageCircle className="h-4 w-4 text-whatsapp" /> Você também recebe aulas e lembretes pelo WhatsApp.
            </p>
          </div>
          <Link to="/" className="mt-10 hidden w-fit items-center gap-2 font-dm text-xs text-white/50 transition-colors hover:text-white lg:flex">
            <BrandMark className="h-4 w-4" /> Tecnologia {BRAND.name}
          </Link>
        </section>

        <section className="w-full lg:max-w-[440px]">
          <div className="rounded-3xl bg-white p-7 shadow-card-lg sm:p-9">
            {signedIn ? (
              <div className="text-center">
                <h2 className="font-sora text-2xl font-bold text-foreground">Você já está conectado</h2>
                <p className="mt-2 font-dm text-sm text-muted-foreground text-pretty">
                  Esta é a tela que os colaboradores veem ao acessar o link da empresa.
                </p>
                <button className="btn-primary mt-7 w-full py-3" onClick={() => navigate(homeFor(role!))}>
                  Continuar como {firstName(user!.name)}
                </button>
                <button
                  className="btn-ghost mt-2 w-full"
                  onClick={() => {
                    logout();
                    navigate(`/e/${slug}`, { replace: true });
                  }}
                >
                  Entrar com outra conta
                </button>
              </div>
            ) : (
            <>
            <h2 className="font-sora text-2xl font-bold text-foreground">Entrar</h2>
            <p className="mt-1.5 font-dm text-sm text-muted-foreground">Use o e-mail e a senha enviados pelo RH.</p>

            <form onSubmit={submit} noValidate className="mt-7 space-y-4">
              <Field label="E-mail" error={errors.email} htmlFor="portal-email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
                  <input id="portal-email" type="email" autoComplete="email" className="field pl-10" placeholder="voce@empresa.com" value={email} aria-invalid={Boolean(errors.email)} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </Field>
              <Field label="Senha" error={errors.password} htmlFor="portal-password">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
                  <input id="portal-password" type={showPwd ? "text" : "password"} autoComplete="current-password" className="field px-10" placeholder="Sua senha" value={password} aria-invalid={Boolean(errors.password)} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <div className="flex justify-end">
                <Link to="/recuperar-senha" className="font-dm text-[13px] font-semibold text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              {errors.form && (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 font-dm text-sm text-destructive" role="alert">
                  {errors.form}
                </p>
              )}
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading && <Spinner />}
                Acessar meus cursos
              </button>
            </form>

            {isDemo && (
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_ACCOUNTS.aluno.email);
                  setPassword(DEMO_PASSWORD);
                  setErrors({});
                }}
                className="mt-5 flex w-full items-center gap-3 rounded-xl border border-dashed border-highlight/60 bg-highlight-soft px-4 py-3 text-left font-dm text-xs text-foreground/80 transition-colors hover:border-highlight"
              >
                <Wand2 className="h-4 w-4 shrink-0 text-highlight" />
                <span>
                  <strong className="block text-[13px] text-foreground">Demonstração</strong>
                  Preencher com o colaborador fictício Lucas Martins
                </span>
              </button>
            )}
            </>
            )}
          </div>
          <p className="mt-5 text-center font-dm text-xs text-white/60 lg:hidden">Tecnologia {BRAND.name}</p>
        </section>
      </div>
    </div>
  );
};

export default PortalLogin;
