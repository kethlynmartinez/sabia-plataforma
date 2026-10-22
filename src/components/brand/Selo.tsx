import { cn } from "@/lib/utils";
import logo from "@/assets/selos/logo.webp";
import duvidas from "@/assets/selos/duvidas.webp";
import anuncios from "@/assets/selos/anuncios.webp";
import conquista from "@/assets/selos/conquista.webp";
import erro from "@/assets/selos/erro.webp";

/**
 * Selos do sabiá-una, um para cada tipo de momento do site:
 * logo, dúvidas, anúncios, conquistas (aprovação) e erros.
 */
const SELOS = {
  logo: { src: logo, w: 375, h: 415 },
  duvidas: { src: duvidas, w: 357, h: 382 },
  anuncios: { src: anuncios, w: 369, h: 367 },
  conquista: { src: conquista, w: 411, h: 383 },
  erro: { src: erro, w: 401, h: 429 },
};

export type SeloName = keyof typeof SELOS;

export const Selo = ({ name, className }: { name: SeloName; className?: string }) => {
  const s = SELOS[name];
  return (
    <img
      src={s.src}
      width={s.w}
      height={s.h}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={cn("pointer-events-none h-28 w-auto select-none object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)]", className)}
    />
  );
};
