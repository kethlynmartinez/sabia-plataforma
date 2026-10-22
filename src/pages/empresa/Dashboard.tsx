import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  GraduationCap,
  MessageCircle,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { dashboardApi, type ActivityItem } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { EmptyState, ErrorState, PageHeader, PageLoader, ProgressBar, StatCard } from "@/components/kit";
import { firstName, formatNumber, greeting, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: 7, label: "Últimos 7 dias" },
  { value: 30, label: "Últimos 30 dias" },
  { value: 90, label: "Últimos 90 dias" },
];

const ACTIVITY_ICON: Record<ActivityItem["type"], { icon: typeof Award; cls: string }> = {
  certificado: { icon: Award, cls: "bg-success-soft text-success" },
  aprovado: { icon: CheckCircle2, cls: "bg-success-soft text-success" },
  reprovado: { icon: XCircle, cls: "bg-warning-soft text-warning" },
  novo: { icon: UserPlus, cls: "bg-primary-soft text-primary" },
};

const Dashboard = () => {
  usePageTitle("Visão geral");
  const { user, company } = useAuth();
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "admin", days],
    queryFn: () => dashboardApi.admin(days),
    placeholderData: (prev) => prev,
  });

  if (isLoading || !company) return <PageLoader />;
  if (isError || !data) return <ErrorState message="Não foi possível carregar o painel." onRetry={refetch} />;

  const { stats, whatsapp, courseProgress, activity, onboarding } = data;
  const onboardingSteps = [
    { done: onboarding.brand, label: "Aplicar a identidade visual da empresa", to: "/empresa/personalizacao" },
    { done: onboarding.course, label: "Criar o primeiro curso", to: "/empresa/cursos/novo" },
    { done: onboarding.published, label: "Publicar um curso", to: "/empresa/cursos" },
    { done: onboarding.users, label: "Cadastrar colaboradores", to: "/empresa/colaboradores" },
    { done: onboarding.enrollments, label: "Matricular a equipe nos cursos", to: "/empresa/colaboradores" },
  ];
  const doneCount = onboardingSteps.filter((s) => s.done).length;
  const chartData = whatsapp.days.map((d) => ({
    ...d,
    label: new Date(`${d.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <>
      <PageHeader
        eyebrow={company.name}
        title={`${greeting()}, ${firstName(user?.name ?? "")}`}
        description="Acompanhe o engajamento da equipe e o andamento dos treinamentos."
        actions={
          <>
            <select className="field w-auto py-2" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Período">
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <Link to="/empresa/cursos/novo" className="btn-primary">
              <Plus /> Novo curso
            </Link>
          </>
        }
      />

      {doneCount < onboardingSteps.length && (
        <section className="card mb-6 overflow-hidden">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
            <div className="md:w-72">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-highlight text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-sora text-lg font-bold">Primeiros passos</h2>
              <p className="mt-1 font-dm text-sm text-muted-foreground">
                {doneCount} de {onboardingSteps.length} concluídos para colocar os treinamentos no ar.
              </p>
              <ProgressBar className="mt-3" value={(doneCount / onboardingSteps.length) * 100} />
            </div>
            <ul className="grid flex-1 gap-2 sm:grid-cols-2">
              {onboardingSteps.map((s) => (
                <li key={s.label}>
                  <Link
                    to={s.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 font-dm text-sm transition-colors",
                      s.done ? "border-transparent bg-success-soft/60 text-foreground/60 line-through" : "border-border hover:border-primary hover:bg-primary-soft/50",
                    )}
                  >
                    {s.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Colaboradores ativos" value={formatNumber(stats.activeUsers)} hint={`${formatNumber(stats.totalUsers)} cadastrados no total`} />
        <StatCard icon={BookOpen} label="Cursos publicados" value={formatNumber(stats.publishedCourses)} hint={stats.draftCourses ? `${stats.draftCourses} em rascunho` : "Nenhum rascunho pendente"} tone="highlight" />
        <StatCard icon={TrendingUp} label="Taxa de conclusão" value={`${stats.completionRate}%`} hint={stats.avgScore !== null ? `Nota média nas avaliações: ${stats.avgScore}` : "Sem avaliações realizadas"} tone="success" />
        <StatCard icon={Award} label="Certificados emitidos" value={formatNumber(stats.certificates)} hint={`${stats.certificatesLast30} nos últimos 30 dias`} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-sora text-base font-semibold">
                <MessageCircle className="h-4 w-4 text-whatsapp" /> Engajamento no WhatsApp
              </h2>
              <p className="mt-1 font-dm text-xs text-muted-foreground">Convites, novas aulas e lembretes enviados pela plataforma</p>
            </div>
            <dl className="flex gap-6">
              {[
                ["Enviadas", whatsapp.sent],
                ["Lidas", whatsapp.read],
                ["Respostas", whatsapp.replied],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="font-dm text-[11px] text-muted-foreground">{k}</dt>
                  <dd className="font-sora text-lg font-bold">{formatNumber(v as number)}</dd>
                </div>
              ))}
              <div>
                <dt className="font-dm text-[11px] text-muted-foreground">Leitura</dt>
                <dd className="font-sora text-lg font-bold text-success">{whatsapp.readRate}%</dd>
              </div>
            </dl>
          </div>
          {chartData.length ? (
            <div className="mt-6 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="g-sent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={company.theme.primary} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={company.theme.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-read" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={company.theme.highlight} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={company.theme.highlight} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(240 16% 92%)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(245 10% 50%)" }} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(245 10% 50%)" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(240 16% 90%)", fontFamily: "DM Sans", fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="sent" name="Enviadas" stroke={company.theme.primary} strokeWidth={2} fill="url(#g-sent)" />
                  <Area type="monotone" dataKey="read" name="Lidas" stroke={company.theme.highlight} strokeWidth={2} fill="url(#g-read)" />
                  <Area type="monotone" dataKey="replied" name="Respostas" stroke="#16A34A" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState className="mt-6" icon={MessageCircle} title="Nenhuma mensagem enviada ainda" description="As mensagens aparecem aqui quando você cadastra colaboradores ou envia lembretes." />
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-sora text-base font-semibold">Conclusão por curso</h2>
          <p className="mt-1 font-dm text-xs text-muted-foreground">Colaboradores que concluíram / matriculados</p>
          {courseProgress.length ? (
            <ul className="mt-5 space-y-5">
              {courseProgress.slice(0, 5).map((c) => (
                <li key={c.courseId}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link to={`/empresa/cursos/${c.courseId}`} className="truncate font-dm text-[13px] font-semibold text-foreground hover:text-primary">
                      {c.title}
                    </Link>
                    <span className="shrink-0 font-dm text-xs text-muted-foreground">
                      {c.completed}/{c.enrolled}
                    </span>
                  </div>
                  <ProgressBar className="mt-2" value={c.rate} tone={c.rate >= 60 ? "success" : "primary"} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-5 py-8" icon={GraduationCap} title="Nenhum curso publicado" action={<Link to="/empresa/cursos/novo" className="btn-soft btn-sm">Criar curso</Link>} />
          )}
        </section>
      </div>

      <section className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-sora text-base font-semibold">Atividade recente</h2>
          <Link to="/empresa/avaliacoes" className="font-dm text-[13px] font-semibold text-primary hover:underline">
            Ver avaliações
          </Link>
        </div>
        {activity.length ? (
          <ul className="mt-4 divide-y divide-border">
            {activity.map((a) => {
              const meta = ACTIVITY_ICON[a.type];
              return (
                <li key={`${a.type}-${a.id}`} className="flex items-center gap-3 py-3">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.cls)}>
                    <meta.icon className="h-4 w-4" />
                  </span>
                  <p className="min-w-0 flex-1 font-dm text-sm text-foreground/85">{a.text}</p>
                  <span className="shrink-0 font-dm text-xs text-muted-foreground">{relativeTime(a.at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 font-dm text-sm text-muted-foreground">As conclusões e cadastros da equipe aparecerão aqui.</p>
        )}
      </section>
    </>
  );
};

export default Dashboard;
