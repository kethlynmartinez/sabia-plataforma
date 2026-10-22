import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/services/api";
import { Field, Spinner } from "@/components/kit";
import { passwordIssue } from "@/lib/validation";

export const PasswordForm = () => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(form.current, form.next),
    onSuccess: () => {
      toast.success("Senha alterada com sucesso");
      setForm({ current: "", next: "", confirm: "" });
    },
    onError: (e: Error) => setErrors({ current: e.message }),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      current: !form.current ? "Informe a senha atual" : undefined,
      next: passwordIssue(form.next) || undefined,
      confirm: form.confirm !== form.next ? "As senhas não coincidem" : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-6">
      <div>
        <h2 className="font-sora text-base font-semibold">Segurança</h2>
        <p className="mt-1 font-dm text-sm text-muted-foreground">Use pelo menos 8 caracteres, combinando letras e números.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Senha atual" error={errors.current} htmlFor="pw-current">
          <input id="pw-current" type="password" autoComplete="current-password" className="field" value={form.current} aria-invalid={Boolean(errors.current)} onChange={(e) => setForm({ ...form, current: e.target.value })} />
        </Field>
        <Field label="Nova senha" error={errors.next} htmlFor="pw-next">
          <input id="pw-next" type="password" autoComplete="new-password" className="field" value={form.next} aria-invalid={Boolean(errors.next)} onChange={(e) => setForm({ ...form, next: e.target.value })} />
        </Field>
        <Field label="Confirmar" error={errors.confirm} htmlFor="pw-confirm">
          <input id="pw-confirm" type="password" autoComplete="new-password" className="field" value={form.confirm} aria-invalid={Boolean(errors.confirm)} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </Field>
      </div>
      <button className="btn-outline" disabled={mutation.isPending}>
        {mutation.isPending && <Spinner />} Alterar senha
      </button>
    </form>
  );
};
