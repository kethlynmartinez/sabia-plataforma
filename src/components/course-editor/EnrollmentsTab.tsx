import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { coursesApi } from "@/services/api";
import { Avatar, EmptyState, ErrorState, ProgressBar, Skeleton, Spinner } from "@/components/kit";
import { formatDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/types";

export const EnrollmentsTab = ({ courseId, status, passingScore }: { courseId: string; status: CourseStatus; passingScore: number | null }) => {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["course", courseId, "enrollments"],
    queryFn: () => coursesApi.enrollments(courseId),
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (data) setSelected(new Set(data.filter((r) => r.enrolled).map((r) => r.user.id)));
  }, [data]);

  const original = useMemo(() => new Set(data?.filter((r) => r.enrolled).map((r) => r.user.id)), [data]);
  const dirty = data ? selected.size !== original.size || [...selected].some((id) => !original.has(id)) : false;

  const save = useMutation({
    mutationFn: () => coursesApi.setEnrollments(courseId, [...selected]),
    onSuccess: ({ added, removed }) => {
      qc.invalidateQueries({ queryKey: ["course", courseId, "enrollments"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      const parts = [added && `${pluralize(added, "matrícula nova", "matrículas novas")} (avisadas no WhatsApp)`, removed && pluralize(removed, "removida", "removidas")].filter(Boolean);
      toast.success(parts.join(" · ") || "Matrículas atualizadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reminder = useMutation({
    mutationFn: () => coursesApi.sendReminder(courseId),
    onSuccess: ({ recipients }) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Lembrete enviado para ${pluralize(recipients, "colaborador", "colaboradores")}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-80" />;
  if (isError || !data) return <ErrorState message="Não foi possível carregar as matrículas." onRetry={refetch} />;
  if (!data.length) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum colaborador cadastrado"
        description="Cadastre a equipe para poder matricular neste curso."
        action={<Link to="/empresa/colaboradores" className="btn-primary">Ir para colaboradores</Link>}
      />
    );
  }

  const q = search.trim().toLowerCase();
  const rows = data.filter((r) => !q || `${r.user.name} ${r.user.department}`.toLowerCase().includes(q));
  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.user.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      rows.forEach((r) => (allVisibleSelected ? n.delete(r.user.id) : n.add(r.user.id)));
      return n;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
          <input className="field pl-10" placeholder="Buscar colaborador ou área" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar colaborador" />
        </div>
        <button className="btn-outline" onClick={() => reminder.mutate()} disabled={status !== "publicado" || reminder.isPending} title={status !== "publicado" ? "Publique o curso para enviar lembretes" : undefined}>
          {reminder.isPending ? <Spinner /> : <MessageCircle />} Lembrar pendentes
        </button>
        <button className="btn-primary" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending && <Spinner />} Salvar matrículas ({selected.size})
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-12 px-4 py-3">
                <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={allVisibleSelected} onChange={toggleAll} aria-label="Selecionar todos" />
              </th>
              {["Colaborador", "Progresso", "Melhor nota", "Situação"].map((h) => (
                <th key={h} className="px-4 py-3 font-sora text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const checked = selected.has(r.user.id);
              return (
                <tr key={r.user.id} className={cn("transition-colors", checked ? "bg-primary-soft/30" : "hover:bg-muted/40", !r.user.active && "opacity-60")}>
                  <td className="px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={checked} onChange={() => toggle(r.user.id)} aria-label={`Matricular ${r.user.name}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.user.name} size="sm" />
                      <div>
                        <p className="font-dm text-sm font-semibold">{r.user.name}</p>
                        <p className="font-dm text-xs text-muted-foreground">
                          {r.user.department}
                          {!r.user.active && " · inativo"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="w-48 px-4 py-3">
                    {r.enrolled ? (
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.progress} tone={r.completedAt ? "success" : "primary"} />
                        <span className="w-9 shrink-0 text-right font-dm text-xs text-muted-foreground">{r.progress}%</span>
                      </div>
                    ) : (
                      <span className="font-dm text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-dm text-sm">
                    {r.bestScore === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={cn("font-semibold", passingScore !== null && r.bestScore >= passingScore ? "text-success" : "text-warning")}>{r.bestScore}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!r.enrolled ? (
                      <span className="chip bg-muted text-muted-foreground">Não matriculado</span>
                    ) : r.completedAt ? (
                      <span className="chip bg-success-soft text-success">Concluído em {formatDate(r.completedAt)}</span>
                    ) : r.progress > 0 ? (
                      <span className="chip bg-primary-soft text-primary">Em andamento</span>
                    ) : (
                      <span className="chip bg-warning-soft text-warning">Não iniciado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dirty && <p className="font-dm text-xs text-warning">Você tem alterações de matrícula não salvas.</p>}
    </div>
  );
};
