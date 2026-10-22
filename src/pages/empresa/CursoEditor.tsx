import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ClipboardCheck, FileText, Layers, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { coursesApi, type CourseDraft } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CourseStatusChip, ErrorState, PageLoader, Spinner } from "@/components/kit";
import { InfoTab } from "@/components/course-editor/InfoTab";
import { ContentTab } from "@/components/course-editor/ContentTab";
import { QuizTab } from "@/components/course-editor/QuizTab";
import { EnrollmentsTab } from "@/components/course-editor/EnrollmentsTab";
import { COVER_PRESETS } from "@/mocks/images";
import { uid } from "@/mocks/hash";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

const TABS = [
  { key: "informacoes", label: "Informações", icon: FileText },
  { key: "conteudo", label: "Conteúdo", icon: Layers },
  { key: "avaliacao", label: "Avaliação", icon: ClipboardCheck },
  { key: "matriculas", label: "Matrículas", icon: Users },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const blankDraft = (): CourseDraft => ({
  title: "",
  summary: "",
  description: "",
  category: "",
  coverUrl: COVER_PRESETS[5],
  status: "rascunho",
  workloadHours: 2,
  modules: [{ id: uid("m"), title: "Módulo 1", lessons: [] }],
  quiz: { enabled: false, passingScore: 70, maxAttempts: 2, questions: [] },
});

const toDraft = ({ companyId: _c, createdAt: _cr, updatedAt: _u, ...rest }: Course): CourseDraft => rest;

const CursoEditor = () => {
  const { id = "novo" } = useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.key === params.get("aba")) ? params.get("aba") : "informacoes") as TabKey;
  const setTab = (k: TabKey) => setParams((p) => {
    p.set("aba", k);
    return p;
  }, { replace: true });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["course", id],
    queryFn: () => coursesApi.get(id),
    enabled: !isNew,
  });

  const [initial] = useState(() => (isNew ? blankDraft() : null));
  const [draft, setDraft] = useState<CourseDraft | null>(initial);
  const [baseline, setBaseline] = useState<string>(initial ? JSON.stringify(initial) : "");
  const [errors, setErrors] = useState<{ title?: string; category?: string }>({});

  useEffect(() => {
    if (data) {
      const d = toDraft(data);
      setDraft(d);
      setBaseline(JSON.stringify(d));
    }
  }, [data]);

  const dirty = useMemo(() => (draft ? JSON.stringify(draft) !== baseline : false), [draft, baseline]);
  usePageTitle(draft?.title || (isNew ? "Novo curso" : "Editar curso"));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: (d: CourseDraft) => coursesApi.save(d),
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.setQueryData(["course", course.id], course);
      const d = toDraft(course);
      setDraft(d);
      setBaseline(JSON.stringify(d));
      toast.success(isNew ? "Curso criado!" : course.status === "publicado" ? "Curso salvo e publicado" : "Alterações salvas");
      if (isNew) navigate(`/empresa/cursos/${course.id}?aba=${tab === "informacoes" ? "conteudo" : tab}`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isNew && isLoading) return <PageLoader />;
  if (!isNew && (isError || !data)) return <ErrorState message="Curso não encontrado." onRetry={refetch} />;
  if (!draft) return <PageLoader />;

  const update = (patch: Partial<CourseDraft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    if (patch.title !== undefined || patch.category !== undefined) setErrors({});
  };

  const submit = () => {
    const next = {
      title: draft.title.trim().length < 3 ? "Mínimo de 3 caracteres" : undefined,
      category: !draft.category.trim() ? "Informe a categoria" : undefined,
    };
    setErrors(next);
    if (next.title || next.category) {
      setTab("informacoes");
      toast.error("Revise os campos destacados");
      return;
    }
    save.mutate(draft);
  };

  const lessons = draft.modules.reduce((a, m) => a + m.lessons.length, 0);
  const counters: Partial<Record<TabKey, number>> = { conteudo: lessons, avaliacao: draft.quiz.enabled ? draft.quiz.questions.length : undefined };

  return (
    <>
      <Link to="/empresa/cursos" className="mb-4 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Cursos
      </Link>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CourseStatusChip status={draft.status} />
            {dirty && <span className="chip bg-warning-soft text-warning">Alterações não salvas</span>}
          </div>
          <h1 className="mt-2 truncate font-sora text-2xl font-bold md:text-[28px]">{draft.title.trim() || (isNew ? "Novo curso" : "Curso sem título")}</h1>
        </div>
        <button className="btn-primary" onClick={submit} disabled={save.isPending || (!dirty && !isNew)}>
          {save.isPending ? <Spinner /> : <Save />}
          {isNew ? "Criar curso" : "Salvar alterações"}
        </button>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((t) => {
          const disabled = t.key === "matriculas" && isNew;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              disabled={disabled}
              title={disabled ? "Salve o curso para matricular colaboradores" : undefined}
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 font-dm text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
              {counters[t.key] !== undefined && <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">{counters[t.key]}</span>}
            </button>
          );
        })}
      </div>

      {tab === "informacoes" && <InfoTab draft={draft} update={update} errors={errors} />}
      {tab === "conteudo" && <ContentTab draft={draft} update={update} />}
      {tab === "avaliacao" && <QuizTab draft={draft} update={update} />}
      {tab === "matriculas" && !isNew && (
        <EnrollmentsTab courseId={id} status={data?.status ?? draft.status} passingScore={draft.quiz.enabled ? draft.quiz.passingScore : null} />
      )}

      {dirty && (
        <div className="sticky bottom-4 z-10 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/95 px-5 py-3 shadow-card-lg backdrop-blur md:hidden">
          <span className="font-dm text-sm text-muted-foreground">Alterações não salvas</span>
          <button className="btn-primary btn-sm" onClick={submit} disabled={save.isPending}>
            {save.isPending && <Spinner />} Salvar
          </button>
        </div>
      )}
    </>
  );
};

export default CursoEditor;
