import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, companyApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Field, PageHeader, Spinner } from "@/components/kit";
import { DemoResetButton } from "@/components/DemoResetButton";
import { PasswordForm } from "@/components/PasswordForm";
import { formatDate } from "@/lib/format";
import { isPhone, maskPhone } from "@/lib/validation";

const SEGMENTS = ["Logística e transporte", "Varejo", "Indústria", "Saúde", "Tecnologia", "Serviços", "Educação", "Outro"];
const SIZES = ["Até 20", "21 a 50", "51 a 200", "201 a 500", "Mais de 500"];

const Configuracoes = () => {
  usePageTitle("Configurações");
  const { company, user, refresh } = useAuth();
  const [org, setOrg] = useState({ name: company!.name, segment: company!.segment, size: company!.size, whatsapp: company!.whatsapp });
  const [me, setMe] = useState({ name: user!.name, phone: user!.phone });

  const saveOrg = useMutation({
    mutationFn: () => companyApi.update(org),
    onSuccess: () => {
      refresh();
      toast.success("Dados da empresa atualizados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMe = useMutation({
    mutationFn: () => authApi.updateProfile(me),
    onSuccess: () => {
      refresh();
      toast.success("Seus dados foram atualizados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!company || !user) return null;

  const submitOrg = (e: FormEvent) => {
    e.preventDefault();
    if (!isPhone(org.whatsapp)) return toast.error("WhatsApp inválido");
    saveOrg.mutate();
  };

  return (
    <>
      <PageHeader title="Configurações" description={`Dados da empresa e da sua conta. Cliente desde ${formatDate(company.createdAt)}.`} />

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={submitOrg} className="card space-y-5 p-6">
          <h2 className="font-sora text-base font-semibold">Dados da empresa</h2>
          <Field label="Nome da empresa" htmlFor="org-name">
            <input id="org-name" className="field" value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Segmento" htmlFor="org-seg">
              <select id="org-seg" className="field" value={org.segment} onChange={(e) => setOrg({ ...org, segment: e.target.value })}>
                {[...new Set([org.segment, ...SEGMENTS])].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Colaboradores" htmlFor="org-size">
              <select id="org-size" className="field" value={org.size} onChange={(e) => setOrg({ ...org, size: e.target.value })}>
                {[...new Set([org.size, ...SIZES])].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="WhatsApp de envio" hint="Número que dispara convites e lembretes." htmlFor="org-wa">
            <input id="org-wa" className="field" value={org.whatsapp} onChange={(e) => setOrg({ ...org, whatsapp: maskPhone(e.target.value) })} />
          </Field>
          <button className="btn-primary" disabled={saveOrg.isPending}>
            {saveOrg.isPending && <Spinner />} Salvar empresa
          </button>
        </form>

        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMe.mutate();
            }}
            className="card space-y-5 p-6"
          >
            <h2 className="font-sora text-base font-semibold">Minha conta</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome" htmlFor="me-name">
                <input id="me-name" className="field" value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} />
              </Field>
              <Field label="WhatsApp" htmlFor="me-phone">
                <input id="me-phone" className="field" value={me.phone} onChange={(e) => setMe({ ...me, phone: maskPhone(e.target.value) })} />
              </Field>
            </div>
            <Field label="E-mail de acesso" hint="Para trocar o e-mail, fale com o suporte." htmlFor="me-email">
              <input id="me-email" className="field" value={user.email} disabled />
            </Field>
            <button className="btn-primary" disabled={saveMe.isPending}>
              {saveMe.isPending && <Spinner />} Salvar meus dados
            </button>
          </form>

          <PasswordForm />

          <section className="card border-dashed p-6">
            <h2 className="font-sora text-base font-semibold">Ambiente de demonstração</h2>
            <p className="mt-1.5 font-dm text-sm text-muted-foreground">
              Os dados ficam salvos apenas neste navegador. Restaure para voltar à empresa fictícia original.
            </p>
            <DemoResetButton className="btn-outline mt-4" />
          </section>
        </div>
      </div>
    </>
  );
};

export default Configuracoes;
