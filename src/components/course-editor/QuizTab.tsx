import { CircleCheck, ClipboardCheck, Plus, Trash2, X } from "lucide-react";
import type { CourseDraft } from "@/services/api";
import type { Question, Quiz } from "@/types";
import { EmptyState, Field } from "@/components/kit";
import { Switch } from "@/components/ui/switch";
import { uid } from "@/mocks/hash";
import { cn } from "@/lib/utils";

interface Props {
  draft: CourseDraft;
  update: (patch: Partial<CourseDraft>) => void;
}

const newQuestion = (): Question => ({ id: uid("q"), prompt: "", options: ["", ""], correctIndex: 0 });

export const QuizTab = ({ draft, update }: Props) => {
  const quiz = draft.quiz;
  const setQuiz = (patch: Partial<Quiz>) => update({ quiz: { ...quiz, ...patch } });
  const patchQ = (id: string, patch: Partial<Question>) => setQuiz({ questions: quiz.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });

  const enable = (enabled: boolean) => setQuiz({ enabled, questions: enabled && !quiz.questions.length ? [newQuestion()] : quiz.questions });

  return (
    <div className="space-y-5">
      <section className="card flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <div className="flex flex-1 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-sora text-base font-semibold">Avaliação final</h2>
            <p className="mt-1 font-dm text-sm text-muted-foreground">
              Liberada quando o colaborador conclui todas as aulas. O certificado só é emitido com a nota mínima.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-3 font-dm text-sm font-semibold">
          {quiz.enabled ? "Ativada" : "Desativada"}
          <Switch checked={quiz.enabled} onCheckedChange={enable} aria-label="Ativar avaliação" />
        </label>
      </section>

      {quiz.enabled ? (
        <>
          <section className="card grid gap-5 p-6 sm:grid-cols-2">
            <Field label={`Nota mínima para aprovação: ${quiz.passingScore}%`} htmlFor="passing">
              <input
                id="passing"
                type="range"
                min={10}
                max={100}
                step={5}
                value={quiz.passingScore}
                onChange={(e) => setQuiz({ passingScore: Number(e.target.value) })}
                className="mt-2 w-full accent-[hsl(var(--primary))]"
              />
            </Field>
            <Field label="Tentativas permitidas" htmlFor="attempts">
              <select id="attempts" className="field" value={quiz.maxAttempts} onChange={(e) => setQuiz({ maxAttempts: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "tentativa" : "tentativas"}
                  </option>
                ))}
              </select>
            </Field>
          </section>

          {quiz.questions.map((q, qi) => (
            <section key={q.id} className="card p-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-primary">Pergunta {qi + 1}</p>
                <button
                  type="button"
                  className="icon-btn h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setQuiz({ questions: quiz.questions.filter((x) => x.id !== q.id) })}
                  aria-label={`Excluir pergunta ${qi + 1}`}
                >
                  <Trash2 />
                </button>
              </div>
              <textarea
                rows={2}
                className="field mt-3 resize-y font-semibold"
                value={q.prompt}
                onChange={(e) => patchQ(q.id, { prompt: e.target.value })}
                placeholder="Escreva o enunciado"
                aria-label={`Enunciado da pergunta ${qi + 1}`}
              />
              <fieldset className="mt-4 space-y-2">
                <legend className="mb-2 font-dm text-xs text-muted-foreground">Marque a alternativa correta</legend>
                {q.options.map((opt, oi) => {
                  const correct = q.correctIndex === oi;
                  return (
                    <div key={oi} className={cn("flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors", correct ? "border-success bg-success-soft/50" : "border-border")}>
                      <button
                        type="button"
                        onClick={() => patchQ(q.id, { correctIndex: oi })}
                        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors", correct ? "text-success" : "text-border hover:text-muted-foreground")}
                        aria-label={`Marcar alternativa ${oi + 1} como correta`}
                        aria-pressed={correct}
                      >
                        <CircleCheck className="h-5 w-5" />
                      </button>
                      <input
                        className="min-w-0 flex-1 bg-transparent py-1.5 font-dm text-sm focus:outline-none"
                        value={opt}
                        onChange={(e) => patchQ(q.id, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })}
                        placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`}
                        aria-label={`Alternativa ${oi + 1}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          className="icon-btn h-8 w-8"
                          onClick={() =>
                            patchQ(q.id, {
                              options: q.options.filter((_, i) => i !== oi),
                              correctIndex: q.correctIndex === oi ? 0 : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex,
                            })
                          }
                          aria-label={`Remover alternativa ${oi + 1}`}
                        >
                          <X />
                        </button>
                      )}
                    </div>
                  );
                })}
              </fieldset>
              {q.options.length < 5 && (
                <button type="button" className="btn-ghost btn-sm mt-3 text-primary hover:bg-primary-soft hover:text-primary" onClick={() => patchQ(q.id, { options: [...q.options, ""] })}>
                  <Plus /> Alternativa
                </button>
              )}
            </section>
          ))}

          <button type="button" className="btn-outline w-full border-dashed py-3" onClick={() => setQuiz({ questions: [...quiz.questions, newQuestion()] })}>
            <Plus /> Adicionar pergunta
          </button>
        </>
      ) : (
        <EmptyState
          icon={ClipboardCheck}
          title="Curso sem avaliação"
          description="Sem prova, o certificado é emitido assim que o colaborador conclui todas as aulas."
          action={
            <button className="btn-primary" onClick={() => enable(true)}>
              Criar avaliação
            </button>
          }
        />
      )}
    </div>
  );
};
