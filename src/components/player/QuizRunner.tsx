import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, CheckCircle2, ClipboardCheck, Lock, RotateCcw, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { learningApi, type QuizResult } from "@/services/api";
import type { MyCourse } from "@/types";
import { Spinner } from "@/components/kit";
import { cn } from "@/lib/utils";

/** Avaliação final: introdução → perguntas → resultado. */
export const QuizRunner = ({
  item,
  onCertificate,
  onSubmitted,
}: {
  item: MyCourse;
  onCertificate: (id: string) => void;
  onSubmitted: () => void;
}) => {
  const qc = useQueryClient();
  const { course, attempts, progress } = item;
  const quiz = course.quiz;
  const lessonsDone = progress.completedLessons === progress.totalLessons;
  const attemptsLeft = quiz.maxAttempts - attempts.length;

  const [phase, setPhase] = useState<"intro" | "answering" | "result">("intro");
  const [answers, setAnswers] = useState<number[]>(() => quiz.questions.map(() => -1));
  const [result, setResult] = useState<QuizResult | null>(null);

  const submit = useMutation({
    mutationFn: () => learningApi.submitQuiz(course.id, answers),
    onSuccess: (res) => {
      onSubmitted();
      setResult(res);
      setPhase("result");
      qc.invalidateQueries({ queryKey: ["my-course", course.id] });
      qc.invalidateQueries({ queryKey: ["my-courses"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "aluno"] });
      qc.invalidateQueries({ queryKey: ["certificates"] });
      if (res.certificate) onCertificate(res.certificate.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const answered = answers.filter((a) => a >= 0).length;

  if (!lessonsDone) {
    return (
      <div className="card p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-4 font-sora text-lg font-bold">Avaliação bloqueada</h2>
        <p className="mx-auto mt-2 max-w-sm font-dm text-sm text-muted-foreground">
          Conclua todas as aulas para liberar a prova. Faltam {progress.totalLessons - progress.completedLessons}.
        </p>
      </div>
    );
  }

  if (phase === "result" && result) {
    const { attempt } = result;
    const showAnswers = attempt.passed || result.attemptsLeft === 0;
    return (
      <div className="space-y-5">
        <div className={cn("card overflow-hidden p-8 text-center", attempt.passed ? "border-success/30" : "border-warning/30")}>
          <span className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-2xl", attempt.passed ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
            {attempt.passed ? <Trophy className="h-8 w-8" /> : <RotateCcw className="h-8 w-8" />}
          </span>
          <p className="mt-5 font-sora text-5xl font-extrabold">{attempt.score}%</p>
          <h2 className="mt-2 font-sora text-xl font-bold">{attempt.passed ? "Aprovado(a)! Parabéns" : "Ainda não foi dessa vez"}</h2>
          <p className="mx-auto mt-2 max-w-md font-dm text-sm text-muted-foreground">
            {attempt.passed
              ? "Seu certificado foi emitido e já está disponível."
              : result.attemptsLeft > 0
                ? `A nota mínima é ${quiz.passingScore}%. Revise as aulas e tente de novo. Você ainda tem ${result.attemptsLeft} tentativa(s).`
                : "Você usou todas as tentativas. O RH foi avisado e vai orientar os próximos passos."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {attempt.passed && result.certificate && (
              <Link to={`/aluno/certificados/${result.certificate.id}`} className="btn-primary">
                <Award /> Ver certificado
              </Link>
            )}
            {!attempt.passed && result.attemptsLeft > 0 && (
              <button
                className="btn-primary"
                onClick={() => {
                  setAnswers(quiz.questions.map(() => -1));
                  setPhase("answering");
                }}
              >
                <RotateCcw /> Tentar novamente
              </button>
            )}
          </div>
        </div>

        <div className="card divide-y divide-border">
          {quiz.questions.map((q, i) => {
            const right = attempt.answers[i] === result.correctIndexes[i];
            return (
              <div key={q.id} className="flex gap-3 p-5">
                {right ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
                <div className="min-w-0">
                  <p className="font-dm text-sm font-semibold">{q.prompt}</p>
                  <p className="mt-1 font-dm text-sm text-muted-foreground">Sua resposta: {q.options[attempt.answers[i]]}</p>
                  {!right && showAnswers && <p className="mt-0.5 font-dm text-sm text-success">Correta: {q.options[result.correctIndexes[i]]}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
    return (
      <div className="card p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <ClipboardCheck className="h-7 w-7" />
        </span>
        <h2 className="mt-5 font-sora text-2xl font-bold">Avaliação final</h2>
        <p className="mt-2 font-dm text-sm text-muted-foreground">Responda com calma. Você pode revisar as aulas antes de começar.</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Perguntas", quiz.questions.length],
            ["Nota mínima", `${quiz.passingScore}%`],
            ["Tentativas restantes", attemptsLeft],
            ["Sua melhor nota", best === null ? "—" : `${best}%`],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-muted/60 p-4">
              <dt className="font-dm text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 font-sora text-xl font-bold">{v}</dd>
            </div>
          ))}
        </dl>
        {attemptsLeft > 0 ? (
          <button className="btn-primary mt-7 px-6 py-3" onClick={() => setPhase("answering")}>
            Começar avaliação
          </button>
        ) : (
          <p className="mt-7 rounded-xl bg-warning-soft px-4 py-3 font-dm text-sm text-foreground/80">Você usou todas as tentativas. Fale com o RH da sua empresa.</p>
        )}
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (answered < quiz.questions.length) {
          toast.error("Responda todas as perguntas antes de enviar");
          return;
        }
        submit.mutate();
      }}
    >
      <div className="sticky top-16 z-10 -mx-1 rounded-2xl border border-border bg-white/95 px-5 py-3 shadow-card backdrop-blur">
        <div className="flex justify-between font-dm text-xs">
          <span className="font-semibold">
            {answered} de {quiz.questions.length} respondidas
          </span>
          <span className="text-muted-foreground">Nota mínima {quiz.passingScore}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answered / quiz.questions.length) * 100}%` }} />
        </div>
      </div>

      {quiz.questions.map((q, qi) => (
        <fieldset key={q.id} className="card p-6">
          <legend className="sr-only">Pergunta {qi + 1}</legend>
          <p className="eyebrow text-primary">Pergunta {qi + 1}</p>
          <p className="mt-2 font-sora text-base font-semibold leading-snug">{q.prompt}</p>
          <div className="mt-4 space-y-2">
            {q.options.map((opt, oi) => {
              const checked = answers[qi] === oi;
              return (
                <label
                  key={oi}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 font-dm text-sm transition-colors",
                    checked ? "border-primary bg-primary-soft/70" : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                    checked={checked}
                    onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  />
                  <span className="font-semibold text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-ghost" onClick={() => setPhase("intro")}>
          Voltar
        </button>
        <button type="submit" className="btn-primary px-6" disabled={submit.isPending}>
          {submit.isPending && <Spinner />} Enviar respostas
        </button>
      </div>
    </form>
  );
};
