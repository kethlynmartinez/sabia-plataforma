import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { learningApi } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { EmptyState, ErrorState, PageHeader, PageLoader } from "@/components/kit";
import { CourseCard, courseState } from "@/components/CourseCard";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "andamento", label: "Em andamento" },
  { key: "concluidos", label: "Concluídos" },
  { key: "todos", label: "Todos" },
] as const;

const Cursos = () => {
  usePageTitle("Meus cursos");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-courses"], queryFn: learningApi.myCourses });
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("andamento");

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <ErrorState message="Não foi possível carregar seus cursos." onRetry={refetch} />;

  const groups = {
    andamento: data.filter((m) => courseState(m) !== "concluido"),
    concluidos: data.filter((m) => courseState(m) === "concluido"),
    todos: data,
  };
  const list = groups[tab];

  return (
    <>
      <PageHeader title="Meus cursos" description="Cursos em que a sua empresa matriculou você." />
      <div className="mb-6 flex w-full max-w-fit gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 sm:px-4 font-dm text-[13px] font-semibold transition-colors", tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {t.label}
            <span className={cn("rounded-full px-1.5 text-[11px]", tab === t.key ? "bg-white/20" : "bg-muted")}>{groups[t.key].length}</span>
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <CourseCard key={m.course.id} item={m} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={tab === "concluidos" ? "Nenhum curso concluído ainda" : "Nenhum curso por aqui"}
          description={tab === "concluidos" ? "Ao terminar as aulas (e a avaliação, quando houver), o curso aparece aqui com o certificado." : "Quando o RH matricular você, o curso aparece aqui."}
        />
      )}
    </>
  );
};

export default Cursos;
