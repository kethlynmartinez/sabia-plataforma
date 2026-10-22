import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Hourglass, MessageSquareQuote, Pencil, XCircle } from "lucide-react";
import { assessmentsApi, feedbackApi } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Avatar, EmptyState, ErrorState, PageHeader, PageLoader, Stars } from "@/components/kit";
import { SmartImage } from "@/components/SmartImage";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const Avaliacoes = () => {
  usePageTitle("Avaliações");
  const results = useQuery({ queryKey: ["assessments"], queryFn: assessmentsApi.results });
  const ratings = useQuery({ queryKey: ["feedbacks", "company"], queryFn: feedbackApi.company });
  const [course, setCourse] = useState("");
  const [result, setResult] = useState<"" | "aprovado" | "reprovado">("");

  if (results.isLoading) return <PageLoader />;
  if (results.isError || !results.data) return <ErrorState message="Não foi possível carregar as avaliações." onRetry={results.refetch} />;

  const { summary, attempts } = results.data;
  const filtered = attempts.filter((a) => (!course || a.courseId === course) && (!result || (result === "aprovado" ? a.passed : !a.passed)));

  return (
    <>
      <PageHeader title="Avaliações" description="Resultados das provas finais, colaboradores aguardando avaliação e o que a equipe achou dos cursos." />

      {!summary.length ? (
        <EmptyState icon={ClipboardCheck} title="Nenhum curso com avaliação" description="Ative a avaliação final na aba “Avaliação” do editor de cursos." action={<Link to="/empresa/cursos" className="btn-primary">Ver cursos</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summary.map((s) => (
            <article key={s.courseId} className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border p-4">
                <SmartImage src={s.coverUrl} className="h-12 w-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sora text-sm font-semibold">{s.title}</p>
                  <p className="font-dm text-xs text-muted-foreground">
                    {s.questions} perguntas · mínimo {s.passingScore}%
                  </p>
                </div>
                <Link to={`/empresa/cursos/${s.courseId}?aba=avaliacao`} className="icon-btn" aria-label={`Editar prova de ${s.title}`}>
                  <Pencil />
                </Link>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-border text-center">
                <div className="p-4">
                  <dt className="font-dm text-[11px] text-muted-foreground">Nota média</dt>
                  <dd className="mt-1 font-sora text-xl font-bold">{s.avgScore ?? "—"}</dd>
                </div>
                <div className="p-4">
                  <dt className="font-dm text-[11px] text-muted-foreground">Aprovação</dt>
                  <dd className={cn("mt-1 font-sora text-xl font-bold", s.approvalRate !== null && s.approvalRate >= 70 ? "text-success" : "text-foreground")}>
                    {s.approvalRate === null ? "—" : `${s.approvalRate}%`}
                  </dd>
                </div>
                <div className="p-4">
                  <dt className="font-dm text-[11px] text-muted-foreground">Aguardando</dt>
                  <dd className={cn("mt-1 font-sora text-xl font-bold", s.awaiting ? "text-warning" : "text-foreground")}>{s.awaiting}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      <section className="card mt-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-sora text-base font-semibold">Tentativas</h2>
            <p className="font-dm text-xs text-muted-foreground">{filtered.length} registros</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="field py-2 sm:w-64" value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Filtrar por curso">
              <option value="">Todos os cursos</option>
              {summary.map((s) => (
                <option key={s.courseId} value={s.courseId}>
                  {s.title}
                </option>
              ))}
            </select>
            <select className="field py-2 sm:w-40" value={result} onChange={(e) => setResult(e.target.value as typeof result)} aria-label="Filtrar por resultado">
              <option value="">Todos</option>
              <option value="aprovado">Aprovados</option>
              <option value="reprovado">Reprovados</option>
            </select>
          </div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Colaborador", "Curso", "Nota", "Resultado", "Data"].map((h) => (
                    <th key={h} className="px-5 py-3 font-sora text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.userName} size="sm" />
                        <div>
                          <p className="font-dm text-sm font-semibold">{a.userName}</p>
                          <p className="font-dm text-xs text-muted-foreground">{a.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] truncate px-5 py-3 font-dm text-[13px]">{a.courseTitle}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full", a.passed ? "bg-success" : "bg-warning")} style={{ width: `${a.score}%` }} />
                          <div className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: `${a.passingScore}%` }} title={`Mínimo ${a.passingScore}%`} />
                        </div>
                        <span className="font-sora text-sm font-bold">{a.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {a.passed ? (
                        <span className="chip bg-success-soft text-success">
                          <CheckCircle2 className="h-3 w-3" /> Aprovado
                        </span>
                      ) : (
                        <span className="chip bg-warning-soft text-warning">
                          <XCircle className="h-3 w-3" /> Abaixo da nota
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-dm text-[13px] text-muted-foreground">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center font-dm text-sm text-muted-foreground">
            <Hourglass className="mx-auto mb-2 h-5 w-5" /> Nenhuma tentativa com esses filtros.
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-1 flex items-center gap-2 font-sora text-base font-semibold">
          <MessageSquareQuote className="h-4 w-4 text-primary" /> O que a equipe achou dos cursos
        </h2>
        <p className="mb-4 font-dm text-xs text-muted-foreground">Avaliações enviadas pelos colaboradores ao concluir as aulas.</p>
        {ratings.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {ratings.data.map((f) => (
              <figure key={f.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={f.rating ?? 0} />
                  <span className="font-dm text-xs text-muted-foreground">{relativeTime(f.createdAt)}</span>
                </div>
                <blockquote className="mt-3 font-dm text-sm leading-relaxed text-foreground/85">“{f.message || "Sem comentário"}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
                  <Avatar name={f.userName} size="sm" />
                  <span className="min-w-0 font-dm text-xs">
                    <strong className="block text-foreground">{f.userName}</strong>
                    <span className="block truncate text-muted-foreground">{f.courseTitle}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center font-dm text-sm text-muted-foreground">Nenhuma avaliação de curso ainda.</p>
        )}
      </section>
    </>
  );
};

export default Avaliacoes;
