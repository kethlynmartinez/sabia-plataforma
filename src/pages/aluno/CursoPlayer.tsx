import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ClipboardCheck,
  Clock,
  FileText,
  ListChecks,
  Lock,
  Pause,
  Play,
  PlayCircle,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { feedbackApi, learningApi } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ErrorState, PageLoader, ProgressBar, Spinner } from "@/components/kit";
import { LessonContent } from "@/components/LessonContent";
import { QuizRunner } from "@/components/player/QuizRunner";
import { RateCourse } from "@/components/player/RateCourse";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toEmbedUrl } from "@/lib/files";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lesson, MyCourse } from "@/types";

type Step = { kind: "lesson"; id: string } | { kind: "quiz" } | { kind: "done" };

/** Player demonstrativo: simula a reprodução quando a aula não tem link de vídeo. */
const DemoVideo = ({ lesson, onEnded }: { lesson: Lesson; onEnded: () => void }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const ended = useRef(false);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    ended.current = false;
  }, [lesson.id]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 2.5)), 100);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => {
    if (progress >= 100 && !ended.current) {
      ended.current = true;
      setPlaying(false);
      onEnded();
    }
  }, [progress, onEnded]);

  const elapsed = Math.round((progress / 100) * lesson.durationMin * 60);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-primary-strong via-primary to-highlight">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
        <p className="eyebrow text-white/70">Aula em vídeo · demonstração</p>
        <p className="mt-2 max-w-md font-sora text-lg font-bold leading-snug sm:text-2xl">{lesson.title}</p>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-card-lg transition-transform hover:scale-105"
          aria-label={playing ? "Pausar" : "Reproduzir"}
        >
          {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-1 h-6 w-6 fill-current" />}
        </button>
        <p className="mt-4 max-w-sm font-dm text-xs text-white/65">Sem link cadastrado, simulamos a reprodução. O RH pode colar um link do YouTube ou Vimeo no editor do curso.</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-8 font-dm text-xs text-white">
        <span>{fmt(elapsed)}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <span>{fmt(lesson.durationMin * 60)}</span>
      </div>
    </div>
  );
};

const firstOpenStep = (m: MyCourse): Step => {
  const lessons = m.course.modules.flatMap((x) => x.lessons);
  if (m.enrollment.completedAt) return { kind: "done" };
  const pending = lessons.find((l) => !m.enrollment.completedLessonIds.includes(l.id));
  if (!pending && m.course.quiz.enabled) return { kind: "quiz" };
  const last = m.enrollment.lastLessonId;
  if (last && lessons.some((l) => l.id === last) && pending) {
    // retoma da última aula vista se ela ainda não foi concluída; senão vai para a próxima pendente
    return { kind: "lesson", id: m.enrollment.completedLessonIds.includes(last) ? pending.id : last };
  }
  return { kind: "lesson", id: (pending ?? lessons[0])?.id ?? "" };
};

