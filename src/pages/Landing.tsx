import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Layers,
  Menu,
  MessageCircle,
  Palette,
  Smartphone,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Selo } from "@/components/brand/Selo";
import { ParticlesCanvas } from "@/components/ParticlesCanvas";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { WhiteLabelShowcase } from "@/components/landing/WhiteLabelShowcase";
import { Reveal } from "@/components/landing/Reveal";
import { DemoResetButton } from "@/components/DemoResetButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/components/RequireAuth";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/* Com HashRouter, âncoras "#secao" conflitam com as rotas — a rolagem é feita via JS. */
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const NAV = [
  { id: "como-funciona", label: "Como funciona" },
  { id: "recursos", label: "Recursos" },
  { id: "sua-marca", label: "Sua marca" },
  { id: "faq", label: "Dúvidas" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { role } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollTo(id);
  };

  return (
    <header
      className={cn(
        "brand-dark fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open ? "border-b border-white/10 bg-ink/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="container flex h-[72px] items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao topo">
          <BrandLogo variant="light" />
        </button>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Seções">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className="font-dm text-[15px] font-medium text-white/75 transition-colors hover:text-white">
              {n.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {role ? (
            <Link to={homeFor(role)} className="btn-primary shadow-glow">
              <ArrowLeft /> Voltar ao painel
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn border-[1.5px] border-white/20 text-white hover:border-white/40 hover:bg-white/5">
                Entrar
              </Link>
              <Link to="/cadastro-empresa" className="btn-primary shadow-glow">
                Começar grátis
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 text-white md:hidden" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="container animate-fade-up space-y-1 pb-6 md:hidden">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className="block w-full rounded-lg px-2 py-3 text-left font-dm text-base text-white/85 hover:bg-white/5">
              {n.label}
            </button>
          ))}
          {role ? (
            <Link to={homeFor(role)} className="btn-primary mt-3 w-full">
              <ArrowLeft /> Voltar ao painel
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Link to="/login" className="btn border-[1.5px] border-white/20 text-white">
                Entrar
              </Link>
              <Link to="/cadastro-empresa" className="btn-primary">
                Começar grátis
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

const SectionTitle = ({ eyebrow, title, text, light }: { eyebrow: string; title: string; text?: string; light?: boolean }) => (
  <div className="mx-auto max-w-2xl text-center">
    <p className={cn("eyebrow", light ? "text-primary-light" : "text-primary")}>{eyebrow}</p>
    <h2 className={cn("mt-3 font-sora text-3xl font-bold leading-tight md:text-[40px] text-balance", light ? "text-white" : "text-foreground")}>{title}</h2>
    {text && <p className={cn("mt-4 font-dm text-base leading-relaxed md:text-lg", light ? "text-white/65" : "text-muted-foreground")}>{text}</p>}
  </div>
);

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Building2, title: "Cadastre a empresa", text: "Em dois passos o RH cria a conta e já entra no painel administrativo." },
  { icon: Palette, title: "Aplique a sua marca", text: "Logo, cores e tela de login com pré-visualização ao vivo. Sem código." },
  { icon: Users, title: "Convide a equipe", text: "Cadastre colaboradores e matricule nos cursos. O acesso chega pelo WhatsApp." },
  { icon: BarChart3, title: "Acompanhe resultados", text: "Progresso, notas, certificados e engajamento em um só painel." },
];

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Layers, title: "Cursos em módulos", text: "Organize aulas em vídeo (YouTube/Vimeo) e texto, com carga horária e capa." },
  { icon: ClipboardCheck, title: "Avaliações com nota mínima", text: "Provas de múltipla escolha, limite de tentativas e correção automática." },
  { icon: Award, title: "Certificados automáticos", text: "Emitidos na aprovação, com código de verificação e a identidade da empresa." },
  { icon: BellRing, title: "Lembretes via WhatsApp", text: "Convites, novas aulas e lembretes de conclusão no app que a equipe já usa." },
  { icon: BarChart3, title: "Relatórios exportáveis", text: "Progresso por colaborador, notas e engajamento em CSV, prontos para o Excel." },
  { icon: Smartphone, title: "Feito para o celular", text: "Equipe de campo estuda entre uma tarefa e outra, sem precisar de computador." },
];

const FAQ = [
  ["Os colaboradores precisam criar conta?", "Não. A empresa cadastra cada colaborador no painel e o acesso é enviado por WhatsApp ou e-mail. Assim o RH controla quem entra e em quais cursos."],
  ["Posso usar a identidade visual da minha empresa?", "Sim. Na área de Personalização você define logo, cores principais, imagem e textos da tela de login. Os colaboradores acessam por um link exclusivo com a sua marca."],
  ["Como funcionam as avaliações?", "Cada curso pode ter uma prova de múltipla escolha com nota mínima e número de tentativas. A avaliação é liberada quando o colaborador conclui todas as aulas, e a correção é automática."],
  ["E os certificados?", "São emitidos automaticamente na aprovação, com carga horária, nota e código de verificação. O colaborador pode imprimir ou salvar em PDF."],
  ["Qual o papel do WhatsApp?", "A plataforma envia convites, avisos de novas aulas e lembretes para quem ainda não concluiu. O painel mostra mensagens enviadas, lidas e respondidas."],
  ["Este site é real?", "Esta é uma versão de portfólio: todos os dados são fictícios e o back-end é simulado no seu navegador. Fique à vontade para criar cursos, cadastrar colaboradores e testar tudo."],
];

const Landing = () => {
  usePageTitle("", `${BRAND.name} · ${BRAND.tagline}`);

  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <Navbar />

      {/* ============================== HERO ============================== */}
      <section className="brand-dark relative overflow-hidden bg-ink pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-primary/35 blur-[140px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[460px] w-[460px] rounded-full bg-highlight/25 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <ParticlesCanvas count={55} />

        <div className="container relative z-10 grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-dm text-xs font-medium text-white/80 backdrop-blur">
              <MessageCircle className="h-3.5 w-3.5 text-whatsapp" />
              LMS corporativo com WhatsApp integrado
            </span>
            <h1 className="mt-6 font-sora text-[clamp(36px,5.6vw,62px)] font-bold leading-[1.05] tracking-tight text-white text-balance">
              Treinamento que a sua equipe{" "}
              <span className="bg-gradient-to-r from-[#FDE68A] via-[#F5C842] to-[#E9A90E] bg-clip-text text-transparent">realmente conclui.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl font-dm text-lg font-light leading-relaxed text-white/65 lg:mx-0">
              A {BRAND.name} é a plataforma de estudos da sua empresa: cursos, avaliações e certificados com a <strong className="font-medium text-white">sua marca</strong>, e lembretes que chegam onde seus colaboradores já estão, no <strong className="font-medium text-white">WhatsApp</strong>.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/cadastro-empresa" className="btn-primary w-full px-6 py-3.5 text-[15px] shadow-glow sm:w-auto">
                Cadastrar minha empresa <ArrowRight />
              </Link>
              <Link to="/login" className="btn w-full border-[1.5px] border-white/20 px-6 py-3.5 text-[15px] text-white hover:bg-white/5 sm:w-auto">
                Ver demonstração
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 font-dm text-[13px] text-white/55 lg:justify-start">
              {["Sem instalar nada", "Sua identidade visual", "Funciona no celular"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary-light" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>

        <button
          onClick={() => scrollTo("problema")}
          className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce-soft text-white/40 hover:text-white md:block"
          aria-label="Rolar para a próxima seção"
        >
          <ChevronDown className="h-7 w-7" />
        </button>
      </section>

      {/* ============================ PROBLEMA ============================ */}
      <section id="problema" className="scroll-mt-20 bg-white py-20 md:py-28">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-primary">Por que a {BRAND.name}</p>
            <h2 className="mt-3 font-sora text-3xl font-bold leading-tight md:text-[40px] text-balance">
              Plataforma de curso não pode ser mais uma senha esquecida.
            </h2>
            <p className="mt-5 font-dm text-lg leading-relaxed text-muted-foreground">
              Equipes operacionais, de campo e de atendimento raramente param para abrir um computador. O resultado é conhecido:
              cursos comprados que ninguém termina e o RH cobrando conclusão em planilha.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { before: "Login esquecido e link perdido no e-mail", after: "Acesso e aulas chegam direto no WhatsApp" },
              { before: "Plataforma genérica, com cara de outra empresa", after: "Portal com logo, cores e textos da sua marca" },
              { before: "Controle de conclusão em planilha", after: "Progresso, notas e certificados em tempo real" },
              { before: "Certificado feito à mão, um por um", after: "Emissão automática na aprovação" },
            ].map((item, i) => (
              <Reveal key={item.after} delay={i * 80}>
                <div className="card h-full p-5">
                  <p className="font-dm text-[13px] text-muted-foreground line-through decoration-destructive/40">{item.before}</p>
                  <p className="mt-3 flex items-start gap-2 font-sora text-[15px] font-semibold leading-snug text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item.after}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== COMO FUNCIONA ========================== */}
      <section id="como-funciona" className="scroll-mt-16 bg-background py-20 md:py-28">
        <div className="container">
          <Reveal>
            <SectionTitle eyebrow="Como funciona" title="Do cadastro ao certificado em quatro passos" text="O fluxo foi desenhado para o RH configurar tudo sozinho, sem depender de TI." />
          </Reveal>
          <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="card relative h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-highlight text-white shadow-glow">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="font-sora text-4xl font-extrabold text-primary/10">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-sora text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 font-dm text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= RECURSOS ============================= */}
      <section id="recursos" className="brand-dark relative scroll-mt-16 overflow-hidden bg-ink py-20 md:py-28">
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-primary/25 blur-[130px]" />
        <div className="container relative">
          <Reveal>
            <SectionTitle light eyebrow="Recursos" title="Tudo o que um LMS corporativo precisa. Nada que atrapalhe." />
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-primary/50 hover:bg-white/[0.07]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary-light transition-colors group-hover:bg-primary group-hover:text-white">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-sora text-[17px] font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 font-dm text-sm leading-relaxed text-white/60">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ WHITE-LABEL ============================ */}
      <section id="sua-marca" className="scroll-mt-16 bg-white py-20 md:py-28">
        <div className="container">
          <Reveal>
            <WhiteLabelShowcase />
          </Reveal>
        </div>
      </section>

      {/* ============================= PÚBLICOS ============================= */}
      <section className="bg-background py-20 md:py-28">
        <div className="container grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-strong p-8 text-white md:p-10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
              <Building2 className="h-8 w-8 text-white/80" />
              <h3 className="mt-5 font-sora text-2xl font-bold">Para o RH e gestores</h3>
              <ul className="mt-5 space-y-3 font-dm text-[15px] text-white/85">
                {["Cadastro de colaboradores e matrícula em lote", "Editor de cursos com módulos, aulas e prova", "Dashboard de engajamento e conclusão", "Relatórios em CSV e lembretes por WhatsApp"].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <Link to="/cadastro-empresa" className="btn mt-8 bg-white text-primary hover:bg-white/90">
                Cadastrar empresa <ArrowRight />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-3xl border-[1.5px] border-primary/25 bg-white p-8 md:p-10">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h3 className="mt-5 font-sora text-2xl font-bold text-foreground">Para os colaboradores</h3>
              <ul className="mt-5 space-y-3 font-dm text-[15px] text-muted-foreground">
                {["Acesso pelo link da empresa, sem criar conta", "Aulas curtas, retomando de onde parou", "Avaliação liberada ao fim das aulas", "Certificados e feedbacks do RH em um só lugar"].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}
                  </li>
                ))}
              </ul>
              <Link to="/e/vertice" className="btn-outline mt-8">
                Ver portal do colaborador
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================ FAQ ================================ */}
      <section id="faq" className="scroll-mt-16 bg-white py-20 md:py-28">
        <div className="container max-w-3xl">
          <Reveal>
            <Selo name="duvidas" className="mx-auto mb-6 h-32 -rotate-3" />
            <SectionTitle eyebrow="Dúvidas frequentes" title="Perguntas que o RH sempre faz" />
          </Reveal>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q} className="card overflow-hidden border px-5">
                <AccordionTrigger className="py-5 text-left font-sora text-[15px] font-semibold hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="pb-5 font-dm text-[15px] leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ================================ CTA ================================ */}
      <section className="px-5 pb-20 md:pb-28">
        <Reveal>
          <div className="brand-dark container relative overflow-hidden rounded-[32px] bg-ink px-6 py-16 text-center md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-highlight/30" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
            <div className="relative">
              <Selo name="anuncios" className="mx-auto h-32 rotate-2 md:h-36" />
              <h2 className="mx-auto mt-5 max-w-2xl font-sora text-3xl font-bold text-white md:text-[42px] md:leading-tight text-balance">
                Os estudos da sua equipe no ar ainda hoje.
              </h2>
              <p className="mx-auto mt-4 max-w-lg font-dm text-base text-white/65">Crie a conta, personalize a marca e publique o primeiro curso em poucos minutos.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/cadastro-empresa" className="btn-primary px-6 py-3.5 shadow-glow">
                  Começar grátis <ArrowRight />
                </Link>
                <Link to="/login" className="btn border-[1.5px] border-white/20 px-6 py-3.5 text-white hover:bg-white/5">
                  Explorar a demonstração
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================== RODAPÉ ============================== */}
      <footer className="brand-dark bg-ink text-white">
        <div className="container grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <BrandLogo variant="light" />
            <p className="mt-4 max-w-xs font-dm text-sm leading-relaxed text-white/55">Educação corporativa com a sua marca e lembretes via WhatsApp, para equipes que crescem.</p>
          </div>
          <div>
            <h4 className="font-sora text-sm font-semibold">Produto</h4>
            <ul className="mt-4 space-y-2.5 font-dm text-sm text-white/60">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button onClick={() => scrollTo(n.id)} className="hover:text-white">
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-sora text-sm font-semibold">Acesso</h4>
            <ul className="mt-4 space-y-2.5 font-dm text-sm text-white/60">
              <li><Link to="/login" className="hover:text-white">Entrar</Link></li>
              <li><Link to="/cadastro-empresa" className="hover:text-white">Cadastrar empresa</Link></li>
              <li><Link to="/e/vertice" className="hover:text-white">Portal Vértice (demo)</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container flex flex-col items-center justify-between gap-3 py-6 font-dm text-xs text-white/40 md:flex-row">
            <p>© {new Date().getFullYear()} {BRAND.name} · Versão de portfólio com dados fictícios e back-end simulado.</p>
            <DemoResetButton className="hover:text-white" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
