import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Award, BookOpen, Check, Copy, Home, MonitorSmartphone, RotateCcw, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { companyApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Field, PageHeader, Spinner } from "@/components/kit";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { ImagePicker } from "@/components/ImagePicker";
import { LOGIN_PRESETS } from "@/mocks/images";
import { contrastRatio, isHex, normalizeHex, themeStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { CompanyTheme } from "@/types";
import { BRAND } from "@/lib/brand";

const PALETTES = [
  { name: "Padrão", primary: BRAND.theme.primary, highlight: BRAND.theme.highlight },
  { name: "Petróleo", primary: "#0F766E", highlight: "#F59E0B" },
  { name: "Aurora", primary: "#BE185D", highlight: "#0EA5E9" },
  { name: "Oceano", primary: "#1D4ED8", highlight: "#22C55E" },
  { name: "Terracota", primary: "#C2410C", highlight: "#0D9488" },
  { name: "Grafite", primary: "#1F2937", highlight: "#EAB308" },
];

const ColorField = ({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) => {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-input bg-white p-1.5 focus-within:border-primary">
        <label className="relative h-9 w-11 shrink-0 cursor-pointer overflow-hidden rounded-md border border-black/10" style={{ background: value }}>
          <input type="color" value={value} onChange={(e) => onChange(normalizeHex(e.target.value))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={`${label} (seletor)`} />
        </label>
        <input
          className="min-w-0 flex-1 bg-transparent px-1 font-mono text-sm uppercase focus:outline-none"
          value={text}
          maxLength={7}
          onChange={(e) => {
            setText(e.target.value);
            if (isHex(e.target.value)) onChange(normalizeHex(e.target.value));
          }}
          onBlur={() => setText(value)}
          aria-label={`${label} em hexadecimal`}
        />
      </div>
    </Field>
  );
};

/* ------------------------------- Pré-visualizações ------------------------------- */

const LoginPreview = ({ theme }: { theme: CompanyTheme }) => (
  <div className="relative flex aspect-[16/10] overflow-hidden rounded-2xl bg-primary-strong">
    {theme.loginImage && <img src={theme.loginImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
    <div className="absolute inset-0 bg-gradient-to-r from-primary-strong/70 to-primary-strong/95" />
    <div className="relative z-10 flex w-full items-center gap-4 p-4 sm:p-6">
      <div className="flex-1 text-white">
        <div className="origin-left scale-[0.8]">
          <CompanyLogo theme={theme} variant="light" />
        </div>
        <p className="mt-4 line-clamp-2 font-sora text-sm font-bold leading-tight sm:text-lg">{theme.loginTitle || "Título da tela de login"}</p>
        <p className="mt-1.5 line-clamp-2 font-dm text-[10px] text-white/75 sm:text-xs">{theme.loginSubtitle}</p>
      </div>
      <div className="w-[40%] min-w-[118px] shrink-0 rounded-xl bg-white p-3 shadow-card-lg sm:p-4">
        <p className="font-sora text-[11px] font-bold sm:text-sm">Entrar</p>
        <div className="mt-2 flex h-5 items-center rounded-md border border-input px-1.5 font-dm text-[8px] text-placeholder sm:h-7 sm:text-[10px]">E-mail</div>
        <div className="mt-1.5 flex h-5 items-center rounded-md border border-input px-1.5 font-dm text-[8px] text-placeholder sm:h-7 sm:text-[10px]">Senha</div>
        <div className="mt-2.5 flex h-5 items-center justify-center whitespace-nowrap rounded-md bg-primary font-dm text-[9px] font-semibold text-primary-foreground sm:h-7 sm:text-[11px]">Acessar</div>
      </div>
    </div>
  </div>
);

const AppPreview = ({ theme }: { theme: CompanyTheme }) => (
  <div className="flex aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-background">
    <aside className="w-[34%] border-r border-border bg-white p-3">
      <div className="origin-left scale-[0.75]">
        <CompanyLogo theme={theme} />
      </div>
      <div className="mt-3 space-y-1">
        {[
          [Home, "Início"],
          [BookOpen, "Meus cursos"],
          [Award, "Certificados"],
          [UserRound, "Perfil"],
        ].map(([Icon, label], i) => {
          const I = Icon as typeof Home;
          return (
            <div key={label as string} className={cn("flex items-center gap-1.5 rounded-md px-2 py-1.5 font-dm text-[10px] font-medium", i === 0 ? "bg-primary text-primary-foreground" : "text-foreground/60")}>
              <I className="h-3 w-3" /> {label as string}
            </div>
          );
        })}
      </div>
    </aside>
    <div className="flex-1 p-3">
      <p className="font-sora text-[12px] font-bold">Boa tarde, Lucas</p>
      <div className="mt-2 rounded-lg border border-border bg-white p-2.5">
        <span className="chip bg-primary-soft px-1.5 py-0.5 text-[9px] text-primary">Segurança</span>
        <p className="mt-1.5 font-sora text-[10px] font-semibold">Operação de Empilhadeiras</p>
        <div className="mt-1.5 h-1 rounded-full bg-muted">
          <div className="h-full w-2/3 rounded-full bg-primary" />
        </div>
        <span className="mt-2 inline-block rounded bg-primary px-2 py-0.5 font-dm text-[9px] font-semibold text-primary-foreground">Continuar</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {["Certificados", "Avaliações"].map((t) => (
          <div key={t} className="rounded-lg border border-border bg-white p-2">
            <p className="font-dm text-[9px] text-muted-foreground">{t}</p>
            <p className="font-sora text-sm font-bold">2</p>
            <span className="block h-0.5 w-6 rounded-full bg-highlight" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ------------------------------------- Página ------------------------------------- */

const Personalizacao = () => {
  usePageTitle("Personalização");
  const { company, refresh } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CompanyTheme>(() => company!.theme);
  const [preview, setPreview] = useState<"login" | "app">("login");
  const [copied, setCopied] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(company?.theme), [draft, company]);
  const set = (patch: Partial<CompanyTheme>) => setDraft((d) => ({ ...d, ...patch }));
  const lowContrast = contrastRatio(draft.primary, "#FFFFFF") < 3;

  const save = useMutation({
    mutationFn: () => companyApi.updateTheme(draft),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ["portal"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Identidade visual aplicada para toda a equipe");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!company) return null;
  const portalUrl = `${window.location.origin}${window.location.pathname}#/e/${company.slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  return (
    <>
      <PageHeader
        title="Personalização"
        description="Deixe a plataforma com a cara da sua empresa. As mudanças valem para o painel, o portal de login e os certificados."
        actions={
          <>
            <button className="btn-ghost" onClick={() => set({ primary: BRAND.theme.primary, highlight: BRAND.theme.highlight })}>
              <RotateCcw /> Cores padrão
            </button>
            <button className="btn-primary" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
              {save.isPending ? <Spinner /> : <Save />} Aplicar identidade
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-6">
            <h2 className="font-sora text-base font-semibold">Marca</h2>
            <div className="mt-5 grid gap-5 2xl:grid-cols-2">
              <Field label="Nome da plataforma" hint="Aparece no portal, no painel e nos certificados." htmlFor="displayName">
                <input id="displayName" className="field" maxLength={40} value={draft.displayName} onChange={(e) => set({ displayName: e.target.value })} />
              </Field>
              <div>
                <span className="field-label">Logo</span>
                <ImagePicker value={draft.logoUrl} onChange={(v) => set({ logoUrl: v })} allowRemove maxSide={600} aspect="aspect-[3/1]" accept="image/png,image/svg+xml,image/webp,image/jpeg" />
                <p className="mt-1.5 font-dm text-xs text-muted-foreground">PNG ou SVG com fundo transparente. Sem logo, usamos as iniciais na cor primária.</p>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-sora text-base font-semibold">Cores</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {PALETTES.map((p) => {
                const active = p.primary === draft.primary && p.highlight === draft.highlight;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => set({ primary: p.primary, highlight: p.highlight })}
                    className={cn("flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 font-dm text-xs font-semibold transition-colors", active ? "border-foreground" : "border-border hover:border-foreground/40")}
                    aria-pressed={active}
                  >
                    <span className="flex -space-x-1.5">
                      <span className="h-5 w-5 rounded-full ring-2 ring-white" style={{ background: p.primary }} />
                      <span className="h-5 w-5 rounded-full ring-2 ring-white" style={{ background: p.highlight }} />
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <ColorField label="Cor primária" value={draft.primary} onChange={(v) => set({ primary: v })} hint="Botões, menu ativo e destaques." />
              <ColorField label="Cor de destaque" value={draft.highlight} onChange={(v) => set({ highlight: v })} hint="Selos, estrelas e detalhes." />
            </div>
            {lowContrast && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-soft px-4 py-3 font-dm text-xs text-foreground/80">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                A cor primária está clara demais para textos sobre fundo branco (contraste {contrastRatio(draft.primary, "#FFFFFF").toFixed(1)}:1). Prefira um tom mais escuro para manter a leitura acessível.
              </p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="font-sora text-base font-semibold">Tela de login dos colaboradores</h2>
            <div className="mt-5 grid gap-5">
              <Field label="Título" htmlFor="loginTitle">
                <input id="loginTitle" className="field" maxLength={60} value={draft.loginTitle} onChange={(e) => set({ loginTitle: e.target.value })} />
              </Field>
              <Field label="Subtítulo" htmlFor="loginSubtitle">
                <textarea id="loginSubtitle" rows={2} maxLength={140} className="field resize-none" value={draft.loginSubtitle} onChange={(e) => set({ loginSubtitle: e.target.value })} />
              </Field>
              <div>
                <span className="field-label">Imagem de fundo</span>
                <ImagePicker value={draft.loginImage} onChange={(v) => set({ loginImage: v })} presets={LOGIN_PRESETS} allowRemove />
              </div>
            </div>
          </section>
        </div>

        {/* Pré-visualização fixa */}
        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-sora text-sm font-semibold">
                <MonitorSmartphone className="h-4 w-4 text-primary" /> Pré-visualização
              </h2>
              <div className="flex rounded-lg bg-muted p-0.5">
                {(["login", "app"] as const).map((k) => (
                  <button key={k} onClick={() => setPreview(k)} className={cn("rounded-md px-3 py-1 font-dm text-xs font-semibold transition-colors", preview === k ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}>
                    {k === "login" ? "Login" : "Área do aluno"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4" style={themeStyle(draft.primary, draft.highlight)}>
              {preview === "login" ? <LoginPreview theme={draft} /> : <AppPreview theme={draft} />}
            </div>
            {dirty && <p className="mt-3 text-center font-dm text-xs text-warning">Pré-visualização com alterações ainda não aplicadas</p>}
          </div>

          <div className="card mt-5 p-5">
            <h2 className="font-sora text-sm font-semibold">Link de acesso da equipe</h2>
            <p className="mt-1 font-dm text-xs text-muted-foreground text-pretty">É por este endereço que os colaboradores entram. Ele já vai junto na mensagem de boas-vindas.</p>
            <div className="mt-3 flex gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">{portalUrl}</code>
              <button className="icon-btn border border-border" onClick={copy} aria-label="Copiar link">
                {copied ? <Check className="text-success" /> : <Copy />}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Personalizacao;