const CursoPlayer = () => {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-course", id], queryFn: () => learningApi.myCourse(id) });
  const feedbacks = useQuery({ queryKey: ["feedbacks", "mine"], queryFn: feedbackApi.mine });
  usePageTitle(data?.course.title ?? "Curso");

  const [step, setStep] = useState<Step | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  // mantém a tela de resultado da prova visível mesmo após a aprovação atualizar os dados
  const [quizActive, setQuizActive] = useState(false);

  useEffect(() => {
    if (data && !step) setStep(params.get("etapa") === "avaliacao" && data.course.quiz.enabled ? { kind: "quiz" } : firstOpenStep(data));
  }, [data, step, params]);

  const lessons = useMemo(() => data?.course.modules.flatMap((m) => m.lessons) ?? [], [data]);

  const complete = useMutation({
    mutationFn: (lessonId: string) => learningApi.completeLesson(id, lessonId),
    onSuccess: ({ myCourse, certificate }) => {
      qc.setQueryData(["my-course", id], myCourse);
      qc.invalidateQueries({ queryKey: ["my-courses"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "aluno"] });
      if (certificate) {
        qc.invalidateQueries({ queryKey: ["certificates"] });
        setCelebrate(certificate.id);
        setStep({ kind: "done" });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !step) return isError ? <ErrorState message="Curso não encontrado ou você não está matriculado." onRetry={refetch} /> : <PageLoader />;
  if (isError || !data) return <ErrorState message="Curso não encontrado ou você não está matriculado." onRetry={refetch} />;

  const { course, enrollment, progress } = data;
  const done = new Set(enrollment.completedLessonIds);
  const lessonsComplete = progress.completedLessons === progress.totalLessons && progress.totalLessons > 0;
  const current = step.kind === "lesson" ? lessons.find((l) => l.id === step.id) : undefined;
  const idx = current ? lessons.indexOf(current) : -1;
  const next = idx >= 0 ? lessons[idx + 1] : undefined;
  const prev = idx > 0 ? lessons[idx - 1] : undefined;
  const myRating = feedbacks.data?.sent.find((f) => f.courseId === course.id);

  const go = (s: Step) => {
    setStep(s);
    setQuizActive(false);
    setOutlineOpen(false);
    if (s.kind === "lesson") learningApi.setLastLesson(id, s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completeAndAdvance = async (lesson: Lesson) => {
    if (!done.has(lesson.id)) {
      const res = await complete.mutateAsync(lesson.id).catch(() => null);
      if (!res) return;
      if (res.certificate) return;
      const nowAllDone = res.myCourse.progress.completedLessons === res.myCourse.progress.totalLessons;
      if (nowAllDone && course.quiz.enabled) {
        toast.success("Todas as aulas concluídas! A avaliação final foi liberada.");
        go({ kind: "quiz" });
        return;
      }
    }
    if (next) go({ kind: "lesson", id: next.id });
    else if (course.quiz.enabled) go({ kind: "quiz" });
  };

  const outline = (
    <nav aria-label="Conteúdo do curso" className="space-y-5">
      {course.modules.map((m, mi) => (
        <div key={m.id}>
          <p className="eyebrow mb-2 px-2 text-muted-foreground">
            Módulo {mi + 1} · {m.title}
          </p>
          <ul className="space-y-0.5">
            {m.lessons.map((l) => {
              const active = step.kind === "lesson" && step.id === l.id;
              const isDone = done.has(l.id);
              return (
                <li key={l.id}>
                  <button
                    onClick={() => go({ kind: "lesson", id: l.id })}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-primary-soft" : "hover:bg-muted",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {isDone ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-primary" : "text-border")} />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block font-dm text-[13px] leading-snug", active ? "font-semibold text-primary" : "text-foreground/85")}>{l.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 font-dm text-[11px] text-muted-foreground">
                        {l.type === "video" ? <PlayCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {l.durationMin} min
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {course.quiz.enabled && (
        <button
          onClick={() => go({ kind: "quiz" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
            step.kind === "quiz" ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40",
          )}
        >
          {data.passed ? <Trophy className="h-4 w-4 text-success" /> : lessonsComplete ? <ClipboardCheck className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
          <span className="font-dm text-[13px]">
            <span className="block font-semibold">Avaliação final</span>
            <span className="text-[11px] text-muted-foreground">{data.passed ? `Aprovado · ${data.bestScore}%` : lessonsComplete ? "Liberada" : "Conclua as aulas para liberar"}</span>
          </span>
        </button>
      )}
      {data.certificate && (
        <Link to={`/aluno/certificados/${data.certificate.id}`} className="flex items-center gap-3 rounded-xl bg-success-soft px-3 py-3 font-dm text-[13px] font-semibold text-success">
          <Award className="h-4 w-4" /> Ver certificado
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link to="/aluno/cursos" className="inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Meus cursos
        </Link>
        <button className="btn-outline btn-sm lg:hidden" onClick={() => setOutlineOpen(true)}>
          <ListChecks /> Conteúdo
        </button>
      </div>

      <header className="mb-6">
        <p className="eyebrow text-primary">{course.category}</p>
        <h1 className="mt-1 font-sora text-2xl font-bold md:text-[28px]">{course.title}</h1>
        <div className="mt-3 flex max-w-xl items-center gap-3">
          <ProgressBar value={progress.percent} tone={enrollment.completedAt ? "success" : "primary"} />
          <span className="shrink-0 font-dm text-xs font-semibold text-muted-foreground">
            {progress.completedLessons}/{progress.totalLessons} aulas · {progress.percent}%
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {step.kind === "lesson" && current && (
            <>
              {current.type === "video" &&
                (toEmbedUrl(current.videoUrl) ? (
                  <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                    <iframe
                      src={toEmbedUrl(current.videoUrl)!}
                      title={current.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <DemoVideo lesson={current} onEnded={() => toast.success("Vídeo concluído! Marque a aula para avançar.")} />
                ))}

              <article className="card p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3 font-dm text-xs text-muted-foreground">
                  <span className="chip bg-primary-soft text-primary">
                    {current.type === "video" ? <PlayCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    {current.type === "video" ? "Vídeo" : "Leitura"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {current.durationMin} min
                  </span>
                  <span>
                    Aula {idx + 1} de {lessons.length}
                  </span>
                </div>
                <h2 className="mt-3 font-sora text-xl font-bold">{current.title}</h2>
                <div className="mt-5">
                  <LessonContent text={current.content} />
                </div>
              </article>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button className="btn-ghost" disabled={!prev} onClick={() => prev && go({ kind: "lesson", id: prev.id })}>
                  <ChevronLeft /> Aula anterior
                </button>
                {done.has(current.id) ? (
                  <div className="flex items-center gap-3">
                    <span className="chip bg-success-soft text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Concluída
                    </span>
                    {(next || course.quiz.enabled) && (
                      <button className="btn-primary" onClick={() => completeAndAdvance(current)}>
                        {next ? "Próxima aula" : "Ir para a avaliação"} <ArrowRight />
                      </button>
                    )}
                  </div>
                ) : (
                  <button className="btn-primary" onClick={() => completeAndAdvance(current)} disabled={complete.isPending}>
                    {complete.isPending ? <Spinner /> : <CheckCircle2 />}
                    {next ? "Concluir e avançar" : course.quiz.enabled ? "Concluir e ir para a avaliação" : "Concluir curso"}
                  </button>
                )}
              </div>
            </>
          )}

          {step.kind === "quiz" &&
            (data.passed && !quizActive ? (
              <div className="card p-8 text-center">
                <Trophy className="mx-auto h-10 w-10 text-success" />
                <h2 className="mt-4 font-sora text-xl font-bold">Você foi aprovado(a) com {data.bestScore}%</h2>
                <p className="mt-2 font-dm text-sm text-muted-foreground">
                  {data.attempts.length} tentativa(s) · nota mínima {course.quiz.passingScore}%
                </p>
                {data.certificate && (
                  <Link to={`/aluno/certificados/${data.certificate.id}`} className="btn-primary mt-6">
                    <Award /> Ver certificado
                  </Link>
                )}
              </div>
            ) : (
              <QuizRunner item={data} onSubmitted={() => setQuizActive(true)} onCertificate={setCelebrate} />
            ))}

          {step.kind === "done" && (
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-highlight p-8 text-center text-white">
                <Award className="mx-auto h-12 w-12" />
                <h2 className="mt-4 font-sora text-2xl font-bold">Curso concluído!</h2>
                <p className="mt-2 font-dm text-sm text-white/85">{enrollment.completedAt && `Finalizado em ${formatDate(enrollment.completedAt)}`}{data.bestScore !== null && ` · nota ${data.bestScore}%`}</p>
                {data.certificate && (
                  <Link to={`/aluno/certificados/${data.certificate.id}`} className="btn mt-6 bg-white text-primary hover:bg-white/90">
                    Ver e baixar certificado
                  </Link>
                )}
              </div>
              <p className="p-5 text-center font-dm text-sm text-muted-foreground">Você pode revisar qualquer aula pelo menu de conteúdo.</p>
            </div>
          )}

          {(enrollment.completedAt || data.passed) && <RateCourse key={myRating?.id ?? "novo"} courseId={course.id} existing={myRating} />}
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto p-4 scrollbar-thin">{outline}</div>
        </aside>
      </div>

      {/* Conteúdo no mobile */}
      {outlineOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Conteúdo do curso">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOutlineOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 animate-in slide-in-from-bottom">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-sora text-base font-semibold">Conteúdo do curso</p>
              <button className="icon-btn" onClick={() => setOutlineOpen(false)} aria-label="Fechar">
                <X />
              </button>
            </div>
            {outline}
          </div>
        </div>
      )}

      <Dialog open={Boolean(celebrate)} onOpenChange={(v) => !v && setCelebrate(null)}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="items-center text-center">
            <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-highlight text-white">
              <Award className="h-8 w-8" />
            </span>
            <DialogTitle className="text-center text-xl">Certificado emitido! 🎉</DialogTitle>
            <DialogDescription className="text-center font-dm">
              Você concluiu <strong className="text-foreground">{course.title}</strong>. O RH também foi avisado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <button className="btn-ghost" onClick={() => setCelebrate(null)}>
              Fechar
            </button>
            <Link to={`/aluno/certificados/${celebrate}`} className="btn-primary">
              Ver certificado
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CursoPlayer;
