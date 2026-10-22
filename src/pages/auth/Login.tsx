import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field, Spinner } from "@/components/kit";
import { homeFor } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { isEmail } from "@/lib/validation";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/mocks/seed";
import type { Role } from "@/types";
import { BRAND } from "@/lib/brand";

const Login = () => {
  usePageTitle("Entrar");
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState<false | "form" | Role>(false);

  if (isAuthenticated && role && !loading) return <Navigate to={homeFor(role)} replace />;

  const enter = async (mail: string, pwd: string, mode: "form" | Role) => {
    setLoading(mode);
    setErrors({});
    try {
      const { session } = await login(mail, pwd);
      const target = from && from.startsWith(session.role === "admin" ? "/empresa" : "/aluno") ? from : homeFor(session.role);
      navigate(target, { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Não foi possível entrar" });
      setLoading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      email: !email.trim() ? "Informe seu e-mail" : !isEmail(email) ? "E-mail inválido" : undefined,
      password: !password ? "Informe sua senha" : undefined,
    };
    setErrors(next);
    if (next.email || next.password) return;
    enter(email, password, "form");
  };

  return (
    <AuthLayout
      title={<>Educação que transforma equipes em resultados.</>}
      subtitle="Acesse o painel da sua empresa ou a sua área de estudos."
      bullets={["Cursos com a identidade da sua marca", "Avaliações e certificados automáticos", "Lembretes e conteúdos via WhatsApp"]}
    >
      <h1 className="font-sora text-[26px] font-bold text-foreground">Bem-vindo de volta</h1>
      <p className="mt-1.5 font-dm text-sm text-muted-foreground">Entre com o e-mail cadastrado pela sua empresa.</p>

      {/* Acesso rápido à demonstração */}
      <div className="mt-7 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4">
        <p className="eyebrow text-primary">Explore a demonstração</p>
        <p className="mt-1 font-dm text-[13px] text-muted-foreground">
          Entre com um clique na empresa fictícia <strong className="text-foreground">Vértice Logística</strong>.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["admin", Building2, "Empresa", "Painel do RH"],
              ["aluno", GraduationCap, "Colaborador", "Área de estudos"],
            ] as const
          ).map(([r, Icon, title, sub]) => (
            <button
              key={r}
              type="button"
              disabled={Boolean(loading)}
              onClick={() => enter(DEMO_ACCOUNTS[r].email, DEMO_PASSWORD, r)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition-all hover:border-primary hover:shadow-card disabled:opacity-60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {loading === r ? <Spinner /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block font-sora text-[13px] font-semibold text-foreground">{title}</span>
                <span className="block font-dm text-[11px] text-muted-foreground">{sub}</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-dm text-xs text-muted-foreground">ou entre com e-mail e senha</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="E-mail" error={errors.email} htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              className="field pl-10"
              value={email}
              aria-invalid={Boolean(errors.email)}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Senha" error={errors.password} htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              className="field px-10"
              value={password}
              aria-invalid={Boolean(errors.password)}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            >
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

        <button type="submit" className="btn-primary w-full py-3" disabled={Boolean(loading)}>
          {loading === "form" && <Spinner />}
          Entrar
        </button>
      </form>

      <div className="mt-8 space-y-2 text-center font-dm text-[13px] text-muted-foreground">
        <p>
          Sua empresa ainda não usa a {BRAND.name}?{" "}
          <Link to="/cadastro-empresa" className="font-semibold text-primary hover:underline">
            Cadastre sua empresa
          </Link>
        </p>
        <p className="text-xs">Colaboradores recebem o acesso pela empresa e não precisam criar conta.</p>
      </div>
    </AuthLayout>
  );
};

export default Login;
