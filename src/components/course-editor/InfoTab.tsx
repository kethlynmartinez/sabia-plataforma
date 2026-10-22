import { Archive, Eye, PencilLine } from "lucide-react";
import type { CourseDraft } from "@/services/api";
import type { CourseStatus } from "@/types";
import { Field } from "@/components/kit";
import { ImagePicker } from "@/components/ImagePicker";
import { COVER_PRESETS } from "@/mocks/images";
import { cn } from "@/lib/utils";

export const CATEGORIES = ["Segurança", "Atendimento", "Gestão", "Compliance", "Operações", "Vendas", "Tecnologia", "Integração", "Saúde e bem-estar"];

const STATUS_OPTIONS: { value: CourseStatus; label: string; text: string; icon: typeof Eye }[] = [
  { value: "rascunho", label: "Rascunho", text: "Só a equipe de RH vê", icon: PencilLine },
  { value: "publicado", label: "Publicado", text: "Visível para matriculados", icon: Eye },
  { value: "arquivado", label: "Arquivado", text: "Fora do ar, histórico mantido", icon: Archive },
];

interface Props {
  draft: CourseDraft;
  update: (patch: Partial<CourseDraft>) => void;
  errors: { title?: string; category?: string };
}

export const InfoTab = ({ draft, update, errors }: Props) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
    <section className="card space-y-5 p-6">
      <Field label="Título do curso" error={errors.title} htmlFor="title">
        <input id="title" className="field" value={draft.title} aria-invalid={Boolean(errors.title)} onChange={(e) => update({ title: e.target.value })} placeholder="Ex.: Integração de novos colaboradores" maxLength={90} />
      </Field>
      <Field label="Resumo" hint="Aparece no card do curso (até 140 caracteres)." htmlFor="summary">
        <input id="summary" className="field" maxLength={140} value={draft.summary} onChange={(e) => update({ summary: e.target.value })} placeholder="O que o colaborador vai aprender, em uma frase" />
      </Field>
      <Field label="Descrição completa" htmlFor="description">
        <textarea id="description" rows={5} className="field resize-y" value={draft.description} onChange={(e) => update({ description: e.target.value })} placeholder="Público, objetivos e o que é avaliado…" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Categoria" error={errors.category} htmlFor="category">
          <input id="category" list="categories" className="field" value={draft.category} aria-invalid={Boolean(errors.category)} onChange={(e) => update({ category: e.target.value })} placeholder="Escolha ou digite" />
          <datalist id="categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Carga horária (h)" hint="Vai para o certificado." htmlFor="hours">
          <input id="hours" type="number" min={1} max={400} className="field" value={draft.workloadHours} onChange={(e) => update({ workloadHours: Math.max(1, Number(e.target.value) || 1) })} />
        </Field>
      </div>
    </section>

    <div className="space-y-6">
      <section className="card p-6">
        <h3 className="font-sora text-sm font-semibold">Status</h3>
        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Status do curso">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={draft.status === s.value}
              onClick={() => update({ status: s.value })}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                draft.status === s.value ? "border-primary bg-primary-soft/60" : "border-border hover:border-primary/40",
              )}
            >
              <s.icon className={cn("h-4 w-4", draft.status === s.value ? "text-primary" : "text-muted-foreground")} />
              <span>
                <span className="block font-dm text-sm font-semibold">{s.label}</span>
                <span className="block font-dm text-xs text-muted-foreground">{s.text}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="card p-6">
        <h3 className="mb-3 font-sora text-sm font-semibold">Capa</h3>
        <ImagePicker value={draft.coverUrl} onChange={(v) => update({ coverUrl: v ?? COVER_PRESETS[0] })} presets={COVER_PRESETS} maxSide={1200} />
      </section>
    </div>
  </div>
);
