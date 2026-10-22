import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Check, Eye, EyeOff, Wand2 } from "lucide-react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/mocks/seed";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field, Spinner } from "@/components/kit";
import { homeFor } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { hasErrors, isEmail, isPhone, maskPhone, passwordIssue } from "@/lib/validation";
import { cn } from "@/lib/utils";

const SEGMENTS = ["Logística e transporte", "Varejo", "Indústria", "Saúde", "Tecnologia", "Serviços", "Educação", "Outro"];
const SIZES = ["Até 20", "21 a 50", "51 a 200", "201 a 500", "Mais de 500"];

type Step1 = "companyName" | "segment" | "size" | "whatsapp";
type Step2 = "adminName" | "email" | "password" | "confirm" | "terms";

const CadastroEmpresa = () => {
  usePageTitle("Cadastrar empresa");
  const { registerCompany, login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    segment: "",
    size: "",
    whatsapp: "",
    adminName: "",
    email: "",
    password: "",
    confirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Partial<Record<Step1 | Step2, string>>>({});

  if (isAuthenticated && role && !loading) return <Navigate to={homeFor(role)} replace />;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate1 = () => ({
    companyName: form.companyName.trim().length < 2 ? "Informe o nome da empresa" : undefined,
    segment: !form.segment ? "Selecione o segmento" : undefined,
    size: !form.size ? "Selecione o porte" : undefined,
    whatsapp: !isPhone(form.whatsapp) ? "WhatsApp inválido" : undefined,
  });

  const validate2 = () => ({
    adminName: form.adminName.trim().split(/\s+/).length < 2 ? "Informe nome e sobrenome" : undefined,
    email: !isEmail(form.email) ? "E-mail inválido" : undefined,
    password: passwordIssue(form.password) || undefined,
    confirm: form.confirm !== form.password ? "As senhas não coincidem" : undefined,
    terms: !form.terms ? "Aceite os termos para continuar" : undefined,
  });

  const next = (e: FormEvent) => {
    e.preventDefault();
    const e1 = validate1();
    setErrors(e1);
    if (!hasErrors(e1)) setStep(2);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const e2 = validate2();
    setErrors(e2);
    if (hasErrors(e2)) return;
    setLoading(true);
    setFormError("");
    try {
      await registerCompany({
        companyName: form.companyName,
        segment: form.segment,
        size: form.size,
        whatsapp: form.whatsapp,
        adminName: form.adminName,
        email: form.email,
        password: form.password,
      });
      toast.success("Empresa cadastrada! Agora é só configurar os treinamentos.");
      navigate("/empresa/dashboard", { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível concluir o cadastro");
      setLoading(false);
    }
  };

  /** Demo: preenche as duas etapas com uma empresa fictícia nova (e-mail único a cada clique). */
  const fillDemo = () => {
    const tag = Math.random().toString(36).slice(2, 6);
    setForm({
      companyName: "Transportes Horizonte",
      segment: "Logística e transporte",
      size: "51 a 200",
      whatsapp: "(11) 90000-2020",
      adminName: "Paula Mendes",
      email: `rh.${tag}@horizonte.demo`,
      password: "demo1234",
      confirm: "demo1234",
      terms: true,
    });
    setErrors({});
    setFormError("");
    setStep(2);
  };

  const enterDemoCompany = async () => {
    setLoading(true);
    try {
      await login(DEMO_ACCOUNTS.admin.email, DEMO_PASSWORD);
      navigate("/empresa/dashboard", { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível entrar");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sua equipe estudando em poucos minutos."
      subtitle="Cadastre a empresa, aplique a sua marca e convide a equipe. Você mesmo cadastra os colaboradores, sem formulário público."
      bullets={["Teste com dados fictícios, sem cartão", "Identidade visual da sua empresa", "Convites e lembretes via WhatsApp"]}
    >
      <div className="mb-8 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4">
        <p className="eyebrow text-primary">Modo demonstração</p>
        <p className="mt-1 font-dm text-[13px] text-muted-foreground text-pretty">Teste o cadastro com dados prontos ou entre na empresa fictícia já configurada.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={fillDemo}
            disabled={loading}
            className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition-all hover:border-primary hover:shadow-card disabled:opacity-60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Wand2 className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-sora text-[13px] font-semibold text-foreground">Preencher</span>
              <span className="block font-dm text-[11px] text-muted-foreground">Nova empresa fictícia</span>
            </span>
          </button>
          <button
            type="button"
            onClick={enterDemoCompany}
            disabled={loading}
            className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition-all hover:border-primary hover:shadow-card disabled:opacity-60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-sora text-[13px] font-semibold text-foreground">Empresa pronta</span>
              <span className="block font-dm text-[11px] text-muted-foreground">Vértice Logística</span>
            </span>
          </button>
        </div>
      </div>

      <ol className="mb-8 flex items-center gap-3" aria-label="Etapas do cadastro">
        {["Empresa", "Responsável"].map((label, i) => {
          const n = (i + 1) as 1 | 2;
          const done = step > n;
          const active = step === n;
          return (
            <li key={label} className="flex flex-1 items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sora text-xs font-bold transition-colors",
                  done ? "bg-success text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </span>
              <span className={cn("font-sora text-[13px] font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              {i === 0 && <span className="h-px flex-1 bg-border" />}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <form onSubmit={next} noValidate className="space-y-4">
          <div>
            <h1 className="font-sora text-[26px] font-bold">Cadastre sua empresa</h1>
            <p className="mt-1.5 font-dm text-sm text-muted-foreground">Comece pelos dados básicos. Você poderá alterar tudo depois.</p>
          </div>
          <Field label="Nome da empresa" error={errors.companyName} htmlFor="companyName">
            <input id="companyName" className="field" placeholder="Ex.: Transportes Horizonte" value={form.companyName} aria-invalid={Boolean(errors.companyName)} onChange={(e) => set("companyName", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Segmento" error={errors.segment} htmlFor="segment">
              <select id="segment" className="field" value={form.segment} aria-invalid={Boolean(errors.segment)} onChange={(e) => set("segment", e.target.value)}>
                <option value="">Selecione</option>
                {SEGMENTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Colaboradores" error={errors.size} htmlFor="size">
              <select id="size" className="field" value={form.size} aria-invalid={Boolean(errors.size)} onChange={(e) => set("size", e.target.value)}>
                <option value="">Selecione</option>
                {SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="WhatsApp da empresa" error={errors.whatsapp} hint="Número que enviará os lembretes aos colaboradores." htmlFor="whatsapp">
            <input id="whatsapp" inputMode="tel" className="field" placeholder="(00) 00000-0000" value={form.whatsapp} aria-invalid={Boolean(errors.whatsapp)} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} />
          </Field>
          <button type="submit" className="btn-primary w-full py-3">
            Continuar
          </button>
        </form>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <button type="button" onClick={() => setStep(1)} className="mb-3 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> {form.companyName}
            </button>
            <h1 className="font-sora text-[26px] font-bold">Quem vai administrar?</h1>
            <p className="mt-1.5 font-dm text-sm text-muted-foreground">Essa pessoa gerencia cursos, colaboradores e a identidade visual.</p>
          </div>
          <Field label="Nome completo" error={errors.adminName} htmlFor="adminName">
            <input id="adminName" autoComplete="name" className="field" placeholder="Seu nome e sobrenome" value={form.adminName} aria-invalid={Boolean(errors.adminName)} onChange={(e) => set("adminName", e.target.value)} />
          </Field>
          <Field label="E-mail corporativo" error={errors.email} htmlFor="email">
            <input id="email" type="email" autoComplete="email" className="field" placeholder="voce@empresa.com" value={form.email} aria-invalid={Boolean(errors.email)} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Senha" error={errors.password} htmlFor="password">
              <div className="relative">
                <input id="password" type={showPwd ? "text" : "password"} autoComplete="new-password" className="field pr-10" placeholder="Mín. 8, letras e números" value={form.password} aria-invalid={Boolean(errors.password)} onChange={(e) => set("password", e.target.value)} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmar senha" error={errors.confirm} htmlFor="confirm">
              <input id="confirm" type={showPwd ? "text" : "password"} autoComplete="new-password" className="field" placeholder="Repita a senha" value={form.confirm} aria-invalid={Boolean(errors.confirm)} onChange={(e) => set("confirm", e.target.value)} />
            </Field>
          </div>
          <div>
            <label className="flex cursor-pointer items-start gap-2.5 font-dm text-[13px] text-muted-foreground">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} />
              <span>
                Li e aceito os termos de uso e a política de privacidade. <span className="text-xs">(demonstração)</span>
              </span>
            </label>
            {errors.terms && <p className="field-error">{errors.terms}</p>}
          </div>

          {formError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 font-dm text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading && <Spinner />}
            Criar conta da empresa
          </button>
        </form>
      )}

      <p className="mt-8 text-center font-dm text-[13px] text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
};

export default CadastroEmpresa;
