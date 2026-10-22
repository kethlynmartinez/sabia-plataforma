import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Clock, FileText, Layers, PlayCircle, Plus, Trash2 } from "lucide-react";
import type { CourseDraft } from "@/services/api";
import type { Lesson, Module } from "@/types";
import { ConfirmDialog, EmptyState, Field } from "@/components/kit";
import { uid } from "@/mocks/hash";
import { toEmbedUrl } from "@/lib/files";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  draft: CourseDraft;
  update: (patch: Partial<CourseDraft>) => void;
}

const move = <T,>(arr: T[], from: number, to: number) => {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

const newLesson = (): Lesson => ({ id: uid("l"), title: "", type: "video", content: "", durationMin: 5 });

export const ContentTab = ({ draft, update }: Props) => {
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Module | null>(null);
  const modules = draft.modules;

  const setModules = (next: Module[]) => update({ modules: next });
  const patchModule = (id: string, patch: Partial<Module>) => setModules(modules.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const patchLesson = (moduleId: string, lessonId: string, patch: Partial<Lesson>) =>
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) } : m)));

  const addModule = () => setModules([...modules, { id: uid("m"), title: `Módulo ${modules.length + 1}`, lessons: [] }]);
  const addLesson = (moduleId: string) => {
    const lesson = newLesson();
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m)));
    setOpenLesson(lesson.id);
  };
  const removeModule = (id: string) => setModules(modules.filter((m) => m.id !== id));

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const totalMinutes = modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.durationMin, 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-dm text-sm text-muted-foreground">
          {pluralize(modules.length, "módulo", "módulos")} · {pluralize(totalLessons, "aula", "aulas")} · {Math.round(totalMinutes)} min de conteúdo
        </p>
        <button type="button" className="btn-outline btn-sm" onClick={addModule}>
          <Plus /> Adicionar módulo
        </button>
      </div>

      {!modules.length && (
        <EmptyState icon={Layers} title="Nenhum módulo ainda" description="Organize o conteúdo em módulos (ex.: Introdução, Prática, Encerramento)." action={<button className="btn-primary" onClick={addModule}><Plus /> Criar módulo</button>} />
      )}

      {modules.map((m, mi) => (
        <section key={m.id} className="card overflow-hidden">
          <header className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-sora text-xs font-bold text-primary-foreground">{mi + 1}</span>
            <input
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-sora text-[15px] font-semibold hover:border-input focus:border-primary focus:bg-white focus:outline-none"
              value={m.title}
              onChange={(e) => patchModule(m.id, { title: e.target.value })}
              placeholder="Nome do módulo"
              aria-label={`Nome do módulo ${mi + 1}`}
            />
            <div className="flex shrink-0 items-center">
              <button type="button" className="icon-btn h-8 w-8" disabled={mi === 0} onClick={() => setModules(move(modules, mi, mi - 1))} aria-label="Mover módulo para cima">
                <ArrowUp />
              </button>
              <button type="button" className="icon-btn h-8 w-8" disabled={mi === modules.length - 1} onClick={() => setModules(move(modules, mi, mi + 1))} aria-label="Mover módulo para baixo">
                <ArrowDown />
              </button>
              <button
                type="button"
                className="icon-btn h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => (m.lessons.length ? setPendingDelete(m) : removeModule(m.id))}
                aria-label="Excluir módulo"
              >
                <Trash2 />
              </button>
            </div>
          </header>

          <ul className="divide-y divide-border">
            {m.lessons.map((l, li) => {
              const open = openLesson === l.id;
              const embedOk = l.type !== "video" || !l.videoUrl || Boolean(toEmbedUrl(l.videoUrl));
              return (
                <li key={l.id} className={cn(open && "bg-primary-soft/30")}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {l.type === "video" ? <PlayCircle className="h-4 w-4 shrink-0 text-primary" /> : <FileText className="h-4 w-4 shrink-0 text-highlight" />}
                    <button type="button" onClick={() => setOpenLesson(open ? null : l.id)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
                      <span className={cn("block truncate font-dm text-sm font-medium", !l.title && "italic text-muted-foreground")}>{l.title || "Aula sem título"}</span>
                    </button>
                    <span className="hidden shrink-0 items-center gap-1 font-dm text-xs text-muted-foreground sm:flex">
                      <Clock className="h-3 w-3" /> {l.durationMin} min
                    </span>
                    <div className="flex shrink-0 items-center">
                      <button type="button" className="icon-btn h-8 w-8" disabled={li === 0} onClick={() => patchModule(m.id, { lessons: move(m.lessons, li, li - 1) })} aria-label="Mover aula para cima">
                        <ArrowUp />
                      </button>
                      <button type="button" className="icon-btn h-8 w-8" disabled={li === m.lessons.length - 1} onClick={() => patchModule(m.id, { lessons: move(m.lessons, li, li + 1) })} aria-label="Mover aula para baixo">
                        <ArrowDown />
                      </button>
                      <button type="button" className="icon-btn h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => patchModule(m.id, { lessons: m.lessons.filter((x) => x.id !== l.id) })} aria-label="Excluir aula">
                        <Trash2 />
                      </button>
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setOpenLesson(open ? null : l.id)} aria-label={open ? "Recolher aula" : "Editar aula"}>
                        <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="grid gap-4 px-4 pb-5 pt-1 md:grid-cols-[1fr_180px_120px]">
                      <Field label="Título da aula" className="md:col-span-1">
                        <input className="field" value={l.title} onChange={(e) => patchLesson(m.id, l.id, { title: e.target.value })} placeholder="Ex.: Boas-vindas" autoFocus />
                      </Field>
                      <Field label="Formato">
                        <div className="flex rounded-[10px] border-[1.5px] border-input bg-white p-1">
                          {(["video", "texto"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => patchLesson(m.id, l.id, { type: t })}
                              className={cn("flex-1 rounded-[7px] py-1.5 font-dm text-[13px] font-semibold transition-colors", l.type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                            >
                              {t === "video" ? "Vídeo" : "Texto"}
                            </button>
                          ))}
                        </div>
                      </Field>
                      <Field label="Duração (min)">
                        <input type="number" min={1} max={240} className="field" value={l.durationMin} onChange={(e) => patchLesson(m.id, l.id, { durationMin: Math.max(1, Number(e.target.value) || 1) })} />
                      </Field>
                      {l.type === "video" && (
                        <Field
                          label="Link do vídeo (YouTube ou Vimeo)"
                          className="md:col-span-3"
                          error={embedOk ? undefined : "Link não reconhecido. Use um endereço do YouTube ou Vimeo"}
                          hint="Sem link, a aula mostra um player demonstrativo."
                        >
                          <input className="field" value={l.videoUrl ?? ""} aria-invalid={!embedOk} onChange={(e) => patchLesson(m.id, l.id, { videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" />
                        </Field>
                      )}
                      <Field label={l.type === "video" ? "Resumo / material de apoio" : "Conteúdo da aula"} className="md:col-span-3" hint='Separe parágrafos com uma linha em branco. Comece a linha com "- " para criar listas.'>
                        <textarea rows={l.type === "texto" ? 7 : 3} className="field resize-y" value={l.content} onChange={(e) => patchLesson(m.id, l.id, { content: e.target.value })} />
                      </Field>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="px-4 py-3">
            <button type="button" className="btn-ghost btn-sm text-primary hover:bg-primary-soft hover:text-primary" onClick={() => addLesson(m.id)}>
              <Plus /> Adicionar aula
            </button>
          </div>
        </section>
      ))}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title="Excluir módulo?"
        description={`"${pendingDelete?.title}" tem ${pluralize(pendingDelete?.lessons.length ?? 0, "aula", "aulas")}. A exclusão só vale depois que você salvar o curso.`}
        confirmLabel="Excluir módulo"
        onConfirm={() => {
          if (pendingDelete) removeModule(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
};
