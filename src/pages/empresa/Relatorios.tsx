import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardCheck, Download, FileSpreadsheet, MessageCircle, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { assessmentsApi, reportsApi, usersApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { EmptyState, PageHeader, Spinner } from "@/components/kit";
import { downloadCsv } from "@/lib/files";
import { formatDate } from "@/lib/format";

const stamp = () => new Date().toISOString().slice(0, 10);

const ReportCard = ({
  icon: Icon,
  title,
  text,
  onDownload,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  onDownload: () => Promise<void>;
  children?: React.ReactNode;
}) => {
  const [busy, setBusy] = useState(false);
  return (
    <article className="card flex flex-col p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-sora text-base font-semibold">{title}</h3>
      <p className="mt-1.5 flex-1 font-dm text-sm text-muted-foreground">{text}</p>
      {children}
      <button
        className="btn-outline mt-5"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onDownload();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Falha ao gerar relatório");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Spinner /> : <Download />} Baixar CSV
      </button>
    </article>
  );
};

const Relatorios = () => {
  usePageTitle("Relatórios");
  const { company } = useAuth();
  const [waDays, setWaDays] = useState(30);
  const progress = useQuery({ queryKey: ["reports", "progress"], queryFn: reportsApi.progress });

  const byDepartment = Object.values(
    (progress.data ?? []).reduce<Record<string, { area: string; total: number; done: number }>>((acc, r) => {
      acc[r.department] ??= { area: r.department, total: 0, done: 0 };
      acc[r.department].total++;
      if (r.status === "Concluído") acc[r.department].done++;
      return acc;
    }, {}),
  )
    .map((d) => ({ ...d, taxa: Math.round((d.done / d.total) * 100) }))
    .sort((a, b) => b.taxa - a.taxa);

  return (
    <>
      <PageHeader title="Relatórios" description="Exporte os dados em CSV (abre direto no Excel ou no Google Planilhas) e veja a conclusão por área." />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          icon={TrendingUp}
          title="Progresso por colaborador"
          text="Uma linha por matrícula: curso, progresso, situação, melhor nota e datas."
          onDownload={async () => {
            const rows = await reportsApi.progress();
            downloadCsv(`progresso-${stamp()}`, ["Colaborador", "E-mail", "Área", "Curso", "Progresso (%)", "Situação", "Melhor nota", "Matrícula", "Conclusão"], rows.map((r) => [r.name, r.email, r.department, r.course, r.progress, r.status, r.bestScore ?? "", formatDate(r.enrolledAt), r.completedAt ? formatDate(r.completedAt) : ""]));
          }}
        />
        <ReportCard
          icon={ClipboardCheck}
          title="Resultados das avaliações"
          text="Todas as tentativas com nota, nota mínima e resultado."
          onDownload={async () => {
            const { attempts } = await assessmentsApi.results();
            downloadCsv(`avaliacoes-${stamp()}`, ["Colaborador", "Área", "Curso", "Nota", "Nota mínima", "Resultado", "Data"], attempts.map((a) => [a.userName, a.department, a.courseTitle, a.score, a.passingScore, a.passed ? "Aprovado" : "Reprovado", formatDate(a.createdAt)]));
          }}
        />
        <ReportCard
          icon={MessageCircle}
          title="Engajamento no WhatsApp"
          text="Mensagens enviadas, lidas e respondidas por dia."
          onDownload={async () => {
            const days = await reportsApi.whatsapp(waDays);
            downloadCsv(`whatsapp-${waDays}d-${stamp()}`, ["Data", "Enviadas", "Lidas", "Respondidas", "Taxa de leitura (%)"], days.map((d) => [formatDate(`${d.date}T12:00:00`), d.sent, d.read, d.replied, d.sent ? Math.round((d.read / d.sent) * 100) : 0]));
          }}
        >
          <select className="field mt-4 py-2" value={waDays} onChange={(e) => setWaDays(Number(e.target.value))} aria-label="Período do relatório de WhatsApp">
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </ReportCard>
        <ReportCard
          icon={Users}
          title="Base de colaboradores"
          text="Cadastro completo com área, cargo, status e último acesso."
          onDownload={async () => {
            const users = await usersApi.list();
            downloadCsv(`colaboradores-${stamp()}`, ["Nome", "E-mail", "WhatsApp", "Área", "Cargo", "Status", "Cursos concluídos", "Certificados", "Último acesso"], users.map((u) => [u.name, u.email, u.phone, u.department, u.position, u.active ? "Ativo" : "Inativo", u.completedCount, u.certificates, u.lastAccessAt ? formatDate(u.lastAccessAt) : "Nunca"]));
          }}
        />
      </div>

      <section className="card mt-8 p-6">
        <h2 className="font-sora text-base font-semibold">Conclusão por área</h2>
        <p className="mt-1 font-dm text-xs text-muted-foreground">Percentual de matrículas concluídas em cada departamento</p>
        {progress.isLoading ? (
          <div className="flex h-64 items-center justify-center text-primary">
            <Spinner className="h-5 w-5" />
          </div>
        ) : byDepartment.length ? (
          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} margin={{ left: -18, right: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(240 16% 92%)" strokeDasharray="4 4" />
                <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(245 10% 50%)" }} interval={0} />
                <YAxis axisLine={false} tickLine={false} unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(245 10% 50%)" }} />
                <Tooltip
                  cursor={{ fill: "hsl(240 20% 96%)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(240 16% 90%)", fontFamily: "DM Sans", fontSize: 12 }}
                  formatter={(v: number, _n, item) => [`${v}% (${item.payload.done}/${item.payload.total})`, "Conclusão"]}
                />
                <Bar dataKey="taxa" fill={company?.theme.primary} radius={[8, 8, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState className="mt-6" icon={FileSpreadsheet} title="Sem matrículas ainda" description="O gráfico aparece quando houver colaboradores matriculados." />
        )}
      </section>
    </>
  );
};

export default Relatorios;
