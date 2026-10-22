import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ParticlesCanvas } from "@/components/ParticlesCanvas";

interface Props {
  title: ReactNode;
  subtitle: string;
  bullets?: string[];
  children: ReactNode;
}

/** Layout das telas de acesso, sempre na identidade padrão da plataforma. */
export const AuthLayout = ({ title, subtitle, bullets, children }: Props) => (
  <div className="flex min-h-screen bg-background">
    {/* Painel de marca */}
    <aside className="brand-dark relative hidden w-[44%] max-w-[640px] overflow-hidden bg-ink lg:flex lg:flex-col">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[380px] w-[380px] rounded-full bg-highlight/30 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <ParticlesCanvas count={40} />

      <div className="relative z-10 flex flex-1 flex-col px-12 py-10 xl:px-16">
        <Link to="/" aria-label="Voltar para o início" className="w-fit">
          <BrandLogo variant="light" />
        </Link>

        <div className="my-auto max-w-md py-12">
          <h2 className="font-sora text-[36px] font-bold leading-[1.15] text-white text-balance">{title}</h2>
          <p className="mt-4 font-dm text-base leading-relaxed text-white/65">{subtitle}</p>
          {bullets && (
            <ul className="mt-8 space-y-3.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 font-dm text-[15px] text-white/80">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-light" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="font-dm text-xs text-white/40">Versão de portfólio com dados fictícios.</p>
      </div>
    </aside>

    {/* Formulário */}
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5 py-5 lg:hidden">
        <Link to="/" aria-label="Voltar para o início">
          <BrandLogo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8 lg:py-12">
        <div className="w-full max-w-[440px] animate-fade-up">{children}</div>
      </div>
    </main>
  </div>
);
