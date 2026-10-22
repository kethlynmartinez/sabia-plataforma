import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, BookOpen, CheckCircle2, ClipboardCheck, Clock, MessageSquareHeart, PlayCircle } from "lucide-react";
import { dashboardApi, feedbackApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Avatar, EmptyState, ErrorState, PageLoader, ProgressBar, StatCard } from "@/components/kit";
import { SmartImage } from "@/components/SmartImage";
import { CourseCard } from "@/components/CourseCard";
import { firstName, greeting, relativeTime, todayLabel } from "@/lib/format";

const Dashboard = () => {
  usePageTitle("Início");
  const { user, company } = useAuth();
  const overview = useQuery({ queryKey: ["dashboard", "aluno"], queryFn: dashboardApi.aluno });
  const feedbacks = useQuery({ queryKey: ["feedbacks", "mine"], queryFn: feedbackApi.mine });

  if (overview.isLoading) return <PageLoader />;
  if (overview.isError || !overview.data) return <ErrorState message="Não foi possível carregar seus cursos." onRetry={overview.refetch} />;

  const { stats, inProgress, awaitingQuiz } = overview.data;
  const awaitingIds = new Set(awaitingQuiz.map((m) => m.course.id));
  const [hero, ...others] = inProgress.filter((m) => !awaitingIds.has(m.course.id));
  const received = feedbacks.data?.received ?? [];

  return (
    <>
      <div className="mb-7">
        <p className="font-dm text-sm text-muted-foreground">{todayLabel()}</p>
        <h1 className="mt-1 font-sora text-2xl font-bold md:text-[28px]">
          {greeting()}, {firstName(user?.name ?? "")} 👋
        </h1>
        <p className="mt-1.5 font-dm text-sm text-muted-foreground">Bem-vindo(a) à {company?.theme.displayName}. Bora aprender um pouco hoje?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Cursos matriculados" value={stats.enrolled} />
        <StatCard icon={CheckCircle2} label="Cursos concluídos" value={stats.completed} tone="success" />
        <StatCard icon={Award} label="Certificados" value={stats.certificates} tone="highlight" />
        <StatCard icon={Clock} label="Horas certificadas" value={`${stats.certifiedHours}h`} tone="warning" />
      </div>

      {awaitingQuiz.length > 0 && (
        <section className="mt-6 space-y-3">
          {awaitingQuiz.map((m) => (
            <Link
              key={m.course.id}
              to={`/aluno/cursos/${m.course.id}?etapa=avaliacao`}
              className="flex flex-col gap-3 rounded-2xl border border-highlight/40 bg-highlight-soft p-5 transition-colors hover:border-highlight sm:flex-row sm:items-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-sora text-[15px] font-semibold">Avaliação liberada: {m.course.title}</span>
                <span className="block font-dm text-sm text-foreground/70">
                  Você concluiu todas as aulas. Nota mínima {m.course.quiz.passingScore}% · {m.course.quiz.maxAttempts - m.attempts.length} tentativa(s) restante(s).
                </span>
              </span>
              <span className="btn-primary">
                Fazer agora <ArrowRight />
              </span>
            </Link>
          ))}
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-4 font-sora text-lg font-bold">Continue de onde parou</h2>
          {hero ? (
            <Link to={`/aluno/cursos/${hero.course.id}`} className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-card-lg sm:flex-row">
              <SmartImage src={hero.course.coverUrl} className="aspect-[16/9] w-full sm:aspect-auto sm:w-[42%]" />
              <div className="flex flex-1 flex-col p-6">
                <p className="eyebrow text-primary">{hero.course.category}</p>
                <h3 className="mt-1.5 font-sora text-lg font-bold leading-snug">{hero.course.title}</h3>
                <p className="mt-1.5 line-clamp-2 font-dm text-sm text-muted-foreground">{hero.course.summary}</p>
                <div className="mt-auto pt-5">
                  <div className="flex justify-between font-dm text-xs text-muted-foreground">
                    <span>
                      {hero.progress.completedLessons} de {hero.progress.totalLessons} aulas
                    </span>
                    <span className="font-semibold text-primary">{hero.progress.percent}%</span>
                  </div>
                  <ProgressBar className="mt-2" value={hero.progress.percent} />
                  <span className="btn-primary mt-4">
                    <PlayCircle /> {hero.progress.completedLessons ? "Continuar" : "Começar"}
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Tudo em dia!"
              description="Você não tem cursos pendentes. Quando o RH matricular você em um novo curso, ele aparece aqui e no seu WhatsApp."
              action={<Link to="/aluno/certificados" className="btn-outline">Ver meus certificados</Link>}
            />
          )}

          {others.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {others.slice(0, 4).map((m) => (
                <CourseCard key={m.course.id} item={m} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 font-sora text-lg font-bold">
            <MessageSquareHeart className="h-5 w-5 text-primary" /> Recados do RH
          </h2>
          <div className="card divide-y divide-border">
            {received.length ? (
              received.slice(0, 4).map((f) => (
                <article key={f.id} className="flex gap-3 p-5">
                  <Avatar name={f.authorName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-dm text-sm font-semibold">{f.authorName}</p>
                      <span className="shrink-0 font-dm text-[11px] text-muted-foreground">{relativeTime(f.createdAt)}</span>
                    </div>
                    {f.courseTitle && <p className="font-dm text-[11px] font-semibold text-primary">{f.courseTitle}</p>}
                    <p className="mt-1.5 font-dm text-sm leading-relaxed text-foreground/80">{f.message}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="p-6 text-center font-dm text-sm text-muted-foreground">Nenhum recado por enquanto.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Dashboard;
