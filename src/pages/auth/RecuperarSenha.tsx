import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field, Spinner } from "@/components/kit";
import { authApi } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { isEmail } from "@/lib/validation";

const RecuperarSenha = () => {
  usePageTitle("Recuperar senha");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Informe um e-mail válido");
      return;
    }
    setError("");
    setLoading(true);
    await authApi.requestPasswordReset(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <AuthLayout title="Acontece com todo mundo." subtitle="Enviaremos um link seguro para você criar uma nova senha.">
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 font-dm text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar para o login
      </Link>

      {sent ? (
        <div className="card p-7 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-5 font-sora text-xl font-bold">Confira seu e-mail</h1>
          <p className="mt-2 font-dm text-sm text-muted-foreground">
            Se <strong className="text-foreground">{email}</strong> estiver cadastrado, você receberá as instruções em instantes. Também
            enviamos um aviso no WhatsApp cadastrado.
          </p>
          <p className="mt-5 rounded-xl bg-muted px-4 py-3 font-dm text-xs text-muted-foreground">
            Demonstração: nenhum e-mail é enviado de verdade. Use a senha <strong>demo1234</strong> nas contas de exemplo.
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-sora text-[26px] font-bold">Recuperar senha</h1>
          <p className="mt-1.5 font-dm text-sm text-muted-foreground">Digite o e-mail usado para acessar a plataforma.</p>
          <form onSubmit={submit} noValidate className="mt-7 space-y-4">
            <Field label="E-mail" error={error} htmlFor="email">
              <input id="email" type="email" className="field" placeholder="voce@empresa.com" value={email} aria-invalid={Boolean(error)} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <button className="btn-primary w-full py-3" disabled={loading}>
              {loading && <Spinner />}
              Enviar link de recuperação
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
};

export default RecuperarSenha;
