import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { certificatesApi } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ErrorState, PageLoader } from "@/components/kit";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { BrandMark } from "@/components/brand/BrandLogo";
import { formatDateLong } from "@/lib/format";
import { BRAND } from "@/lib/brand";

const Certificado = () => {
  const { id = "" } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["certificate", id], queryFn: () => certificatesApi.get(id) });
  usePageTitle(data ? `Certificado · ${data.course.title}` : "Certificado");

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <ErrorState message="Certificado não encontrado." onRetry={refetch} />;

  const { certificate, course, user, company, score } = data;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/aluno/certificados" className="inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Certificados
        </Link>
        <button className="btn-primary" onClick={() => window.print()}>
          <Printer /> Imprimir ou salvar PDF
        </button>
      </div>

      <div className="overflow-x-auto pb-4">
        <article className="print-area relative mx-auto aspect-[297/210] w-full min-w-[720px] max-w-[1000px] overflow-hidden rounded-2xl bg-white shadow-card-lg">
          {/* moldura e formas decorativas nas cores da empresa */}
          <div className="absolute inset-[18px] rounded-xl border-2 border-primary/25" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10" />
          <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-highlight/15" />
          <div className="absolute left-0 top-0 h-full w-3 bg-gradient-to-b from-primary to-highlight" />

          <div className="relative flex h-full flex-col px-[8%] py-[6%]">
            <div className="flex items-start justify-between">
              <CompanyLogo theme={company.theme} />
              <div className="text-right font-dm text-[11px] text-muted-foreground">
                <p className="flex items-center justify-end gap-1 font-semibold text-foreground/70">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" /> Código de verificação
                </p>
                <p className="font-mono text-xs tracking-wider text-foreground">{certificate.code}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="eyebrow text-primary">Certificado de conclusão</p>
              <p className="mt-5 font-dm text-sm text-muted-foreground">Certificamos que</p>
              <p className="mt-2 font-sora text-[clamp(26px,3.6vw,40px)] font-bold leading-tight text-foreground">{user.name}</p>
              <div className="mx-auto mt-3 h-0.5 w-24 rounded-full bg-highlight" />
              <p className="mt-5 max-w-[620px] font-dm text-[15px] leading-relaxed text-foreground/80">
                concluiu com êxito o curso <strong className="text-foreground">{course.title}</strong>, oferecido pela {company.theme.displayName}, com carga horária de{" "}
                <strong className="text-foreground">{course.workloadHours} horas</strong>
                {score !== null && (
                  <>
                    {" "}
                    e aproveitamento de <strong className="text-foreground">{score}%</strong>
                  </>
                )}
                .
              </p>
            </div>

            <div className="flex items-end justify-between gap-6">
              <div className="font-dm text-xs text-muted-foreground">
                <p>Emitido em</p>
                <p className="font-semibold text-foreground">{formatDateLong(certificate.issuedAt)}</p>
              </div>
              <div className="w-56 text-center">
                <p className="font-sora text-lg italic text-primary/80">{company.name}</p>
                <div className="mt-1 border-t border-foreground/30 pt-1.5 font-dm text-[11px] text-muted-foreground">Coordenação de Treinamento e Desenvolvimento</div>
              </div>
              <div className="flex items-center gap-1.5 font-dm text-[10px] text-muted-foreground">
                <BrandMark className="h-4 w-4" /> Emitido via {BRAND.name}
              </div>
            </div>
          </div>
        </article>
      </div>
      <p className="mt-2 text-center font-dm text-xs text-muted-foreground">
        Dica: na janela de impressão, escolha “Salvar como PDF” e o layout paisagem. Certificado de demonstração, sem validade.
      </p>
    </>
  );
};

export default Certificado;
