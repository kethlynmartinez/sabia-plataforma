import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Avatar, Field, PageHeader, Spinner } from "@/components/kit";
import { PasswordForm } from "@/components/PasswordForm";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { isPhone, maskPhone } from "@/lib/validation";

const Perfil = () => {
  usePageTitle("Meu perfil");
  const { user, company, refresh } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: user!.name, phone: user!.phone, bio: user!.bio ?? "", whatsappOptIn: user!.whatsappOptIn });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const save = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Perfil atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user || !company) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      name: form.name.trim().length < 3 ? "Informe seu nome completo" : undefined,
      phone: !isPhone(form.phone) ? "Telefone inválido" : undefined,
    };
    setErrors(next);
    if (next.name || next.phone) return;
    save.mutate();
  };

  return (
    <>
      <PageHeader title="Meu perfil" description={`Colaborador(a) da ${company.name} desde ${formatDate(user.createdAt)}.`} />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="card h-fit p-6 text-center">
          <Avatar name={form.name || user.name} size="lg" className="mx-auto" />
          <p className="mt-4 font-sora text-lg font-bold">{form.name || user.name}</p>
          <p className="font-dm text-sm text-muted-foreground">{user.position}</p>
          <dl className="mt-5 space-y-2 border-t border-border pt-5 text-left font-dm text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Área</dt>
              <dd className="font-semibold">{user.department}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="truncate font-semibold">{user.email}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-xl bg-muted px-3 py-2.5 font-dm text-xs text-muted-foreground">Área, cargo e e-mail são definidos pelo RH.</p>
        </aside>

        <div className="space-y-6">
          <form onSubmit={submit} noValidate className="card space-y-5 p-6">
            <h2 className="font-sora text-base font-semibold">Dados pessoais</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome completo" error={errors.name} htmlFor="p-name">
                <input id="p-name" className="field" value={form.name} aria-invalid={Boolean(errors.name)} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="WhatsApp" error={errors.phone} htmlFor="p-phone">
                <input id="p-phone" inputMode="tel" className="field" value={form.phone} aria-invalid={Boolean(errors.phone)} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} />
              </Field>
            </div>
            <Field label="Sobre mim" hint={`${form.bio.length}/300`} htmlFor="p-bio">
              <textarea id="p-bio" rows={3} maxLength={300} className="field resize-none" placeholder="Seus objetivos de aprendizado, áreas de interesse…" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </Field>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
              <span className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-whatsapp" />
                <span>
                  <span className="block font-dm text-sm font-semibold">Receber aulas e lembretes no WhatsApp</span>
                  <span className="block font-dm text-xs text-muted-foreground">Avisos de novas aulas, prazos e certificados.</span>
                </span>
              </span>
              <Switch checked={form.whatsappOptIn} onCheckedChange={(v) => setForm({ ...form, whatsappOptIn: v })} aria-label="Receber mensagens no WhatsApp" />
            </label>
            <button className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Spinner />} Salvar alterações
            </button>
          </form>
          <PasswordForm />
        </div>
      </div>
    </>
  );
};

export default Perfil;
