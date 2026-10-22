import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, Layers, MessageCircle, MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { coursesApi } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ConfirmDialog, CourseStatusChip, EmptyState, ErrorState, PageHeader, PageLoader, ProgressBar, Stars } from "@/components/kit";
import { SmartImage } from "@/components/SmartImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CourseStatus, CourseSummary } from "@/types";

const FILTERS: { value: CourseStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "publicado", label: "Publicados" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "arquivado", label: "Arquivados" },
];

const Cursos = () => {
  usePageTitle("Cursos");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const [filter, setFilter] = useState<CourseStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<CourseSummary | null>(null);

  const reminder = useMutation({
    mutationFn: (id: string) => coursesApi.sendReminder(id),
    onSuccess: ({ recipients }) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Lembrete enviado no WhatsApp para ${pluralize(recipients, "colaborador", "colaboradores")}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Curso excluído");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <ErrorState message="Não foi possível carregar os cursos." onRetry={refetch} />;

  const counts = Object.fromEntries(FILTERS.map((f) => [f.value, f.value === "todos" ? data.length : data.filter((c) => c.status === f.value).length]));
  const q = search.trim().toLowerCase();
  const list = data.filter((c) => (filter === "todos" || c.status === filter) && (!q || `${c.title} ${c.category}`.toLowerCase().includes(q)));

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Monte trilhas com módulos, aulas e avaliação final. Só cursos publicados aparecem para os colaboradores."
        actions={
          <Link to="/empresa/cursos/novo" className="btn-primary">
            <Plus /> Novo curso
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card" role="tablist" aria-label="Filtrar por status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 font-dm text-[13px] font-semibold transition-colors",
                filter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 text-[11px]", filter === f.value ? "bg-white/20" : "bg-muted")}>{counts[f.value]}</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
          <input className="field pl-10" placeholder="Buscar curso" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar curso" />
        </div>
      </div>

      {!data.length ? (
        <EmptyState
          icon={BookOpen}
          title="Crie o primeiro curso da sua empresa"
          description="Comece com um módulo e algumas aulas curtas. Você pode publicar quando estiver pronto."
          action={
            <Link to="/empresa/cursos/novo" className="btn-primary">
              <Plus /> Criar curso
            </Link>
          }
        />
      ) : !list.length ? (
        <EmptyState icon={Search} title="Nenhum curso encontrado" description="Tente outro filtro ou termo de busca." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const rate = c.enrolledCount ? Math.round((c.completedCount / c.enrolledCount) * 100) : 0;
            return (
              <article key={c.id} className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-card-lg">
                <Link to={`/empresa/cursos/${c.id}`} className="relative block aspect-[16/9]" aria-label={`Editar ${c.title}`}>
                  <SmartImage src={c.coverUrl} alt="" className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                  <CourseStatusChip status={c.status} className="absolute left-3 top-3 bg-white/95 shadow-sm" />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="eyebrow text-primary">{c.category}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="icon-btn -mr-2 -mt-2 h-8 w-8" aria-label={`Ações de ${c.title}`}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60 rounded-xl">
                        <DropdownMenuItem onSelect={() => navigate(`/empresa/cursos/${c.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar curso
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate(`/empresa/cursos/${c.id}?aba=matriculas`)}>
                          <Users className="mr-2 h-4 w-4" /> Gerenciar matrículas
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={c.status !== "publicado" || reminder.isPending} onSelect={() => reminder.mutate(c.id)}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Lembrar pendentes no WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setDeleting(c)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Link to={`/empresa/cursos/${c.id}`} className="mt-1 font-sora text-base font-bold leading-snug text-foreground hover:text-primary">
                    {c.title}
                  </Link>
                  <p className="mt-1.5 line-clamp-2 font-dm text-[13px] text-muted-foreground">{c.summary || "Sem descrição"}</p>

                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-dm text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> {pluralize(c.lessonsCount, "aula", "aulas")}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {c.workloadHours}h
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {pluralize(c.enrolledCount, "matrícula", "matrículas")}
                    </li>
                  </ul>

                  <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between font-dm text-xs">
                      <span className="text-muted-foreground">
                        Conclusão <strong className="text-foreground">{rate}%</strong>
                      </span>
                      {c.avgRating !== null && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Stars value={c.avgRating} /> {c.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <ProgressBar className="mt-2" value={rate} tone={rate >= 60 ? "success" : "primary"} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Excluir curso?"
        description={
          <>
            <strong className="text-foreground">{deleting?.title}</strong> será removido junto com {pluralize(deleting?.enrolledCount ?? 0, "matrícula", "matrículas")}, notas e certificados. Para
            tirar do ar sem perder o histórico, altere o status para <em>Arquivado</em>.
          </>
        }
        confirmLabel="Excluir curso"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
};

export default Cursos;
