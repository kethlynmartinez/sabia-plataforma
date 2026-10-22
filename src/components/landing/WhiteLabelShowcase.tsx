import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, Home, UserRound } from "lucide-react";
import { themeStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SAMPLES = [
  { key: "padrao", company: "Padrão da plataforma", name: "Sabiá Estudos", initials: "SE", primary: "#272A2E", highlight: "#E9B21F" },
  { key: "vertice", company: "Vértice Logística", name: "Vértice Aprende", initials: "VA", primary: "#0F766E", highlight: "#F59E0B" },
  { key: "aurora", company: "Clínica Aurora", name: "Escola Aurora", initials: "EA", primary: "#BE185D", highlight: "#0EA5E9" },
] as const;

/** Mini-app que troca de identidade visual ao vivo — o white-label na prática. */
export const WhiteLabelShowcase = () => {
  const [active, setActive] = useState<(typeof SAMPLES)[number]>(SAMPLES[1]);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="eyebrow text-primary">White-label de verdade</p>
        <h2 className="mt-3 font-sora text-3xl font-bold leading-tight text-foreground md:text-[40px] text-balance">
          A tecnologia é nossa. A experiência é da sua empresa.
        </h2>
        <p className="mt-4 font-dm text-base leading-relaxed text-muted-foreground">
          Logo, cores, imagem e textos da tela de login são configurados pelo próprio RH, com pré-visualização ao vivo. Cada colaborador
          entra por um link exclusivo e vê só a marca da empresa dele.
        </p>

        <div className="mt-7 space-y-2.5" role="radiogroup" aria-label="Exemplos de identidade visual">
          {SAMPLES.map((s) => (
            <button
              key={s.key}
              role="radio"
              aria-checked={active.key === s.key}
              onClick={() => setActive(s)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border bg-white px-4 py-3.5 text-left transition-all",
                active.key === s.key ? "border-foreground/80 shadow-card" : "border-border hover:border-foreground/30",
              )}
            >
              <span className="flex -space-x-2">
                <span className="h-7 w-7 rounded-full ring-2 ring-white" style={{ background: s.primary }} />
                <span className="h-7 w-7 rounded-full ring-2 ring-white" style={{ background: s.highlight }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sora text-sm font-semibold text-foreground">{s.company}</span>
                <span className="block font-dm text-xs text-muted-foreground">{s.name}</span>
              </span>
              <span className={cn("h-4 w-4 rounded-full border-2", active.key === s.key ? "border-[5px] border-foreground" : "border-border")} />
            </button>
          ))}
        </div>

        <Link to="/e/vertice" className="mt-7 inline-flex items-center gap-2 font-dm text-sm font-semibold text-primary hover:underline">
          Ver o portal real da Vértice (demo) <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Pré-visualização com tema escopado via CSS variables */}
      <div style={themeStyle(active.primary, active.highlight)} className="relative">
        <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-primary/25 to-highlight/25 blur-2xl transition-colors duration-500" />
        <div className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-card-lg">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-2.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-3 truncate rounded-md bg-white px-3 py-0.5 font-dm text-[11px] text-muted-foreground">
              portal.exemplo/e/{active.key}
            </span>
          </div>
          <div className="flex min-h-[340px]">
            <aside className="hidden w-[170px] shrink-0 border-r border-border p-3 sm:block">
              <div className="flex items-center gap-2 px-1 pb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-sora text-[10px] font-bold text-primary-foreground transition-colors duration-500">
                  {active.initials}
                </span>
                <span className="truncate font-sora text-[11px] font-bold">{active.name}</span>
              </div>
              {[
                [Home, "Início", true],
                [BookOpen, "Meus cursos", false],
                [Award, "Certificados", false],
                [UserRound, "Meu perfil", false],
              ].map(([Icon, label, on]) => {
                const I = Icon as typeof Home;
                return (
                  <div
                    key={label as string}
                    className={cn(
                      "mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 font-dm text-[11px] font-medium transition-colors duration-500",
                      on ? "bg-primary text-primary-foreground" : "text-foreground/60",
                    )}
                  >
                    <I className="h-3.5 w-3.5" /> {label as string}
                  </div>
                );
              })}
            </aside>
            <div className="flex-1 bg-background p-4 sm:p-5">
              <p className="font-sora text-sm font-bold">Boa tarde, Lucas 👋</p>
              <p className="font-dm text-[11px] text-muted-foreground">Continue de onde parou</p>
              <div className="mt-4 rounded-xl border border-border bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="chip bg-primary-soft px-2 py-0.5 text-[10px] text-primary transition-colors duration-500">Segurança</span>
                  <span className="font-dm text-[10px] font-semibold text-primary">65%</span>
                </div>
                <p className="mt-2 font-sora text-[12px] font-semibold">Operação de Empilhadeiras</p>
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div className="h-full w-[65%] rounded-full bg-primary transition-colors duration-500" />
                </div>
                <span className="mt-3 inline-block rounded-md bg-primary px-2.5 py-1 font-dm text-[10px] font-semibold text-primary-foreground transition-colors duration-500">
                  Continuar aula
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-white p-3">
                  <p className="font-dm text-[10px] text-muted-foreground">Certificados</p>
                  <p className="font-sora text-lg font-bold">3</p>
                  <span className="mt-1 block h-1 w-8 rounded-full bg-highlight transition-colors duration-500" />
                </div>
                <div className="rounded-xl border border-border bg-white p-3">
                  <p className="font-dm text-[10px] text-muted-foreground">Avaliação pendente</p>
                  <p className="font-sora text-lg font-bold">1</p>
                  <span className="mt-1 block h-1 w-8 rounded-full bg-highlight transition-colors duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
