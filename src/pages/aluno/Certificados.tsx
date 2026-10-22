import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Clock, ExternalLink } from "lucide-react";
import { certificatesApi } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { EmptyState, ErrorState, PageHeader, PageLoader } from "@/components/kit";
import { formatDate } from "@/lib/format";

const Certificados = () => {
  usePageTitle("Certificados");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["certificates"], queryFn: certificatesApi.mine });

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <ErrorState message="Não foi possível carregar seus certificados." onRetry={refetch} />;

  const hours = data.reduce((a, c) => a + c.course.workloadHours, 0);

  return (
    <>
      <PageHeader
        title="Certificados"
        description={data.length ? `${data.length} certificado(s) · ${hours}h de capacitação comprovada` : "Seus certificados aparecem aqui ao concluir os cursos."}
      />
      {data.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <Link key={c.certificate.id} to={`/aluno/certificados/${c.certificate.id}`} className="card group relative overflow-hidden p-6 transition-shadow hover:shadow-card-lg">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/15 to-highlight/20" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-highlight text-white shadow-glow">
                <Award className="h-6 w-6" />
              </span>
              <p className="eyebrow relative mt-5 text-primary">{c.course.category}</p>
              <h2 className="relative mt-1 font-sora text-base font-bold leading-snug">{c.course.title}</h2>
              <div className="relative mt-4 flex flex-wrap gap-x-4 gap-y-1 font-dm text-xs text-muted-foreground">
                <span>Emitido em {formatDate(c.certificate.issuedAt)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {c.course.workloadHours}h
                </span>
                {c.score !== null && <span>Nota {c.score}%</span>}
              </div>
              <span className="relative mt-5 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-primary group-hover:underline">
                Abrir certificado <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Award} title="Nenhum certificado ainda" description="Conclua as aulas e a avaliação de um curso para receber o certificado automaticamente." action={<Link to="/aluno/cursos" className="btn-primary">Ir para meus cursos</Link>} />
      )}
    </>
  );
};

export default Certificados;
