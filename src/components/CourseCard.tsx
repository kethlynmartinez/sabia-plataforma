import { Link } from "react-router-dom";
import { Award, CheckCircle2, ClipboardCheck, Clock, PlayCircle } from "lucide-react";
import type { MyCourse } from "@/types";
import { ProgressBar } from "@/components/kit";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/utils";

export const courseState = (m: MyCourse) => {
  if (m.enrollment.completedAt) return "concluido" as const;
  const lessonsDone = m.progress.totalLessons > 0 && m.progress.completedLessons === m.progress.totalLessons;
  if (lessonsDone && m.course.quiz.enabled && !m.passed) {
    return m.attempts.length >= m.course.quiz.maxAttempts ? ("bloqueado" as const) : ("avaliacao" as const);
  }
  if (m.progress.completedLessons === 0) return "novo" as const;
  return "andamento" as const;
};

const CTA = {
  concluido: { label: "Ver certificado", icon: Award },
  avaliacao: { label: "Fazer avaliação", icon: ClipboardCheck },
  bloqueado: { label: "Ver resultado", icon: ClipboardCheck },
  novo: { label: "Começar curso", icon: PlayCircle },
  andamento: { label: "Continuar", icon: PlayCircle },
};

/** Card de curso na visão do colaborador. */
export const CourseCard = ({ item }: { item: MyCourse }) => {
  const state = courseState(item);
  const cta = CTA[state];
  const href = state === "concluido" && item.certificate ? `/aluno/certificados/${item.certificate.id}` : `/aluno/cursos/${item.course.id}`;

  return (
    <article className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-card-lg">
      <Link to={`/aluno/cursos/${item.course.id}`} className="relative block aspect-[16/9]" aria-label={item.course.title}>
        <SmartImage src={item.course.coverUrl} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
        {state === "concluido" && (
          <span className="chip absolute left-3 top-3 bg-success text-white shadow-sm">
            <CheckCircle2 className="h-3 w-3" /> Concluído
          </span>
        )}
        {state === "avaliacao" && <span className="chip absolute left-3 top-3 bg-highlight text-highlight-foreground shadow-sm">Avaliação liberada</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-primary">{item.course.category}</p>
        <h3 className="mt-1 font-sora text-base font-bold leading-snug">{item.course.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 font-dm text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {item.progress.totalLessons} aulas · {item.course.workloadHours}h de carga horária
        </p>
        <div className="mt-auto pt-5">
          <div className="flex justify-between font-dm text-xs">
            <span className="text-muted-foreground">
              {item.progress.completedLessons} de {item.progress.totalLessons} aulas
            </span>
            <span className="font-semibold text-primary">{item.progress.percent}%</span>
          </div>
          <ProgressBar className="mt-2" value={item.progress.percent} tone={state === "concluido" ? "success" : "primary"} />
          <Link to={href} className={cn("mt-4 w-full", state === "concluido" ? "btn-outline" : "btn-primary")}>
            <cta.icon /> {cta.label}
          </Link>
        </div>
      </div>
    </article>
  );
};
